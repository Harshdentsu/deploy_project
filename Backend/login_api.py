from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from supabase_client import supabase
from rag import (
    authenticate_user, current_user, get_conversation_context, UserSession, get_llm_sql,
    clean_sql_output, try_select_sql, sql_result_to_context, rewrite_query_for_rag,
    preprocess_query, get_embedding, extract_metadata_with_llm,
    vector_store_similarity_search, vector_rows_to_context, get_llm_final_response,
    get_user_by_username, extract_order_details, resolve_product_id, resolve_dealer_id, place_order, resolve_warehouse_id
)
import sys

router = APIRouter()
pending_orders = {}

@router.post("/api/query")
async def query(request: Request):
    global pending_orders
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

        import rag
        rag.current_user = user_session

        if rag.current_user is None:
            print("ERROR: current_user is not set!")
            return ""

        confirmation_phrases = ["yes", "confirm", "place order", "yep", "sure", "okay", "ok"]
        negative_phrases = ["no", "cancel", "don't", "do not", "nah"]

        if username in pending_orders and any(phrase in user_query.lower() for phrase in confirmation_phrases + negative_phrases):
            if any(phrase in user_query.lower() for phrase in confirmation_phrases):
                order = pending_orders.pop(username)
                response_obj = place_order(
                    order["dealer_id"], order["product_id"], order["quantity"], order.get("warehouse_id")
                )
                if response_obj["success"]:
                    details = response_obj.get("details", {})
                    detail_str = "\n".join([
                        f"🧾 Order ID: {details.get('order_id')}",
                        f"👤 Dealer: {details.get('dealer')}",
                        f"📦 Product: {details.get('product')}",
                        f"🔢 Quantity: {details.get('quantity')}",
                        f"🏬 Warehouse: {details.get('warehouse')}",
                        f"💰 Unit Price: ₹{details.get('unit_price')}",
                        f"🧮 Total Cost: ₹{details.get('total_cost')}",
                        f"📉 Remaining Stock: {details.get('remaining_stock')}"
                    ])
                    return {
                        "success": True,
                        "answer": f"✅ Order placed successfully!\n\n{detail_str}",
                        "details": details
                    }
                else:
                    return {
                        "success": False,
                        "answer": f"❌ {response_obj['message']}"
                    }
            elif any(phrase in user_query.lower() for phrase in negative_phrases):
                pending_orders.pop(username)
                return {"success": True, "answer": "❌ Order cancelled."}

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
                
                pending_orders[username] = {
                    "dealer_id": dealer_id,
                    "product_id": product_id,
                    "quantity": quantity,
                    "warehouse_id": warehouse_id
                }
                order_summary = f"Dealer: {dealer_id}, Product: {product_id}, Quantity: {quantity}"
                return {
                    "success": True,
                    "answer": f"📝 Please confirm before placing the order:\n{order_summary}"
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

