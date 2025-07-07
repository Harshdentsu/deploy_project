import os
from dotenv import load_dotenv
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import JSONResponse
from supabase_client import supabase
from rag import process_user_query, current_user, UserSession
import random
import jwt
from datetime import datetime, timedelta
from fastapi import status
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

load_dotenv()
router = APIRouter()

JWT_SECRET = os.getenv("EMAIL_VERIFICATION_SECRET", "super-secret-key")
JWT_ALGORITHM = "HS256"
VERIFICATION_TOKEN_EXPIRY = 30  # minutes

SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY")
FROM_EMAIL = os.getenv("EMAIL_SENDER", "your_verified_sender@example.com")

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
        verification_link = f"http://localhost:8080/setup-account?token={token}"
        message = Mail(
            from_email=FROM_EMAIL,
            to_emails=email,
            subject="Verify your Wheely Account",
            html_content=f"""
                <p>Hello,</p>
                <p>Thank you for signing up with <strong>Wheely</strong>. To complete your email verification, please click the link below:</p>
                <p><a href="{verification_link}">Verify your email address</a></p>
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

def get_user_session_by_username(username):
    normalized_username = username.strip().lower().replace('.', '')
    result = supabase.table("users").select("*").execute()
    if result.data and len(result.data) > 0:
        for user in result.data:
            db_username = user["username"].strip().lower().replace('.', '')
            if db_username == normalized_username:
                return UserSession(
                    user_id=user["user_id"],
                    username=user["username"],
                    role=user["role"],
                    dealer_id=user.get("dealer_id"),
                )
    print(f"[ERROR] No user found for username: {username}")
    return None
