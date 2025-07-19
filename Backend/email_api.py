import os
from dotenv import load_dotenv
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import JSONResponse
from supabase_client import supabase
import random
import jwt
from datetime import datetime, timedelta
from fastapi import status
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
import httpx
import bcrypt

load_dotenv()
router = APIRouter()

# Use environment variables for base URLs
FRONTEND_BASE_URL = os.getenv("FRONTEND_BASE_URL", "http://localhost:8080")
BACKEND_BASE_URL = os.getenv("BACKEND_BASE_URL", "http://localhost:8000")

JWT_SECRET = os.getenv("EMAIL_VERIFICATION_SECRET", "super-secret-key")
JWT_ALGORITHM = "HS256"
VERIFICATION_TOKEN_EXPIRY = 30  # minutes

SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY")
FROM_EMAIL = os.getenv("EMAIL_SENDER", "your_verified_sender@example.com")

RESET_TOKEN_EXPIRY = 15  # minutes

def generate_verification_token(email: str):
    payload = {
        "email": email,
        "exp": datetime.utcnow() + timedelta(minutes=VERIFICATION_TOKEN_EXPIRY)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_verification_token(token: str):
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload["email"]
    except jwt.ExpiredSignatureError:
        return None, "expired"
    except jwt.InvalidTokenError:
        return None, "invalid"


def send_verification_email(email: str, token: str):
    try:
        verification_link = f"{FRONTEND_BASE_URL}/setup-account?token={token}"
        message = Mail(
            from_email=FROM_EMAIL,
            to_emails=email,
            subject="Verify your Wheely Account",
            html_content=f"""
                <p>Hello,</p>
                <p>Thank you for signing up with <strong>Wheely</strong>. To complete your email verification, please click the link below:</p>
                <p><a href=\"{verification_link}\">Verify your email address</a></p>
                <p>This secure link will expire in 30 minutes.</p>
                <p>If you did not request this, please ignore this email.</p>
                <p>— The Wheely Team</p>
                """
        )
        sg = SendGridAPIClient(SENDGRID_API_KEY)
        response = sg.send(message)
        print("✅ Verification email sent:", response.status_code)
        return True
    except Exception as e:
        print("❌ Error sending verification email:", e)
        return False

# Utility to generate password reset token
def generate_reset_token(email: str, user_id: str):
    payload = {
        "email": email,
        "sub": user_id,
        "exp": datetime.utcnow() + timedelta(minutes=RESET_TOKEN_EXPIRY)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

# Utility to send password reset email
def send_password_reset_email(email: str, token: str):
    try:
        reset_link = f"{FRONTEND_BASE_URL}/reset-password?token={token}"
       
        message = Mail(
            from_email=FROM_EMAIL,
            to_emails=email,
            subject="Reset your Wheely Password",
            html_content=f"""
                <p>Hi,</p>
                <p>We received a request to reset your password for <strong>Wheely</strong>.</p>
                <p>Click the link below to create a new password:</p>
                <p><a href='{reset_link}'>Reset Now</a></p>
                <p>If you didn't request this, you can safely ignore it.</p>
                <p>— The Wheely Team</p>
            """
        )
        sg = SendGridAPIClient(SENDGRID_API_KEY)
        response = sg.send(message)
        print("✅ Password reset email sent:", response.status_code)
        return True
    except Exception as e:
        print("❌ Error sending password reset email:", e)
        return False

@router.post("/api/send-verification-link")
async def send_verification_link(request: Request):
    data = await request.json()
    email = data.get("email")
    if not email:
        return {"success": False, "message": "Email is required"}
    print(f"📧 [SEND-VERIFICATION-LINK] Incoming email: {email}")
    result = supabase.table("users").select("email").eq("email", email).execute()
    if not result.data or len(result.data) == 0:
        print("❌ [SEND-VERIFICATION-LINK] Email not found in users table")
        return {
            "success": False,
            "message": "Unauthorized email. Please use a registered company email."
        }
    token = generate_verification_token(email)
    # Store the token in the DB
    supabase.table("users").update({"verification_token": token}).eq("email", email).execute()
    success = send_verification_email(email, token)
    if success:
        print(f"✅ Verification link sent to {email}")
        return {"success": True, "message": f"Verification link sent to {email}"}
    else:
        print(f"❌ Failed to send verification email to {email}")
        return {"success": False, "message": "Failed to send verification email"}

@router.post("/api/verify-email")
async def verify_email(request: Request):
    data = await request.json()
    token = data.get("token")
    if not token:
        return {"success": False, "message": "Verification token required"}
    print("Token received:", token)
    # Decode the token and get the email
    email, error = decode_verification_token(token), None
    if isinstance(email, tuple):
        email, error = email
    if error == "expired":
        return {"success": False, "message": "Verification link expired"}
    if error == "invalid" or not email:
        return {"success": False, "message": "Invalid verification link"}
    # Mark user as verified and clear the token
    result = supabase.table("users").update({"is_verified": True, "verification_token": None}).eq("email", email).execute()
    if result:
        return {"success": True, "message": "Email verified", "email": email}
    else:
        return {"success": False, "message": "Failed to verify email"}

@router.post("/auth/request-password-reset")
async def request_password_reset(request: Request):
    data = await request.json()
    email = data.get("email")
    if not email:
        return {"success": False, "message": "Email is required"}
    print(f"📧 [REQUEST-PASSWORD-RESET] Incoming email: {email}")
    result = supabase.table("users").select("user_id, email").eq("email", email).single().execute()
    user = getattr(result, "data", None)
    if user:
        token = generate_reset_token(user["email"], user["user_id"])
        send_password_reset_email(user["email"], token)
    # Always return generic success
    return {"success": True, "message": "If an account exists, a reset link has been sent."}

@router.post("/auth/reset-password")
async def reset_password(request: Request):
    data = await request.json()
    token = data.get("token")
    new_password = data.get("new_password")
    if not token or not new_password:
        return {"success": False, "message": "Token and new password are required."}
    # Verify token
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        email = payload.get("email")
    except jwt.ExpiredSignatureError:
        return {"success": False, "message": "Reset link expired."}
    except jwt.InvalidTokenError:
        return {"success": False, "message": "Invalid or tampered reset link."}
    # Hash new password
    hashed_password = bcrypt.hashpw(new_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    # Update password in users table
    result = supabase.table("users").update({"password": hashed_password}).eq("user_id", user_id).execute()
    if getattr(result, "data", None) is not None and len(result.data) > 0:
        return {"success": True, "message": "Your password has been reset successfully!"}
    else:
        return {"success": False, "message": "Failed to update password. Please try again."}

@router.post("/api/setup-account")
async def setup_account(request: Request):
    data = await request.json()
    email = data.get("email")
    username = data.get("username")
    password = data.get("password")
    role = data.get("role")
    if not (email and username and password and role):
        return {"success": False, "message": "All fields are required"}
    # Check role in DB
    user_result = supabase.table("users").select("role").eq("email", email).execute()
    if not user_result.data or len(user_result.data) == 0:
        return {"success": False, "message": "User not found"}
    db_role = user_result.data[0]["role"]
    if db_role.strip().lower() != role.strip().lower():
        return {"success": False, "message": "Role mismatch. Please select the correct role assigned to your account."}
    # Hash the password using bcrypt
    hashed_password = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    # Update user in DB (only username and password)
    result = supabase.table("users").update({
        "username": username,
        "password": hashed_password
    }).eq("email", email).execute()
    if not result:
        return {"success": False, "message": "Failed to update user info"}
    # Proxy login to login_api
    try:
        async with httpx.AsyncClient() as client:
            login_response = await client.post(
                f"{BACKEND_BASE_URL}/api/login",
                json={"username": username, "password": password}
            )
            login_data = login_response.json()
            return login_data
    except Exception as e:
        return {"success": False, "message": f"Auto-login failed: {str(e)}"}

