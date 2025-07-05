from fastapi import FastAPI, Request, APIRouter, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from supabase_client import supabase  # ✅ import your Supabase client
from rag import authenticate_user, current_user, process_user_query  # Import your RAG logic
from rag import UserSession 
from passlib.hash import bcrypt

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_user_session_by_username(username):
    # Normalize username: lowercase and remove dots for matching
    normalized_username = username.strip().lower().replace('.', '')
    # Fetch all users and match normalized username
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
#this is for checking username and password with database
@app.post("/api/login")
async def login(request: Request):
    print("\n✅ /api/login endpoint called")

    try:
        data = await request.json()
        username = data.get("username")
        password = data.get("password")
        role = data.get("role")
        
        print(f"➡ Username: {username}")
        print(f"➡ Password: {password}")
        print(f"➡ Role: {role}")
        username = username.strip()
        password = password.strip()
        role = role.strip().lower()
        # ✅ Query the users table by username only
        result = supabase.table("users").select("*") \
            .eq("username", username) \
            .execute()

        print("🔍 Supabase result:", result)

        if result.data and len(result.data) > 0:
            user = result.data[0]
            # Check password hash
            if not bcrypt.verify(password, user["password"]):
                return {
                    "success": False,
                    "message": "Invalid credentials (password mismatch)"
                }
            # Check role
            if user["role"].strip().lower() != role:
                return {
                    "success": False,
                    "message": "Invalid credentials (role mismatch)"
                }
            return {
                "success": True,
                "message": "Login successful",
                "user": user
            }
        else:
            return {
                "success": False,
                "message": "Invalid credentials (user not found)"
            }

    except Exception as e:
        print(f"❌ Error in /api/login: {str(e)}")
        return JSONResponse(status_code=500, content={
            "success": False,
            "message": "Internal server error",
            "error": str(e)
        })

# this is for dealer role based masking 
@app.post("/api/query")
async def query(request: Request):
    print("🚀 [DEBUG] /api/query endpoint hit")

    try:
        data = await request.json()
        username = data.get("username")
        user_query = data.get("query")

        print(f"👤 [DEBUG] Incoming query from user: {username}")
        print(f"💬 [DEBUG] User query: {user_query}")

        # Step 1: Get user session
        print("🔍 [DEBUG] Looking up user session...")
        user_session = get_user_session_by_username(username)

        if not user_session:
            print(f"❌ [ERROR] No matching user found for username: {username}")
            return JSONResponse(status_code=401, content={"success": False, "message": "Unauthorized"})

        print(f"✅ [DEBUG] User session retrieved: {user_session.username}, Role: {user_session.role}, Dealer ID: {user_session.dealer_id}")

        # Step 2: Set current_user globally for use in rag logic
        global current_user
        current_user = user_session

        # Step 3: Process the query
        print("🧠 [DEBUG] Passing query to process_user_query()...")
        answer = process_user_query(user_query, user_session)

        print("📤 [DEBUG] Answer received from RAG pipeline or order placement logic.")
        print(f"📝 [DEBUG] Final answer:\n{answer}")

        return {"success": True, "answer": answer}

    except Exception as e:
        print(f"🔥 [ERROR] Exception occurred in /api/query: {e}")
        return JSONResponse(status_code=500, content={"success": False, "message": str(e)})

@app.post("/api/setup-account")
async def setup_account(request: Request):
    data = await request.json()
    email = data["email"]
    username = data["username"]
    password = data["password"]
    role = data["role"]

    # 1. Fetch the user by email
    response = supabase.table("users").select("role, is_verified").eq("email", email).single().execute()
    user = None
    if hasattr(response, "data"):
        user = response.data
    elif isinstance(response, dict):
        user = response.get("data")

    if not user:
        raise HTTPException(status_code=404, detail="User with this email does not exist.")

    # 2. Check if the user is verified
    if not user.get("is_verified", False):
        raise HTTPException(status_code=403, detail="Email not verified.")

    # 3. Check if the role matches
    if user["role"].strip().lower() != role.strip().lower():
        raise HTTPException(status_code=403, detail="Role does not match the assigned role.")

    # 4. If all checks pass, update username and password
    hashed_password = bcrypt.hash(password)
    update_response = supabase.table("users").update({
        "username": username,
        "password": hashed_password
    }).eq("email", email).execute()

    # Check for update errors
    if hasattr(update_response, "error") and update_response.error is not None:
        raise HTTPException(status_code=400, detail=str(update_response.error))

    return {"success": True}
