import os
import json
import time
import asyncio
import asyncpg
import requests
from dotenv import load_dotenv
from supabase_client import supabase
from pathlib import Path
import ssl

# === 🔐 Load environment variables ===
load_dotenv()
endpoint = os.getenv("AZURE_EMBEDDING_URL")
print("Supabase DB Host:", os.getenv("SUPABASE_DB_HOST"))


headers = {
    "Content-Type": "application/json",
    "Ocp-Apim-Subscription-Key": os.getenv("AZURE_EMBEDDING_SUBSCRIPTION_KEY"),
    "x-service-line": os.getenv("AZURE_OPENAI_SERVICE_LINE"),
    "x-brand": os.getenv("AZURE_OPENAI_BRAND"),
    "x-project": os.getenv("AZURE_OPENAI_PROJECT"),
    "api-version": os.getenv("AZURE_OPENAI_API_VERSION")
}

# === 🧠 Generate human-readable description from an order ===
def preprocess_order_row(row):
    return (
        f"Sales rep {row.get('sales_rep_id', 'N/A')} placed an order on behalf of dealer {row['dealer_id']} "
        f"for {row['quantity']} units of product {row['product_id']} from warehouse {row['warehouse_id']}. "
        f"Each unit is priced at ₹{row['unit_price']}, totaling ₹{row['total_cost']}. "
        f"The order was placed on {row['order_date']}."
    )


# === 🤖 Call Azure to get embedding ===
def get_embedding_with_retry(payload, max_retries=5):
    delay = 3
    if endpoint is None:
        raise ValueError("AZURE_EMBEDDING_URL environment variable is not set.")
    for attempt in range(max_retries):
        response = requests.post(str(endpoint), headers=headers, json=payload)
        if response.status_code == 200:
            return response.json()["data"][0]["embedding"]
        elif response.status_code == 429:
            wait_time = delay * (2 ** attempt)
            print(f"⚠️ Rate limit hit. Retrying in {wait_time}s...")
            time.sleep(wait_time)
        else:
            raise Exception(f"Embedding failed: {response.status_code} - {response.text}")
    raise Exception("❌ Max retries exceeded.")

# === 📥 Handle new order from pg_notify ===
async def handle_new_order(conn, pid, channel, payload):
    try:
        order = json.loads(payload)
        order_id = order["order_id"]
        print(f"📦 New order detected: {order_id}")

        # Generate description
        description = preprocess_order_row(order)
        payload = {"input": [description]}

        # Get embedding
        embedding = get_embedding_with_retry(payload)

        # Insert into vector_store
        supabase.table("vector_store").insert({
            "description": description,
            "embedding": embedding,
            "table_join": f"orders",
            "metadata": json.dumps({
                "dealer_id": order["dealer_id"],
                "product_id": order["product_id"],
                "warehouse_id": order["warehouse_id"],
                "quantity": order["quantity"],
                "unit_price": order["unit_price"],
                "total_cost": order["total_cost"],
                "order_date": order["order_date"],
                "sales_rep_id": order.get("sales_rep_id")
            })
        }).execute()

        print(f"✅ Order {order_id} embedded and stored successfully.")
    except Exception as e:
        print(f"❌ Error processing new order: {e}")

# === 📡 Listen to new_order_channel in PostgreSQL ===

import ssl

async def listen_to_new_orders():
    print("🔔 Starting listener for new_order_channel...")

    ssl_context = ssl.create_default_context()
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl.CERT_NONE

    conn = await asyncpg.connect(
        user=os.getenv("SUPABASE_DB_USER"),
        password=os.getenv("SUPABASE_DB_PASSWORD"),
        database=os.getenv("SUPABASE_DB_NAME"),
        host=os.getenv("SUPABASE_DB_HOST"),
        port=int(os.getenv("SUPABASE_DB_PORT", 5432)),
        ssl=ssl_context  # ← VERY IMPORTANT
    )

    await conn.add_listener("new_order_channel", handle_new_order)
    print("✅ Listening for new order inserts...")

    while True:
        await asyncio.sleep(5)

if __name__ == "__main__":
    asyncio.run(listen_to_new_orders())
