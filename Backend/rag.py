import os
import re
import json
import requests
import numpy as np
import psycopg2
from supabase import create_client
from dotenv import load_dotenv
from difflib import SequenceMatcher
from fuzzywuzzy import fuzz, process
from dotenv import load_dotenv
from passlib.hash import bcrypt
from datetime import datetime
from collections import deque
import requests
import json
import uuid
load_dotenv()
# --- Set your database credentials here or in a .env file ---
# os.environ["user"] =  os.getenv("user")
# os.environ["password"] = os.getenv("password")
# os.environ["host"] = os.getenv("host")
# os.environ["port"] = os.getenv("port")
# os.environ["dbname"] = os.getenv("dbname")
 
# --- Azure OpenAI Embedding Endpoint and Headers ---
embedding_endpoint = os.getenv("AZURE_EMBEDDING_URL")
embedding_headers = {
    "Content-Type": "application/json",
    "Ocp-Apim-Subscription-Key": os.getenv("AZURE_EMBEDDING_SUBSCRIPTION_KEY"),
    "x-service-line": os.getenv("AZURE_OPENAI_SERVICE_LINE"),
    "x-brand": os.getenv("AZURE_OPENAI_BRAND"),
    "x-project": os.getenv("AZURE_OPENAI_PROJECT"),
    'api-version': os.getenv("AZURE_OPENAI_API_VERSION")
}
 
# --- Supabase Client (for vector search) ---
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")

if not supabase_url or not supabase_key:
    raise ValueError("SUPABASE_URL and SUPABASE_KEY environment variables must be set and non-empty.")

supabase = create_client(supabase_url, supabase_key)

# --- Azure OpenAI Chat Endpoint and Headers ---
chat_endpoint = os.getenv("AZURE_CHAT_API_URL")
chat_headers  = {
    "x-service-line": os.getenv("AZURE_OPENAI_SERVICE_LINE"),
    "x-brand": os.getenv("AZURE_OPENAI_BRAND"),
    "x-project": os.getenv("AZURE_OPENAI_PROJECT"),
    "api-version": os.getenv("AZURE_OPENAI_API_VERSION"),
    "Ocp-Apim-Subscription-Key": os.getenv("AZURE_CHAT_SUBSCRIPTION_KEY")
}


########################################################################
#########################  USER SESSION ################################
current_user = None
current_session_id = None 
 
class UserSession:
    def __init__(self, user_id, username, role, dealer_id=None, dealer_name=None, sales_rep_id=None ,sales_rep_name=None):
        self.user_id = user_id
        self.username = username
        self.role = role.lower()
        self.dealer_id = dealer_id
        self.dealer_name = dealer_name
        self.is_authenticated = True
        self.sales_rep_id = sales_rep_id # Initialize sales_rep_id, will be set later if needed
        self.sales_rep_name = sales_rep_name # Initialize sales_rep_name, will be set later if needed
 
    def is_dealer(self):
        return self.role == 'dealer'
    
    def is_sales_rep(self):
        """Check if user is a sales representative"""
        return self.role == 'sales_rep'
    
    def is_admin(self):
        
        return self.role == 'admin'
    
    # def can_access_all_data(self):
    #     return self.is_admin()
    
    def get_dealer_filter(self):
        """Returns dealer_id for filtering if user is a dealer"""
        return self.dealer_id if self.is_dealer() else None
 
def authenticate_user(username, password):
    try:
        conn = psycopg2.connect(
            dbname=os.getenv("dbname"),
            user=os.getenv("user"),
            password=os.getenv("password"),
            host=os.getenv("host"),
            port=os.getenv("port")
        )
        cur = conn.cursor()

        # Just get the hashed password first
        query = """
        SELECT u.user_id, u.username, u.role, u.password, u.dealer_id, d.name, u.sales_rep_id, s.name
        FROM users u
        LEFT JOIN dealer d ON u.dealer_id = d.dealer_id
        LEFT JOIN sales_reps s ON u.sales_rep_id = s.sales_rep_id
        WHERE u.username = %s
        """
        cur.execute(query, (username,))
        result = cur.fetchone()

        cur.close()
        conn.close()

        if result:
            user_id, username, role, hashed_password, dealer_id, dealer_name, sales_rep_id, sales_rep_name = result

            # ✅ Verify password
            if bcrypt.verify(password, hashed_password):
                return UserSession(user_id, username, role, dealer_id, dealer_name, sales_rep_id, sales_rep_name)
            else:
                return None  # Password mismatch
        else:
            return None  # User not found

    except Exception as e:
        print(f"Authentication error: {e}")
        return None

 
def login():
    """
    Handle user login
    """
    global current_user
 
    print("=== LOGIN REQUIRED ===")
    username = input("Username: ").strip()
    password = input("Password: ").strip()
    
    user_session = authenticate_user(username, password)
    
    if user_session:
        current_user = user_session
        print(f"Welcome {user_session.username}!")
        print(f"Role: {user_session.role}")
        if user_session.dealer_name:
            print(f"Dealer: {user_session.dealer_name}")
        print("-" * 50)
        if user_session.is_sales_rep():
            print(f"Sales Representative: {user_session.sales_rep_name}")
            print(f"Sales Rep ID: {user_session.sales_rep_id}")
        return True
        
    else:
        print("Invalid credentials. Please try again.")
        return False
 
#def logout():
    """
    Handle user logout
    """
    #global current_user
    if current_user:
        print(f"Goodbye {current_user.username}!")
        current_user = None
 
def logout():
    global current_user, current_session_id
    current_user = None
    current_session_id = None  # ✅ Clear session ID on logout
    print("User logged out.")
def check_authentication():
    """
    Check if user is authenticated
    """
    return current_user is not None and current_user.is_authenticated
 
#############################################################################
########################  CONVERSATION LOGS ################################






def get_conversation_context(num_exchanges=5):
    if current_user is None:
        print("[ERROR] get_conversation_context: current_user is None!")
        return ""
    try:
        result = supabase.table("conversation_logs") \
            .select("user_query, ai_response") \
            .eq("user_id", current_user.user_id) \
            .order("query_timestamp", desc=True) \
            .limit(num_exchanges) \
            .execute()
 
        rows = result.data if hasattr(result, 'data') else []
        if not rows:
            return ""
 
        context = f"Last {num_exchanges} conversations from this user:\n"
        for i, row in enumerate(reversed(rows), 1):
            context += f"\nExchange {i}:\nUser: {row['user_query']}\nAssistant: {row['ai_response']}\n"
        return context
 
    except Exception as e:
        print("DEBUG: Failed to fetch context from Supabase:", e)
        return ""
 
def is_follow_up_question(user_query):
    follow_up_signals = [
        'what about', 'and what', 'also show', 'more details', 'can you also',
        'tell me more', 'how about', 'compare', 'difference between'
    ]
    return any(signal in user_query.lower() for signal in follow_up_signals)
 
def enhance_query_with_context(user_query):
    if not is_follow_up_question(user_query):
        return user_query
    if current_user is None:
        print("[ERROR] enhance_query_with_context: current_user is None!")
        return user_query
    try:
        result = supabase.table("conversation_logs") \
            .select("user_query, ai_response") \
            .eq("user_id", current_user.user_id) \
            .order("query_timestamp", desc=True) \
            .limit(1) \
            .execute()
 
        rows = result.data if hasattr(result, 'data') else []
        if not rows:
            return user_query
 
        last = rows[0]
        return (
            f"Previous context: {last['user_query']}\n"
            f"Previous response: {last['ai_response']}\n\n"
            f"Follow-up question: {user_query}\n\n"
            f"Please answer the follow-up considering the previous context."
        )
 
    except Exception as e:
        print("DEBUG: Failed to enhance query with context:", e)
        return user_query
 
def save_to_supabase(user_query, response):
    if current_user is None:
        print("[ERROR] save_to_supabase: current_user is None!")
        return
    try:
        log_data = {
            'user_id': current_user.user_id,
            'dealer_id': current_user.dealer_id,
            'sales_rep_id': current_user.sales_rep_id,
            'user_query': user_query,
            'ai_response': response,
            'session_id': current_session_id,
            'query_timestamp': datetime.now().isoformat(),
            'metadata': {}  # Add any relevant metadata if needed
        }
        result = supabase.table("conversation_logs").insert(log_data).execute()
        print(f"DEBUG: Supabase log result: {result}")
    except Exception as e:
        print(f"Error saving to Supabase: {e}")
 
#############################################################################
########################  FUZZY  ################################
DEALER_CACHE = {}
PRODUCT_CACHE = {}
WAREHOUSE_CACHE = {}
SALES_REP_CACHE = {}
 
def normalize_text(text):
    """Normalize text for better matching"""
    if not isinstance(text, str):
        text = str(text)
    text = re.sub(r'[^\w\s]', '', text.lower())
    text = re.sub(r'\s+', ' ', text).strip()
    return text
 
def fuzzy_match_string(query_string, candidates, threshold=70):
    """
    Find the best fuzzy match for a string from a list of candidates
    Returns (best_match, score) or (None, 0) if no good match found
    """
    if not query_string or not candidates:
        return None, 0
    
    query_normalized = normalize_text(query_string)
    candidates_normalized = [normalize_text(c) for c in candidates]
    
    try:
        result = process.extractOne(query_normalized, candidates_normalized, scorer=fuzz.ratio)
        if result and result[1] >= threshold:
            original_index = candidates_normalized.index(result[0])
            return candidates[original_index], result[1]
    except:
        pass
    
    return None, 0
 
def get_database_entities():
    """Cache database entities for fuzzy matching"""
    global DEALER_CACHE, PRODUCT_CACHE, WAREHOUSE_CACHE
    
    try:
        conn = psycopg2.connect(
            dbname=os.getenv("dbname"),
            user=os.getenv("user"),
            password=os.getenv("password"),
            host=os.getenv("host"),
            port=os.getenv("port")
        )
        cur = conn.cursor()
        
        # Get dealers
        cur.execute("SELECT DISTINCT name FROM dealer WHERE name IS NOT NULL")
        dealers = [row[0] for row in cur.fetchall()]
        DEALER_CACHE = {normalize_text(d): d for d in dealers}
 
        cur.execute("SELECT DISTINCT name FROM sales_reps WHERE name IS NOT NULL")
        sales_reps = [row[0] for row in cur.fetchall()]
        SALES_REP_CACHE = {normalize_text(d): d for d in sales_reps}
 
        # Get products
        cur.execute("SELECT DISTINCT product_id FROM product WHERE product_id IS NOT NULL")
        products = [row[0] for row in cur.fetchall()]
        PRODUCT_CACHE = {normalize_text(p): p for p in products}
        
        # Get warehouses
        cur.execute("SELECT DISTINCT location FROM warehouse WHERE location IS NOT NULL")
        warehouses = [row[0] for row in cur.fetchall()]
        WAREHOUSE_CACHE = {normalize_text(w): w for w in warehouses}
        
        cur.close()
        conn.close()
 
        print(f"DEBUG: Cached {len(dealers)} dealers, {len(sales_reps)} sales reps, {len(products)} products, {len(warehouses)} warehouses")
 
    except Exception as e:
        print(f"DEBUG: Error caching entities: {e}")
 
def fuzzy_correct_entities(text):
    """
    Find and correct entity names in the text using fuzzy matching
    """
    corrected_text = text
    corrections_made = []
    
    # Check for dealer names
    for cached_dealer in DEALER_CACHE.values():
        words_in_dealer = cached_dealer.lower().split()
        for word in words_in_dealer:
            if len(word) > 3:
                text_words = text.lower().split()
                for text_word in text_words:
                    similarity = fuzz.ratio(word, text_word)
                    if similarity >= 75 and word != text_word:
                        pattern = re.compile(re.escape(text_word), re.IGNORECASE)
                        corrected_text = pattern.sub(word, corrected_text)
                        corrections_made.append(f"{text_word} -> {word}")
 
    for cached_sales_rep in SALES_REP_CACHE.values():
        words_in_sales_rep = cached_sales_rep.lower().split()
        for word in words_in_sales_rep:
            if len(word) > 3:
                text_words = text.lower().split()
                for text_word in text_words:
                    similarity = fuzz.ratio(word, text_word)
                    if similarity >= 75 and word != text_word:
                        pattern = re.compile(re.escape(text_word), re.IGNORECASE)
                        corrected_text = pattern.sub(word, corrected_text)
                        corrections_made.append(f"{text_word} -> {word}")
    
    # Check for product IDs
    for cached_product in PRODUCT_CACHE.values():
        if cached_product.lower() in text.lower():
            continue
        similarity = fuzz.ratio(normalize_text(cached_product), normalize_text(text))
        if similarity >= 80:
            corrected_text = corrected_text.replace(text, cached_product)
            corrections_made.append(f"Product: {text} -> {cached_product}")
    
    # Check for warehouse locations
    for cached_warehouse in WAREHOUSE_CACHE.values():
        similarity = fuzz.ratio(normalize_text(cached_warehouse), normalize_text(text))
        if similarity >= 80:
            pattern = re.compile(re.escape(text), re.IGNORECASE)
            corrected_text = pattern.sub(cached_warehouse, corrected_text)
            corrections_made.append(f"Warehouse: {text} -> {cached_warehouse}")
    
    if corrections_made:
        print(f"DEBUG: Fuzzy corrections made: {corrections_made}")
    
    return corrected_text
########################################################################################
#####################################  SQLL  ################################################
 
# def add_role_based_filters(base_query: str, user_session) -> str:
#     if not user_session or user_session.can_access_all_data() or user_session.is_sales_rep():
#         return base_query
 
#     dealer_id = user_session.dealer_id
#     query_lower = base_query.lower()
 
#     # Apply warehouse restriction for inventory queries (only for dealers)
#     if 'from inventory' in query_lower or 'join inventory' in query_lower:
#         if 'where' in query_lower:
#             return base_query.replace(
#                 ' where ',
#                 f" WHERE i.warehouse_id IN (SELECT warehouse_id FROM dealer WHERE dealer_id = {dealer_id}) AND "
#             )
#         else:
#             return base_query.rstrip(';') + f" WHERE i.warehouse_id IN (SELECT warehouse_id FROM dealer WHERE dealer_id = {dealer_id});"
 
#     return base_query
 
def get_llm_sql(user_query):
    """Generate SQL with correct role-based access control logic + recent history"""
    if current_user is None:
        print("[ERROR] get_llm_sql: current_user is None!")
        return ""
    corrected_query = fuzzy_correct_entities(user_query)
 
    # Fetch last 3 user logs for context
    try:
        result = supabase.table("conversation_logs") \
            .select("user_query, ai_response") \
            .eq("user_id", current_user.user_id) \
            .order("query_timestamp", desc=True) \
            .limit(3) \
            .execute()
 
        rows = result.data if hasattr(result, 'data') else []
        history_context = ""
        for i, row in enumerate(reversed(rows), 1):
            history_context += f"\nExchange {i}:\nUser: {row['user_query']}\nAssistant: {row['ai_response']}\n"
    except Exception as e:
        print("DEBUG: Failed to fetch history logs for SQL context:", e)
        history_context = ""

    template_knowledge = """
You can directly use one of these templates if it matches the intent. Substitute variables if needed:
 
-- [TEMPLATE_1] Stocks in all warehouses:
SELECT p.product_id, p.product_name, w.location AS warehouse_location, i.quantity
FROM inventory i
JOIN product p ON i.product_id = p.product_id
JOIN warehouse w ON i.warehouse_id = w.warehouse_id
ORDER BY p.product_id, w.location;
 
-- [TEMPLATE_2] Similar products to a given product:
SELECT p2.product_name
FROM product p1
JOIN product p2 ON p1.category = p2.category
WHERE p1.product_name = '{product_name}' AND p2.product_name <> '{product_name}'
LIMIT 5;
 
-- [TEMPLATE_3] Orders placed for the current dealer:
SELECT o.dealer_id, o.order_id, o.order_date, o.product_id, p.product_name, o.quantity, o.total_cost
FROM orders o
JOIN product p ON o.product_id = p.product_id
WHERE o.dealer_id = '{dealer_id}'
ORDER BY o.order_date DESC
LIMIT 3;
 
-- [TEMPLATE_4] Sales rep assigned to each dealer:
SELECT s.name AS sales_rep_name
FROM dealer d
JOIN sales_reps s ON d.sales_rep_id = s.sales_rep_id;
 
You MUST substitute values like {dealer_id} or {product_name} using context or metadata if available.
If no template matches, generate SQL normally.
""" 
    # Inject role-specific access control info
    role_info = ""
    if current_user:
        if current_user.is_dealer():
            role_info = f"""
IMPORTANT ROLE-BASED ACCESS CONTROL:
- The current user is a DEALER with dealer_id = '{current_user.dealer_id}'
- The current user is a DEALER with dealer_name = '{current_user.dealer_name}'
- Dealers can access:
  * All inventory/stock data (no dealer filter needed)
  * ONLY their own claims → Add: AND c.dealer_id = '{current_user.dealer_id}'
  * ONLY orders placed for them but cannot place orders → Add: AND o.dealer_id = '{current_user.dealer_id}'
- DO NOT allow access to data of other dealers.
 
"""
        elif current_user.is_sales_rep():
            role_info = f"""
IMPORTANT ROLE-BASED ACCESS CONTROL:
- The current user is a SALES REPRESENTATIVE with sales_rep_id = '{current_user.sales_rep_id}'
- The current user is a SALES REPRESENTATIVE with sales_rep_name = '{current_user.sales_rep_name}'
- Sales reps can access:
  ✅ Inventory and product info (no restriction)
  ✅ ONLY their own orders
     → Add: AND o.sales_rep_id = '{current_user.sales_rep_id}'
  ✅ ONLY claims submitted by dealers assigned to them
     → Use a subquery or JOIN:
        AND c.dealer_id IN (
            SELECT d.dealer_id FROM dealer d
            WHERE d.sales_rep_id = '{current_user.sales_rep_id}'
        )
- DO NOT allow access to:
  ❌ Claims submitted by unassigned dealers
  ❌ Orders placed by other sales reps
  ❌ Data belonging to other dealers or users

"""
 
        elif current_user.is_admin():
            role_info = """
IMPORTANT ROLE-BASED ACCESS CONTROL:
- The current user is an ADMIN
- Admins have full unrestricted access to all data and tables.
"""
 
    # SQL generation prompt
    system_prompt = (

        "Your job is to generate efficient SQL SELECT queries from natural language questions without asking follow up questions\n\n"
        "Consider product names as a single word , eg treat Urban Bias as UrbnaBias , Treat Max ATB as MaxATB\n"
        "📦 Tables:\n"
        "1. users(user_id, username, email, role, dealer_id, sales_rep_id)\n"
        "2. dealer(dealer_id, name, zone, sales_rep_id)\n"
        "3. claim(claim_id, dealer_id, status, claim_date, product_id, amount, reason,sales_rep_id)\n"
        "4. product(product_id, product_name, category, price, section_width, aspect_ratio, construction_type, rim_diameter_inch)\n"
        "5. warehouse(warehouse_id, location, zone)\n"
        "6. sales_reps(sales_rep_id, name, zone,monthly_sales_target,monthly_sales_achieved)\n"
        "7. inventory(product_id, warehouse_id, quantity)\n"
        "8. orders(order_id, dealer_id, product_id, warehouse_id, quantity, unit_price(rupees), total_cost, order_date, sales_rep_id)\n\n"
        "🔗 Relationships:\n"
        "- users.dealer_id → dealer.dealer_id\n"
        "- dealer.sales_rep_id → sales_reps.sales_rep_id\n"
        "- users.sales_rep_id → sales_reps.sales_rep_id\n"
        "- claim.dealer_id → dealer.dealer_id\n"
        "- claim.sales_rep_id → sales_reps.sales_rep_id\n"
        "- orders joins dealer, sales_reps, product, warehouse\n"
        "- inventory joins product and warehouse\n\n"
        + role_info + template_knowledge +


        "2. Use table aliases like o = orders, c = claim, p = product\n"
        "3. Use ILIKE for string filtering and partial matches\n"
        "eg. Similar products like UrbanBias , sql : SELECT p2.product_name FROM product p1 JOIN product p2 ON p1.category = p2.category WHERE p1.product_name = 'UrbanBias' AND p2.product_name <> 'UrbanBias' LIMIT 3;\n"
        "🧠 Recent conversation context:\n" + history_context
    )
 
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": corrected_query}
    ]
 
    payload = {
        "messages": messages,
        "temperature": 0,
        "max_tokens": 250,
        "top_p": 1,
        "frequency_penalty": 0,
        "presence_penalty": 0
    }

    if not isinstance(chat_endpoint, str):
        raise ValueError("Chat endpoint URL is not set or is invalid.")

    response = requests.post(chat_endpoint, headers=chat_headers, json=payload)
    if response.status_code == 200:
        sql = response.json()["choices"][0]["message"]["content"].strip()
        return sql
        raise Exception(f"Chat API error (SQL): {response.status_code}: {response.text}")



def clean_sql_output(raw_sql):
    # Remove markdown code fences and leading/trailing spaces
    cleaned = re.sub(r"```(?:sql)?", "", raw_sql, flags=re.IGNORECASE).strip()
    return cleaned
 
def try_select_sql(sql):
    sql = sql.strip()
    if not sql.lower().startswith("select"):
        return None, "Only SELECT statements are allowed for safety."
    try:
        conn = psycopg2.connect(
            dbname=os.getenv("dbname"),
            user=os.getenv("user"),
            password=os.getenv("password"),
            host=os.getenv("host"),
            port=os.getenv("port")
        )
        cur = conn.cursor()
        cur.execute(sql)
        if cur.description is None:
            cur.close()
            conn.close()
            return None, "Only SELECT statements are allowed for safety."
        columns = [desc[0] for desc in cur.description]
        rows = cur.fetchall()
        result = [dict(zip(columns, row)) for row in rows]
        cur.close()
        conn.close()
        return result, None
    except Exception as e:
        return None, str(e)
    
 
def sql_result_to_context(sql_result):
    if not sql_result:
        return "No results found."
    rows_as_strings = []
    for row in sql_result:
        # Format every row: each key-value on its own line
        row_str = '\n'.join(f"{k}: {v}" for k, v in row.items() if v is not None)
        rows_as_strings.append(row_str)
    return "\n\n".join(rows_as_strings)
 
    
 
############################################################################################
###################### RAG ############################################################
 
def rewrite_query_for_rag(user_query):
    """
    Enhanced query rewriting with fuzzy correction
    """
    corrected_query = fuzzy_correct_entities(user_query)
    
    system_prompt = (
        "You are an expert at rewriting queries for better vector similarity search in a tyre manufacturing context. "
        "Your task is to rewrite user queries to make them more neutral, comprehensive, and suitable for semantic search. "
        "\n\nGuidelines for rewriting:\n"
        "1. Remove conversational elements (please, can you, I want to know, etc.)\n"
        "2. Expand abbreviations and acronyms related to tyres (e.g., 'R' to 'radial')\n"
        "3. Add relevant synonyms and related terms\n"
        "4. Convert questions to declarative statements focusing on key concepts\n"
        "5. Include industry-specific terminology where appropriate\n"
        "6. Maintain all specific identifiers (IDs, part numbers, names)\n"
        "7. Focus on the core information need\n"
        "8. Include variations and synonyms for names and products to handle typos\n"
        "\nOnly return the rewritten query, nothing else."
    )
    
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": corrected_query}
    ]
    
    payload = {
        "messages": messages,
        "temperature": 0.1,
        "max_tokens": 150,
        "top_p": 0.9,
        "frequency_penalty": 0,
        "presence_penalty": 0
    }
    
    try:
        if chat_endpoint is None:
            raise Exception("Chat endpoint is not set (AZURE_OPENAI_URL missing)")
        response = requests.post(chat_endpoint, headers=chat_headers, json=payload)
        if response.status_code == 200:
            rewritten_query = response.json()["choices"][0]["message"]["content"].strip()
            print(f"DEBUG: Original query: {user_query}")
            print(f"DEBUG: Corrected query: {corrected_query}")
            print(f"DEBUG: Rewritten query: {rewritten_query}")
            return rewritten_query
        else:
            print(f"Query rewriting failed: {response.status_code}: {response.text}")
            return corrected_query
    except Exception as e:
        print(f"Query rewriting error: {e}")
        return corrected_query
 
def preprocess_query(query):
    text = query.lower()
    text = re.sub(r'[^\w\s]', '', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text
 
def get_embedding(text):
    if embedding_endpoint is None:
        raise Exception("Embedding endpoint is not set (AZURE_OPENAI_URL missing)")
    payload = {"input": text}
    response = requests.post(embedding_endpoint, headers=embedding_headers, json=payload)
    if response.status_code == 200:
        return response.json()["data"][0]["embedding"]
    else:
        raise Exception(f"Embedding API error {response.status_code}: {response.text}")
 
def cosine_similarity(vec1, vec2):
    vec1 = np.array(vec1)
    vec2 = np.array(vec2)
    if np.linalg.norm(vec1) == 0 or np.linalg.norm(vec2) == 0:
        return 0.0
    return float(np.dot(vec1, vec2) / (np.linalg.norm(vec1) * np.linalg.norm(vec2)))
def extract_metadata_with_llm(user_query):
    """
    Enhanced metadata extraction with role-based context and updated fields
    """
    if current_user is None:
        print("[ERROR] extract_metadata_with_llm: current_user is None!")
        return None
    corrected_query = fuzzy_correct_entities(user_query)
 
    # Inject user-specific context for better LLM guidance
    user_context = ""
    if current_user:
        if current_user.is_dealer():
            user_context = (
                f" The current user is a DEALER named {current_user.dealer_name} "
                f"with dealer_id '{current_user.dealer_id}'."
            )
        elif current_user.is_sales_rep():
            user_context = (
                f" The current user is a SALES REPRESENTATIVE named {current_user.sales_rep_name} "
                f"with sales_rep_id '{current_user.sales_rep_id}'."
            )
 
    system_prompt = (
        "You are an intelligent assistant that extracts structured metadata from user queries related to tyres, orders, claims, dealers, sales reps, and warehouses.\n"
        "Your job is to return a valid JSON object with as many of the following fields as possible:\n\n"
        "  - order_id\n"
        "  - dealer_id\n"
        "  - dealer_name\n"
        "  - sales_rep_id\n"
        "  - sales_rep_name\n"
        "  - product_id (e.g., 100/35R24 50P)\n"
        "  - product_name (e.g., SpeedoCruze Pro)\n"
        "  - category\n"
        "  - warehouse_id (number or alphanumeric)\n"
        "  - warehouse_location\n"
        "  - claim_id\n\n"
        "Only return fields if they are clearly mentioned in the query. Use fuzzy matching where helpful.\n"
        "Return ONLY a valid JSON object. Do NOT explain, add comments, or format as a code block.\n" +
        user_context
    )
 
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": corrected_query}
    ]
 
    payload = {
        "messages": messages,
        "temperature": 0,
        "max_tokens": 200,
        "top_p": 1,
        "frequency_penalty": 0,
        "presence_penalty": 0
    }

    if not chat_endpoint:
        print("[ERROR] extract_metadata_with_llm: chat_endpoint is None!")
        return None

    try:
        response = requests.post(chat_endpoint, headers=chat_headers, json=payload)
    except Exception as e:
        print(f"[ERROR] extract_metadata_with_llm: Exception during POST request: {e}")
        return None

    if response.status_code == 200:
        try:
            content = response.json()["choices"][0]["message"]["content"]
            metadata = json.loads(content)
            if isinstance(metadata, dict):
                return metadata
        except Exception as e:
            print("DEBUG: Metadata JSON decode error:", e)
            return None
    return None
 
####ADDD SALES_REP 
def enhanced_metadata_filter_matching(metadata_filter, row_metadata):
    """
    Enhanced metadata matching with fuzzy logic and role-based filtering
    """
    if not metadata_filter or not row_metadata:
        return 0
    
    # Add role-based filtering to metadata
    if current_user and current_user.is_dealer():
        # Check if metadata contains dealer-specific information
        if 'dealer_id' in row_metadata:
            if str(row_metadata['dealer_id']) != str(current_user.dealer_id):
                # If this is sales or claims data from another dealer, exclude it
                if any(key in row_metadata for key in ['sales_id', 'claim_id']):
                    return 0
    
    match_score = 0
    total_filters = len(metadata_filter)
    
    for key, filter_value in metadata_filter.items():
        row_value = row_metadata.get(key, "")
        
        if not filter_value or not row_value:
            continue
            
        # Exact match
        if str(filter_value).lower() == str(row_value).lower():
            match_score += 1
        # Fuzzy match for strings
        elif isinstance(filter_value, str) and isinstance(row_value, str):
            similarity = fuzz.ratio(filter_value.lower(), row_value.lower())
            if similarity >= 70:
                match_score += similarity / 100
        # Partial match
        elif str(filter_value).lower() in str(row_value).lower() or str(row_value).lower() in str(filter_value).lower():
            match_score += 0.7
    
    return match_score / total_filters if total_filters > 0 else 0
 
def vector_store_similarity_search(query_embedding, top_k=10, metadata_filter=None, similarity_threshold=0.1):
    """
    Enhanced vector similarity search with role-based access control
    """
    response = supabase.table("vector_store").select("*").execute()
    rows = response.data
    if not rows:
        return []
    
    # Enhanced metadata filtering with role-based access control
    if metadata_filter:
        scored_rows = []
        for row in rows:
            try:
                meta = row.get("metadata")
                if isinstance(meta, str):
                    meta = json.loads(meta)
                
                match_score = enhanced_metadata_filter_matching(metadata_filter, meta)
                if match_score > 0:
                    scored_rows.append((match_score, row))
            except Exception:
                continue
        
        scored_rows.sort(reverse=True, key=lambda x: x[0])
        if scored_rows:
            rows = [row for score, row in scored_rows if score >= 0.3]
        else:
            rows = []
    
    # Vector similarity with threshold filtering
    similarities = []
    for row in rows:
        try:
            row_embedding = json.loads(row["embedding"])
            sim = cosine_similarity(query_embedding, row_embedding)
            if sim >= similarity_threshold:
                similarities.append((sim, row))
        except Exception:
            continue
    
    similarities.sort(reverse=True, key=lambda x: x[0])
    results = [row for sim, row in similarities[:top_k]]
    
    if similarities:
        print(f"DEBUG: Found {len(similarities)} results above threshold {similarity_threshold}")
        print(f"DEBUG: Top similarity scores: {[round(sim, 3) for sim, _ in similarities[:5]]}")
    
    return results
 
# def rows_to_context(rows):
#     context = ""
#     for idx, row in enumerate(rows, 1):
#         context += f"\nRow {idx}:\n"
#         for key, value in row.items():
#             if key != "embedding":
#                 context += f"{key}: {value}\n"
#     return context.strip()
 
def vector_rows_to_context(rows):
    context = ""
    for idx, row in enumerate(rows, 1):
        context += f"\nVector Row {idx}:\n"
        for key, value in row.items():
            if key != "embedding":
                context += f"{key}: {value}\n"
    return context.strip()
 
###########################################################################################
####################### FINAL RESPONSE #####################################################



def get_llm_final_response(sql_context, rag_context, user_query):
    if current_user is None:
        print("[ERROR] get_llm_final_response: current_user is None!")
        return "Sorry, I can't assist with that. (No user context)"
    enhanced_query = enhance_query_with_context(user_query)
    history_context = get_conversation_context(2)
 
    user_context = ""
    if current_user:
        user_context = (
            f"User Info:\n"
            f"- Username: {current_user.username}\n"
            f"- Role: {current_user.role}\n"
        )
        if current_user.is_dealer():
            user_context += (
                f"- Dealer Name: {current_user.dealer_name}\n"
                f"- Dealer ID: {current_user.dealer_id}\n"
                "\nACCESS RESTRICTIONS:\n"
                "- The user is a DEALER.\n"
                "- Dealers can view product and inventory data.\n"
                "- Dealers can request orders, which will be sent to their assigned sales representative for approval and placement.\n"
                "- They are only allowed to view claims belonging to their own dealer_id.\n"
                "- If a dealer asks about another dealer's claims, respond with:\n"
                "  'As a dealer, you do not have access to other dealers' data.'\n"
                 )
                
            
        elif current_user.is_sales_rep():
            user_context += (
                f"- Sales Rep ID: {current_user.sales_rep_id}\n"
                f"- Sales Rep Name: {current_user.sales_rep_name}\n"
                "\nACCESS RESTRICTIONS:\n"
                "- The user is a SALES REPRESENTATIVE.\n"
                "- Sales reps can view all product and inventory data.\n"
                "- They can only view orders that they have placed.\n"
                "- They can view claims of dealers assigned to them.\n"
                "- each of the sales rep is assigned with 4 delaer from sql context.\n"

            )
        elif current_user.is_admin():
            user_context += (
                "\nACCESS RESTRICTIONS:\n"
                "- The user is an ADMIN.\n"
                "- Admins have full access to ALL data.\n"

            )
 
    system_prompt = (
        "You are an AI assistant named 'wheely' for the tyre manufacturing company.\n"
        "Add many emojis response to enhance interactivity.\n"
        "If user query asks about joke dont respond.\n"
        "Respond concisely, professionally, and like a helpful human assistant.\n"
        "Respond without mentioning from which context sql or rag the response is from.\n"
        "Use Indian currency (₹) when showing prices.\n"
        "If asked similar products, provide 3 relevant similar products from context present in same category.\n"
        "\n"
        "IMPORTANT RULES:\n"
        "- ALWAYS use the SQL and RAG context provided to answer the user's query, even if the query is vague.\n"
        "- If the query is unclear, try to answer as best as possible using the provided context.\n"
        "- Only say 'I don't understand' if there is truly no relevant context or the query is completely unanswerable.\n"
        "- If a user tries to access unauthorized data, respond with the appropriate warning.\n"
        "- ALWAYS obey role-based access restrictions strictly.\n"
        "- Always trust content from sections with higher score values.\n"
        + user_context
    )
 
    user_message = f"""
{history_context}
 
<<SQL_CONTEXT - Score:10>>
{sql_context}
 
<<RAG_CONTEXT - Score: 0.5>>
{rag_context}
 
<<USER_QUERY>>
{enhanced_query}
"""
 
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_message.strip()}
    ]
 
    payload = {
        "messages": messages,
        "temperature": 0.0,
        "max_tokens": 2000,
        "top_p": 1,
        "frequency_penalty": 0,
        "presence_penalty": 0
    }

    if chat_endpoint is None:
        print("DEBUG: Chat API endpoint is not set.")
        return "Sorry, I can't assist with that."

    try:
        response = requests.post(str(chat_endpoint), headers=chat_headers, json=payload)
        response.raise_for_status()
        return response.json()["choices"][0]["message"]["content"]
    except Exception as e:
        print("DEBUG: Chat API failed:", e)
        return "Sorry, I can't assist with that."
 
 
###################################################################################################
##############################  ORDERS ############################################################
 
def place_order(dealer_id, product_id, quantity, warehouse_id=None):
    """
    Place an order - only for sales representatives.
    Deducts stock from warehouse and records the order.
    """
    if not current_user or not current_user.is_sales_rep():
        return {"success": False, "message": "Only sales representatives can place orders."}
    
    try:
        conn = psycopg2.connect(
            dbname=os.getenv("dbname"),
            user=os.getenv("user"),
            password=os.getenv("password"),
            host=os.getenv("host"),
            port=os.getenv("port")
        )
        cur = conn.cursor()
 
        # 1. Validate product
        cur.execute("SELECT product_name, price FROM product WHERE product_id = %s", (product_id,))
        product_row = cur.fetchone()
        if not product_row:
            return {"success": False, "message": f"Product {product_id} not found."}
        
        product_name, unit_price = product_row
 
        # 2. Validate dealer
        cur.execute("SELECT name FROM dealer WHERE dealer_id = %s", (dealer_id,))
        dealer_row = cur.fetchone()
        if not dealer_row:
            return {"success": False, "message": f"Dealer ID {dealer_id} not found."}
        
        dealer_name = dealer_row[0]
 
        # 3. Check inventory
        if warehouse_id:
            cur.execute("""
                SELECT w.warehouse_id, w.location, i.quantity
                FROM inventory i
                JOIN warehouse w ON i.warehouse_id = w.warehouse_id
                WHERE i.product_id = %s AND i.warehouse_id = %s AND i.quantity >= %s
            """, (product_id, warehouse_id, quantity))
        else:
            cur.execute("""
                SELECT w.warehouse_id, w.location, i.quantity
                FROM inventory i
                JOIN warehouse w ON i.warehouse_id = w.warehouse_id
                WHERE i.product_id = %s AND i.quantity >= %s
                ORDER BY i.quantity DESC
                LIMIT 1
            """, (product_id, quantity))
        
        stock_row = cur.fetchone()
        if not stock_row:
            return {"success": False, "message": f"Insufficient stock for product {product_id}. Required: {quantity}"}
 
        selected_warehouse_id, warehouse_location, available_quantity = stock_row
 
        total_cost = unit_price * quantity
 
        # 4. Start transaction
        cur.execute("BEGIN")
 
        # 5. Insert order into orders table with unique order_id
        cur.execute("SELECT order_id FROM orders WHERE order_id ~ '^ORD[0-9]{4}$' ORDER BY order_id DESC LIMIT 1")
        row = cur.fetchone()
        if row and row[0]:
            last_num = int(row[0][3:])
            next_order_number = last_num + 1
        else:
            next_order_number = 1
        order_id = f"ORD{next_order_number:04d}"
        
        cur.execute("""
        INSERT INTO orders (
        order_id, warehouse_id, product_id, order_date,  quantity,dealer_id,
        unit_price, total_cost, sales_rep_id
        )
        VALUES (%s, %s, %s, CURRENT_TIMESTAMP, %s, %s, %s, %s, %s)
        """, (
        order_id, selected_warehouse_id, product_id, quantity, dealer_id,
        unit_price, total_cost, current_user.sales_rep_id
        ))
        
 
        # 6. Deduct stock
        cur.execute("""
            UPDATE inventory
            SET quantity = quantity - %s
            WHERE product_id = %s AND warehouse_id = %s
        """, (quantity, product_id, selected_warehouse_id))
 
        cur.execute("""
            UPDATE sales_reps
            SET monthly_sales_achieved = COALESCE(monthly_sales_achieved, 0) + %s
            WHERE sales_rep_id = %s
        """, (total_cost, current_user.sales_rep_id))
 
 
        # 7. Commit
        conn.commit()
 
        return {
            "success": True,
            "message": "Order placed successfully.",
            "details": {
                "order_id": order_id,
                "dealer": dealer_name,
                "product": f"{product_name} ({product_id})",
                "quantity": quantity,
                "warehouse": f"{warehouse_location} (ID: {selected_warehouse_id})",
                "unit_price": float(unit_price),
                "total_cost": float(total_cost),
                "remaining_stock": available_quantity - quantity
            }
        }
 
    except Exception as e:
        if conn:
            conn.rollback()
        return {"success": False, "message": f"Transaction failed: {str(e)}"}
 
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()
 
def check_stock_availability(product_id, required_quantity=1):
    """
    Check stock availability across all warehouses
    """
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
            SELECT w.warehouse_id, w.location, w.zone, i.quantity,
                   p.product_name, p.price
            FROM inventory i
            JOIN warehouse w ON i.warehouse_id = w.warehouse_id
            JOIN product p ON i.product_id = p.product_id
            WHERE i.product_id = %s AND i.quantity > 0
            ORDER BY i.quantity DESC
        """, (product_id,))
        
        results = cur.fetchall()
        cur.close()
        conn.close()
        
        if not results:
            return {"available": False, "message": f"Product {product_id} not found or out of stock"}
        
        stock_info = []
        total_stock = 0
        
        for row in results:
            warehouse_id, location, zone, quantity, product_name, price = row
            stock_info.append({
                "warehouse_id": warehouse_id,
                "location": location,
                "zone": zone,
                "quantity": quantity,
                "sufficient": quantity >= required_quantity
            })
            total_stock += quantity
        
        return {
            "available": total_stock >= required_quantity,
            "product_name": results[0][4],
            "price": float(results[0][5]),
            "total_stock": total_stock,
            "required_quantity": required_quantity,
            "warehouses": stock_info
        }
        
    except Exception as e:
        return {"available": False, "message": f"Error checking stock: {str(e)}"}



def extract_order_details(user_query):
    """
    Extract order intent and details using LLM.
    Supports fallback to dealer_name and product_name for fuzzy resolution.
 
    Returns a JSON object like:
    {
        "intent": "order" or "info",
        "dealer_id": ...,
        "dealer_name": ...,
        "product_id": ...,
        "product_name": ...,
        "quantity": ...,
        "warehouse_id": ...
    }
    """
    system_prompt = """
You are an AI assistant extracting structured order information from user input.
Always return a valid JSON object with the following keys:
 
- intent: "order" or "info"
- product_id: (exact SKU if given)
- product_name: (if no product_id, extract name like "SpeedoCruze")
- dealer_id: (numeric ID if given)
- dealer_name: (if no dealer_id, extract name like "Pooja Singh")
- quantity: number of units (if mentioned)
- warehouse_id: optional (if present)
 
Rules:
- Use product_name and dealer_name as fallback when product_id or dealer_id are missing.
- If the user is only asking about availability or product info, use intent: "info".
- Do not include extra text outside the JSON.
 
Examples:
 
"Order 50 units of 100/35R24 for dealer 123" ->
{"intent": "order", "dealer_id": 123, "product_id": "100/35R24", "quantity": 50}
 
"Check if 100/35R24 is in stock" ->
{"intent": "info", "product_id": "100/35R24"}
 
"Place 3 SpeedoCruze for Pooja Singh" ->
{"intent": "order", "product_name": "SpeedoCruze", "dealer_name": "Pooja Singh", "quantity": 3}
 
"Need 20 SpeedoCruze tires" ->
{"intent": "order", "product_name": "SpeedoCruze", "quantity": 20}
"""
 
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_query}
    ]
 
    payload = {
        "messages": messages,
        "temperature": 0,
        "max_tokens": 200,
        "top_p": 1
    }

    try:
        if chat_endpoint is None:
            raise ValueError("chat_endpoint is not set")
        response = requests.post(str(chat_endpoint), headers=chat_headers, json=payload)
        print("DEBUG: LLM API status:", response.status_code)
        print("DEBUG: LLM API response:", response.text)
        if response.status_code == 200:
            content = response.json()["choices"][0]["message"]["content"]
            print("DEBUG: LLM extracted content:", content)
            return json.loads(content)
    except Exception as e:
        print(f"Error extracting order details: {e}")
    
    return {"intent": "unknown"}
 
def resolve_dealer_id(dealer_name):
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
            SELECT dealer_id FROM dealer
            WHERE LOWER(name) ILIKE %s
            LIMIT 1
        """, (f"%{dealer_name.lower()}%",))
        result = cur.fetchone()
        return result[0] if result else None
    except Exception as e:
        print("DEBUG resolve_dealer_id error:", e)
        return None
    finally:
        cur.close()
        conn.close()
 
def resolve_product_id(product_name):
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
            SELECT product_id FROM product
            WHERE REPLACE(LOWER(product_name), ' ', '') ILIKE %s
            LIMIT 1
        """, (f"%{product_name.lower().replace(' ', '')}%",))
        result = cur.fetchone()
        return result[0] if result else None
    except Exception as e:
        print("DEBUG resolve_product_id error:", e)
        return None
    finally:
        cur.close()
        conn.close()
 
def resolve_warehouse_id(warehouse_name):
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
            SELECT warehouse_id FROM warehouse
            WHERE LOWER(location) ILIKE %s
            LIMIT 1
        """, (f"%{warehouse_name.lower()}%",))
        result = cur.fetchone()
        return result[0] if result else None
    except Exception as e:
        print("DEBUG resolve_warehouse_id error:", e)
        return None
    finally:
        cur.close()
        conn.close()
 
#####sales goal
def get_sales_progress(sales_rep_id):
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
            SELECT monthly_sales_target, monthly_sales_achieved
            FROM sales_reps
            WHERE sales_rep_id = %s
        """, (sales_rep_id,))
        row = cur.fetchone()
        cur.close()
        conn.close()
 
        if row:
            target, achieved = row
            progress = (achieved / target) * 100 if target else 0
            return {
                "target": float(target),
                "achieved": float(achieved),
                "progress": min(progress, 100.0)
            }
        else:
            return None
    except Exception as e:
        print(f"DEBUG: Sales progress fetch error: {e}")
        return None

def create_order_request(dealer_id, sales_rep_id, product_id, quantity):
    """
    Insert a new order request into the order_requests table.
    """
    try:
        conn = psycopg2.connect(
            dbname=os.getenv("dbname"),
            user=os.getenv("user"),
            password=os.getenv("password"),
            host=os.getenv("host"),
            port=os.getenv("port")
        )
        cur = conn.cursor()
        print("DEBUG: Inserting into order_requests with", dealer_id, sales_rep_id, product_id, quantity)
        cur.execute("""
            INSERT INTO order_requests (dealer_id, sales_rep_id, product_id, quantity)
            VALUES (%s, %s, %s, %s)
        """, (dealer_id, sales_rep_id, product_id, quantity))
        conn.commit()
        cur.close()
        conn.close()
        return {"success": True, "message": "Order request created."}
    except Exception as e:
        print("❌ DB Error:", e)
        return {"success": False, "message": str(e)}

#####################################################################################################################
####################### MAIN ########################################################################
 
def main():
    print("🔐 Enhanced RAG System with Role-Based Access Control")
    print("Features: Fuzzy Matching + Dealer Access Control + Supabase Logging")
    print("=" * 60)
 
    while not check_authentication():
        if not login():
            retry = input("Try again? (y/n): ").lower()
            if retry != 'y':
                print("Goodbye!")
                return
 
    global current_session_id
    current_session_id = str(uuid.uuid4())
    print(f"DEBUG: New session started. session_id = {current_session_id}")
 
    print("Initializing entity cache...")
    get_database_entities()
 
    if current_user is not None:
        print(f"\nWelcome, {current_user.username}!")
        if current_user.is_dealer():
            print("\ud83c\udfea Dealer Access: Sales/Claims limited to your dealership")
        elif current_user.is_sales_rep():
            print("\ud83c\udfea Sales Rep Access: Sales/Claims limited to your dealership")
            progress_data = get_sales_progress(current_user.sales_rep_id)
            if progress_data:
                progress = progress_data["progress"]
                filled = int(progress // 5)
                bar = "[" + "#" * filled + "-" * (20 - filled) + "]"
                print(f"\n\ud83d\udcca Monthly Sales Progress:")
                print(f"{bar} {progress:.1f}%")
                print(f"Target: \u20b9{progress_data['target']:.2f}, Achieved: \u20b9{progress_data['achieved']:.2f}")
        elif current_user.is_admin():
            print("\ud83d\udd11 Admin Access: Full data access")
    else:
        print("No user is currently logged in.")

    print("\nCommands:")
    print("- Type your query to search")
    print("- Type 'logout' to switch users")
    print("- Type 'exit' to quit")
    print("-" * 60)
 
    while True:
        if current_user is not None:
            user_query = input(f"{current_user.username} > ").strip()
        else:
            user_query = input("> ").strip()
 
        if user_query.lower() == "exit":
            break
        elif user_query.lower() == "logout":
            logout()
            main()
            return
        elif not user_query:
            continue
 
        try:
            # 🛒 Sales Rep: Determine intent
            if current_user is not None and current_user.is_sales_rep():
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

                    # If dealer_id missing but dealer_name is present
                    if not dealer_id and "dealer_name" in extracted:
                        dealer_id = resolve_dealer_id(extracted["dealer_name"])
                    # If product_id missing but product_name is present
                    if not product_id and "product_name" in extracted:
                        product_id = resolve_product_id(extracted["product_name"])
                    # If warehouse_id is not an actual ID but a location name, resolve it
                    if warehouse_id and not warehouse_id.startswith("W"):
                        resolved_warehouse_id = resolve_warehouse_id(warehouse_id)
                        if resolved_warehouse_id:
                            warehouse_id = resolved_warehouse_id

                    if not product_id or not quantity or not dealer_id:
                        response = "❌ Missing order details. Please specify dealer, product, and quantity."
                    else:
                        response_obj = place_order(dealer_id, product_id, quantity, warehouse_id)
                        response = f"✅ {response_obj['message']}" if response_obj["success"] else f"❌ {response_obj['message']}"
 
                    print(f"shivam : {response}")
 
                    #save_to_supabase(user_query, response)
                    continue
 
                elif intent == "info":
                    # Fall through to SQL + RAG section below
                    pass
                else:
                    response = "❌ Could not understand your intent. Please try rephrasing."
                    print(f"shivam : {response}")
 
                    #save_to_supabase(user_query, response)
                    continue
 
            # 🧠 SQL + RAG for Dealer, Admin, or Sales Rep with info intent
            if current_user is not None and (current_user.is_dealer() or current_user.is_admin() or current_user.is_sales_rep()):
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

                def format_final_response(resp):
                    # If response looks like JSON, pretty print
                    try:
                        obj = json.loads(resp)
                        if isinstance(obj, dict):
                            return '\n'.join(f"{k}: {v}" for k, v in obj.items())
                        elif isinstance(obj, list):
                            return '\n\n'.join(
                                '\n'.join(f"{k}: {v}" for k, v in item.items()) for item in obj
                            )
                    except Exception:
                        pass
                    # Otherwise, split on commas if many, else just return
                    if ',' in resp and not '\n' in resp:
                        return '\n'.join([s.strip() for s in resp.split(',')])
                    return resp

                print(f"shivam : {format_final_response(answer)}")

                #save_to_supabase(user_query, answer)
 
        except Exception as e:
            print("shivam : Sorry, I can't assist with that.")
            print("DEBUG Exception:", e)
 
        print("\n" + "-" * 50 + "\n")
 
# def process_user_query(user_query, user_session):

 
if __name__ == "__main__":
    main()
 
def get_user_by_username(username):
    """
    Look up a user by username and return a UserSession object (no password check).
    """
    import psycopg2
    try:
        conn = psycopg2.connect(
            dbname=os.getenv("dbname"),
            user=os.getenv("user"),
            password=os.getenv("password"),
            host=os.getenv("host"),
            port=os.getenv("port")
        )
        cur = conn.cursor()
        query = """
        SELECT u.user_id, u.username, u.role, u.dealer_id, d.name as dealer_name,
               COALESCE(u.sales_rep_id, d.sales_rep_id) as sales_rep_id, s.name as sales_rep_name
        FROM users u
        LEFT JOIN dealer d ON u.dealer_id = d.dealer_id
        LEFT JOIN sales_reps s ON COALESCE(u.sales_rep_id, d.sales_rep_id) = s.sales_rep_id
        WHERE u.username = %s
        """
        cur.execute(query, (username,))
        result = cur.fetchone()
        cur.close()
        conn.close()
        if result:
            user_id, username, role, dealer_id, dealer_name, sales_rep_id, sales_rep_name = result
            print(f"[DEBUG] get_user_by_username: username={username}, role={role}, sales_rep_id={sales_rep_id}, sales_rep_name={sales_rep_name}")
            return UserSession(user_id, username, role, dealer_id, dealer_name, sales_rep_id, sales_rep_name)
        else:
            print("[DEBUG] get_user_by_username: No result found for", username)
            return None
    except Exception as e:
        print(f"get_user_by_username error: {e}")
        return None
 
