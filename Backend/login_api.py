from fastapi import FastAPI, Request, APIRouter, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from supabase_client import supabase  # ✅ import your Supabase client
from rag import authenticate_user, current_user,get_conversation_context, UserSession, get_llm_sql, clean_sql_output, try_select_sql, sql_result_to_context, rewrite_query_for_rag, preprocess_query, get_embedding, extract_metadata_with_llm, vector_store_similarity_search, vector_rows_to_context, get_llm_final_response, get_user_by_username
import rag

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

        user_session = get_user_by_username(username)
        print(f"[DEBUG] get_user_by_username result: {user_session}")
        if not user_session:
            print(f"❌ [ERROR] No matching user found for username: {username}")
            return JSONResponse(status_code=401, content={"success": False, "message": f"Unauthorized: No user found for {username}"})

        rag.current_user = user_session

        if rag.current_user is None:
            print("ERROR: current_user is not set!")
            return ""

        # Now it's safe to call any function that uses current_user
        context = get_conversation_context()

        # --- Begin RAG query logic (from rag.py main) ---
        # SQL
        sql = get_llm_sql(user_query)
        sql = clean_sql_output(sql)
        print("DEBUG: SQL:", sql)
        sql_context = "No results found."
        if sql.strip().upper() != "NO_SQL" and sql.strip().lower().startswith("select"):
            sql_result, sql_error = try_select_sql(sql)
            if sql_result:
                sql_context = sql_result_to_context(sql_result)
                print("SQL Result:", sql_context)
                print("=" * 50)

        # RAG
        rewritten_query = rewrite_query_for_rag(user_query)
        query_embedding = get_embedding(preprocess_query(rewritten_query))
        metadata_filter = extract_metadata_with_llm(user_query)
        vector_rows = vector_store_similarity_search(
            query_embedding,
            top_k=10,
            metadata_filter=metadata_filter,
            similarity_threshold=0.08
        )
        rag_context = vector_rows_to_context(vector_rows) if vector_rows else "No relevant vector context found."
        if vector_rows:
            print("RAG Vector Search Result:")
            print(rag_context)
        else:
            print("RAG Vector Search: No relevant results found.")

        # Final Response
        print("=" * 50)
        print("Final Response Generation")
        print("=" * 50)
        answer = get_llm_final_response(sql_context, rag_context, user_query)
        print(f"shivam : {answer}")
        # --- End RAG query logic ---

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

@app.post("/api/login")
async def login(request: Request):
    print("\n✅ /api/login endpoint called")
    try:
        data = await request.json()
        username = data.get("username")
        password = data.get("password")
        print(f"➡ Username: {username}")
        print(f"➡ Password: {password}")
        # Directly call authenticate_user from rag.py
        user_session = authenticate_user(username, password)
        print(f"[DEBUG] authenticate_user result: {user_session}")
        if user_session:
            # Optionally print user details for debugging
            print(f"[DEBUG] Authenticated user: {user_session.username}, Role: {user_session.role}, Dealer ID: {user_session.dealer_id}")
            return {
                "success": True,
                "message": "Login successful",
                "user": {
                    "user_id": user_session.user_id,
                    "username": user_session.username,
                    "role": user_session.role,
                    "dealer_id": user_session.dealer_id,
                    "dealer_name": user_session.dealer_name,
                    "sales_rep_id": user_session.sales_rep_id,
                    "sales_rep_name": user_session.sales_rep_name
                }
            }
        else:
            return {
                "success": False,
                "message": "Invalid credentials"
            }
    except Exception as e:
        print(f"❌ Error in /api/login: {str(e)}")
        return JSONResponse(status_code=500, content={
            "success": False,
            "message": "Internal server error",
            "error": str(e)
        })
