from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from supabase_client import supabase
from rag import (
    authenticate_user, current_user, get_conversation_context, UserSession, get_llm_sql,
    clean_sql_output, try_select_sql, sql_result_to_context, rewrite_query_for_rag,
    preprocess_query, get_embedding, extract_metadata_with_llm,
    vector_store_similarity_search, vector_rows_to_context, get_llm_final_response,
    get_user_by_username, create_order_request, extract_order_details, resolve_product_id, resolve_dealer_id, place_order, resolve_warehouse_id
)
import sys
import psycopg2
import os

router = APIRouter()
pending_orders = {}

@router.post("/api/query")
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
        if user_session:
            print(f"[DEBUG] user_session.sales_rep_id: {user_session.sales_rep_id}")
        else:
            print(f"[DEBUG] No user session found for username: {username}")    
        if not user_session:
            print(f"❌ [ERROR] No matching user found for username: {username}")
            return JSONResponse(status_code=401, content={"success": False, "message": f"Unauthorized: No user found for {username}"})

        import rag
        rag.current_user = user_session

        if rag.current_user is None:
            print("ERROR: current_user is not set!")
            return ""

        confirmation_phrases = ["yes", "confirm", "place order", "yep", "sure", "okay", "ok"]
        negative_phrases = ["no", "cancel", "don't", "do not", "nah"]

        # --- DB-based pending order confirmation ---
        def get_pending_order_for_sales_rep(sales_rep_id):
            try:
                conn = psycopg2.connect(
                    dbname=os.getenv("dbname"),
                    user=os.getenv("user"),
                    password=os.getenv("password"),
                    host=os.getenv("host"),
                    port=os.getenv("port")
                )
                cur = conn.cursor()
                cur.execute("""
                    SELECT request_id, dealer_id, product_id, quantity, NULL as warehouse_id
                    FROM order_requests
                    WHERE sales_rep_id = %s AND status = 'pending'
                    ORDER BY created_at DESC
                    LIMIT 1
                """, (sales_rep_id,))
                row = cur.fetchone()
                cur.close()
                conn.close()
                if row:
                    return {
                        "request_id": row[0],
                        "dealer_id": row[1],
                        "product_id": row[2],
                        "quantity": row[3],
                        "warehouse_id": row[4]
                    }
                return None
            except Exception as e:
                print(f"Error fetching pending order: {e}")
                return None

        def mark_order_request_placed(request_id):
            try:
                conn = psycopg2.connect(
                    dbname=os.getenv("dbname"),
                    user=os.getenv("user"),
                    password=os.getenv("password"),
                    host=os.getenv("host"),
                    port=os.getenv("port")
                )
                cur = conn.cursor()
                cur.execute("UPDATE order_requests SET status = 'placed' WHERE request_id = %s", (request_id,))
                conn.commit()
                cur.close()
                conn.close()
            except Exception as e:
                print(f"Error updating order request status: {e}")

        # --- Confirmation step ---
        if any(phrase in user_query.lower() for phrase in confirmation_phrases):
            print(f"[DEBUG] Checking for pending order for sales_rep_id: {user_session.sales_rep_id}")
            pending_order = get_pending_order_for_sales_rep(user_session.sales_rep_id)
            print(f"[DEBUG] Pending order found: {pending_order}")
            if pending_order:
                print(f"[DEBUG] Attempting to place order with details: {pending_order}")
                response_obj = place_order(
                    pending_order["dealer_id"], pending_order["product_id"], pending_order["quantity"], pending_order.get("warehouse_id")
                )
                print(f"[DEBUG] place_order response: {response_obj}")
                if response_obj["success"]:
                    mark_order_request_placed(pending_order["request_id"])
                    details = response_obj.get("details", {})
                    ai_prompt = (
                        f"The sales representative has successfully placed an order for dealer '{pending_order['dealer_id']}' "
                        f"of {pending_order['quantity']} units of product '{pending_order['product_id']}'. "
                        f"Generate a friendly, professional confirmation message for the sales rep, including the order details: {details}."
                    )
                    ai_response = get_llm_final_response("", "", ai_prompt)
                    print(f"[DEBUG] AI confirmation response: {ai_response}")
                    return {"success": True, "answer": ai_response, "details": details}
                else:
                    ai_prompt = (
                        f"Failed to place an order for dealer '{pending_order['dealer_id']}'. "
                        f"Reason: {response_obj['message']}. Generate a helpful error message for the sales rep."
                    )
                    ai_response = get_llm_final_response("", "", ai_prompt)
                    print(f"[DEBUG] AI error response: {ai_response}")
                    return {"success": False, "answer": ai_response}
            else:
                print("[DEBUG] No pending order found to confirm for this sales rep.")
                return {"success": False, "answer": "No pending order found to confirm."}
        elif any(phrase in user_query.lower() for phrase in negative_phrases):
            # Optionally, you can mark the pending order as 'cancelled' in the DB
            return {"success": True, "answer": "❌ Order cancelled."}

        # --- Dealer order request ---
        if user_session.is_dealer():
            print("DEBUG: User is dealer")
            extracted = extract_order_details(user_query)
            intent = extracted.get("intent", "unknown")
            print("DEBUG: Dealer intent:", intent)

            if intent == "order":
                product_id = extracted.get("product_id")
                if not product_id and "product_name" in extracted:
                    product_id = resolve_product_id(extracted["product_name"])
                    print(f"DEBUG: Resolved product_id for '{extracted['product_name']}': {product_id}")
                quantity = extracted.get("quantity")
                dealer_id = user_session.dealer_id
                sales_rep_id = user_session.sales_rep_id

                if not all([dealer_id, sales_rep_id, product_id, quantity]):
                    return {"success": False, "answer": "❌ Missing order details. Please specify product and quantity."}

                # ✅ Insert order request
                result = create_order_request(dealer_id, sales_rep_id, product_id, quantity)
                print("DEBUG: create_order_request result:", result)
                if result["success"]:
                    ai_prompt = (
                        f"The dealer '{user_session.dealer_name}' (ID: {user_session.dealer_id}) has requested an order "
                        f"of {quantity} units of product '{product_id}'. "
                        f"Generate a friendly, professional confirmation message for the dealer, mentioning that the order request has been sent to their sales representative."
                    )
                    ai_response = get_llm_final_response("", "", ai_prompt)
                    return {"success": True, "answer": ai_response}
                else:
                    ai_prompt = (
                        f"Failed to create an order request for dealer '{user_session.dealer_name}'. "
                        f"Reason: {result['message']}. Generate a helpful error message for the dealer."
                    )
                    ai_response = get_llm_final_response("", "", ai_prompt)
                    return {"success": False, "answer": ai_response}

        # --- Sales rep order request (two-step confirmation) ---
        if rag.current_user.is_sales_rep():
            print("DEBUG: User is sales rep")
            extracted = extract_order_details(user_query)
            print("DEBUG: Extracted order details:", extracted)
            intent = extracted.get("intent", "unknown")
            print("DEBUG: Intent:", intent)

            if intent == "order":
                product_id = extracted.get("product_id")
                dealer_id = extracted.get("dealer_id")
                quantity = extracted.get("quantity")
                warehouse_id = extracted.get("warehouse_id")

                if not dealer_id and "dealer_name" in extracted:
                    dealer_id = resolve_dealer_id(extracted["dealer_name"])
                    print(f"DEBUG: Resolved dealer_id for '{extracted['dealer_name']}': {dealer_id}")
                if not product_id and "product_name" in extracted:
                    product_id = resolve_product_id(extracted["product_name"])
                    print(f"DEBUG: Resolved product_id for '{extracted['product_name']}': {product_id}")

                if warehouse_id and not warehouse_id.startswith("W"):
                    resolved_warehouse_id = resolve_warehouse_id(warehouse_id)
                    if resolved_warehouse_id:
                        warehouse_id = resolved_warehouse_id

                if not product_id or not quantity or not dealer_id:
                    return {"success": False, "answer": "❌ Missing order details. Please specify dealer, product, and quantity."}
                
                # Insert pending order into order_requests with status 'pending'
                result = create_order_request(dealer_id, user_session.sales_rep_id, product_id, quantity)
                print("DEBUG: create_order_request result:", result)
                order_summary = f"Dealer: {dealer_id}, Product: {product_id}, Quantity: {quantity}"
                ai_prompt = (
                        f"A dealer has requested an order: {order_summary}. "
                        f"Generate a message asking the sales rep to confirm before placing the order."
                    )
                ai_response = get_llm_final_response("", "", ai_prompt)
                return {
                        "success": True,
                        "answer": ai_response
                    }

            elif intent != "info":
                return {"success": False, "answer": "❌ Could not understand your intent. Please try rephrasing."}

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

        print("=" * 50)
        print("Final Response Generation")
        print("=" * 50)
        answer = get_llm_final_response(sql_context, rag_context, user_query=user_query)
        print(f"shivam : {answer}")
        sys.stdout.flush()

        return {"success": True, "answer": answer}

    except Exception as e:
        print(f"🔥 [ERROR] Exception occurred in /api/query: {e}")
        sys.stdout.flush()
        return JSONResponse(status_code=500, content={"success": False, "message": str(e)})


@router.post("/api/login")
async def login(request: Request):
    print("\n✅ /api/login endpoint called")
    try:
        data = await request.json()
        username = data.get("username")
        password = data.get("password")
        print(f"➡ Username: {username}")
        print(f"➡ Password: {password}")

        user_session = authenticate_user(username, password)
        print(f"[DEBUG] authenticate_user result: {user_session}")

        if user_session:
            print("✅ [LOGIN] User session established.")
            print(f"🧾 [SESSION DETAILS] user_id: {user_session.user_id}")
            print(f"🧾 [SESSION DETAILS] username: {user_session.username}")
            print(f"🧾 [SESSION DETAILS] role: {user_session.role}")
            print(f"🧾 [SESSION DETAILS] dealer_id: {user_session.dealer_id}")
            print(f"🧾 [SESSION DETAILS] dealer_name: {user_session.dealer_name}")
            print(f"🧾 [SESSION DETAILS] sales_rep_id: {user_session.sales_rep_id}")
            print(f"🧾 [SESSION DETAILS] sales_rep_name: {user_session.sales_rep_name}")

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
            print("❌ [LOGIN] Invalid credentials. No session returned.")
            return {"success": False, "message": "Invalid credentials"}

    except Exception as e:
        print(f"❌ Error in /api/login: {str(e)}")
        sys.stdout.flush()
        return JSONResponse(status_code=500, content={
            "success": False,
            "message": "Internal server error",
            "error": str(e)
        })
@router.get("/api/debug-users")
def debug_users():
    from supabase_client import debug_users_table
    data = debug_users_table()
    return {"users": data}


@router.get("/api/salesrep-notifications/{sales_rep_id}")
async def get_salesrep_notifications(sales_rep_id: str):
    import psycopg2
    import os
    try:
        conn = psycopg2.connect(
            dbname=os.getenv("dbname"),
            user=os.getenv("user"),
            password=os.getenv("password"),
            host=os.getenv("host"),
            port=os.getenv("port")
        )
        cur = conn.cursor()
        cur.execute("""
            SELECT r.request_id, d.name as dealer_name, p.product_name, r.quantity, r.status, r.created_at
            FROM order_requests r
            JOIN dealer d ON r.dealer_id = d.dealer_id
            JOIN product p ON r.product_id = p.product_id
            WHERE r.sales_rep_id = %s AND r.status = 'pending'
            ORDER BY r.created_at DESC
        """, (sales_rep_id,))
        rows = cur.fetchall()
        cur.close()
        conn.close()
        notifications = [
            {
                "request_id": row[0],
                "dealer_name": row[1],
                "product_name": row[2],
                "quantity": row[3],
                "status": row[4],
                "created_at": row[5].isoformat() if row[5] else ""
            }
            for row in rows
        ]
        return {"success": True, "notifications": notifications}
    except Exception as e:
        return {"success": False, "message": str(e), "notifications": []}
    
@router.post("/api/salesrep-notifications/accept")
async def accept_order_request(request: Request):
    data = await request.json()
    request_id = data.get("request_id")
    # Mark the order as 'accepted' or 'placed'
    import psycopg2, os
    try:
        conn = psycopg2.connect(
            dbname=os.getenv("dbname"),
            user=os.getenv("user"),
            password=os.getenv("password"),
            host=os.getenv("host"),
            port=os.getenv("port")
        )
        cur = conn.cursor()
        cur.execute("UPDATE order_requests SET status = 'accepted' WHERE request_id = %s", (request_id,))
        conn.commit()
        cur.close()
        conn.close()
        return {"success": True}
    except Exception as e:
        return {"success": False, "message": str(e)}

@router.post("/api/salesrep-notifications/dismiss")
async def dismiss_order_request(request: Request):
    data = await request.json()
    request_id = data.get("request_id")
    # Mark the order as 'dismissed'
    import psycopg2, os
    try:
        conn = psycopg2.connect(
            dbname=os.getenv("dbname"),
            user=os.getenv("user"),
            password=os.getenv("password"),
            host=os.getenv("host"),
            port=os.getenv("port")
        )
        cur = conn.cursor()
        cur.execute("UPDATE order_requests SET status = 'dismissed' WHERE request_id = %s", (request_id,))
        conn.commit()
        cur.close()
        conn.close()
        return {"success": True}
    except Exception as e:
        return {"success": False, "message": str(e)}    