
import os
import json
import asyncio
import asyncpg
import ssl
from dotenv import load_dotenv
from supabase_client import supabase  # You must define supabase client elsewhere
import requests
import time

load_dotenv()

# === Generate human description from metadata ===
def generate_inventory_description(metadata):
    return (
        f"Inventory record: {metadata['quantity']} units of product '{metadata['product_name']}' (ID: {metadata['product_id']}) "
        f"in category '{metadata['category']}' are stored in warehouse '{metadata['warehouse_location']}' (ID: {metadata['warehouse_id']}) "
        f"located in zone '{metadata['warehouse_zone']}'. Product specs include: ₹{metadata['price']} price, "
        f"section width {metadata['section_width']}mm, aspect ratio {metadata['aspect_ratio']}, rim diameter "
        f"{metadata['rim_diameter_inch']} inches, and construction type {metadata['construction_type']}."
    )

# === Generate embedding ===
def get_embedding_with_retry(payload, max_retries=5):
    delay = 3
    endpoint = os.getenv("AZURE_EMBEDDING_URL")
    headers = {
        "Content-Type": "application/json",
        "Ocp-Apim-Subscription-Key": os.getenv("AZURE_EMBEDDING_SUBSCRIPTION_KEY"),
        "x-service-line": os.getenv("AZURE_OPENAI_SERVICE_LINE"),
        "x-brand": os.getenv("AZURE_OPENAI_BRAND"),
        "x-project": os.getenv("AZURE_OPENAI_PROJECT"),
        "api-version": os.getenv("AZURE_OPENAI_API_VERSION")
    }

    if endpoint is None:
        raise ValueError("AZURE_EMBEDDING_URL environment variable is not set.")

    for attempt in range(max_retries):
        res = requests.post(endpoint, headers=headers, json=payload)
        if res.status_code == 200:
            return res.json()["data"][0]["embedding"]
        elif res.status_code == 429:
            print(f"⚠️ Rate limit hit. Retrying in {delay * (2 ** attempt)} seconds...")
            time.sleep(delay * (2 ** attempt))
        else:
            raise Exception(f"Embedding failed: {res.status_code} - {res.text}")
    raise Exception("Max retries exceeded.")

# === Handler for inventory notification ===
async def handle_inventory_update(conn, pid, channel, payload):
    try:
        data = json.loads(payload)
        product_id = data["product_id"]
        warehouse_id = data["warehouse_id"]
        new_quantity = data["new_quantity"]

        print(f"📦 Received inventory update: {product_id} in {warehouse_id} → quantity: {new_quantity}")

        # Fetch all inventory vector_store rows
        response = supabase.table("vector_store").select("*").eq("table_join", "inventory+product+warehouse").execute()

        print("All vector_store rows with table_join=inventory+product+warehouse:")
        for row in response.data:
            print(row)

        found_row = None
        for row in response.data:
            meta = row["metadata"]
            if isinstance(meta, str):
                meta = json.loads(meta)
            print(f"Comparing: meta['product_id']={repr(meta.get('product_id'))}, payload={repr(product_id)}")
            print(f"Comparing: meta['warehouse_id']={repr(meta.get('warehouse_id'))}, payload={repr(warehouse_id)}")
            if str(meta.get("product_id", "")).strip() == str(product_id).strip() and \
               str(meta.get("warehouse_id", "")).strip() == str(warehouse_id).strip():
                found_row = row
                break

        if not found_row:
            print(f"⚠️ No vector_store entry found for product {product_id} in warehouse {warehouse_id}")
            return

        vector_id = found_row["id"]
        meta = found_row["metadata"]
        if isinstance(meta, str):
            meta = json.loads(meta)
        meta["quantity"] = new_quantity

        # Generate new description and embedding
        description = generate_inventory_description(meta)
        embedding = get_embedding_with_retry({"input": [description]})

        # Update vector_store row
        supabase.table("vector_store").update({
            "description": description,
            "embedding": embedding,
            "metadata": json.dumps(meta)
        }).eq("id", vector_id).execute()

        print(f"✅ vector_store updated successfully for product {product_id} in warehouse {warehouse_id}")

    except Exception as e:
        print(f"❌ Error handling inventory update: {e}")

# === Start listening ===
async def listen_to_inventory_updates():
    print("🔔 Listening for inventory updates...")

    ssl_context = ssl.create_default_context()
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl.CERT_NONE

    conn = await asyncpg.connect(
        user=os.getenv("SUPABASE_DB_USER"),
        password=os.getenv("SUPABASE_DB_PASSWORD"),
        database=os.getenv("SUPABASE_DB_NAME"),
          host=os.getenv("SUPABASE_DB_HOST"),
        port=int(os.getenv("SUPABASE_DB_PORT", 5432)),
        ssl=ssl_context
    )

    await conn.add_listener("inventory_update_channel", handle_inventory_update)
    print("✅ Connected to inventory_update_channel.")

    while True:
        await asyncio.sleep(5)

# === Entry point ===
if __name__ == "__main__":
    asyncio.run(listen_to_inventory_updates())
