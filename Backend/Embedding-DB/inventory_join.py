import os
import requests
import time
import json
from dotenv import load_dotenv
from supabase_client import supabase

# Load env vars
load_dotenv()
endpoint = os.getenv("AZURE_EMBEDDING_URL")

headers = {
    "Content-Type": "application/json",
    "Ocp-Apim-Subscription-Key": os.getenv("AZURE_EMBEDDING_SUBSCRIPTION_KEY"),
    "x-service-line": os.getenv("AZURE_OPENAI_SERVICE_LINE"),
    "x-brand": os.getenv("AZURE_OPENAI_BRAND"),
    "x-project": os.getenv("AZURE_OPENAI_PROJECT"),
    "api-version": os.getenv("AZURE_OPENAI_API_VERSION")
}

# ✅ Get already embedded product+warehouse IDs
print("🔄 Fetching already embedded inventory values...")
existing = supabase.table("vector_store").select("metadata").eq("table_join", "inventory+product+warehouse").execute().data
embedded_keys = {
    (json.loads(row["metadata"]).get("product_id"), json.loads(row["metadata"]).get("warehouse_id"))
    for row in existing if row.get("metadata")
}
print(f"✅ {len(embedded_keys)} inventory records already embedded.")

# ✅ Fetch fresh inventory rows via joined view
rows = supabase.table("inventory_with_joins").select("*").execute().data
print(f"📦 Total joined inventory records: {len(rows)}")

# ✅ Description formatter
def preprocess_inventory_row(row):
    return (
        f"Inventory record: {row['quantity']} units of product '{row['product_name']}' (ID: {row['product_id']}) in category '{row['category']}' are stored in warehouse '{row['warehouse_location']}' (ID: {row['warehouse_id']}) located in zone '{row['warehouse_zone']}'. "
        f"Product specs include: ₹{row['price']} price, section width {row['section_width']}mm, aspect ratio {row['aspect_ratio']}, "
        f"rim diameter {row['rim_diameter_inch']} inches, and construction type {row['construction_type']}."
    )

# ✅ Embedding with retry logic
def get_embedding_with_retry(payload, max_retries=5):
    delay = 3
    for attempt in range(max_retries):
        response = requests.post(endpoint, headers=headers, json=payload)
        if response.status_code == 200:
            return response.json()["data"][0]["embedding"]
        elif response.status_code == 429:
            wait_time = delay * (2 ** attempt)
            print(f"⚠️ Rate limit hit. Retrying in {wait_time}s...")
            time.sleep(wait_time)
        else:
            raise Exception(f"Embedding failed: {response.status_code} - {response.text}")
    raise Exception("❌ Max retries exceeded.")

# ✅ Main embedding loop
MAX_WEEKLY_REQUESTS = 5000
count = 0

for row in rows:
    key = (row["product_id"], row["warehouse_id"])
    if key in embedded_keys:
        print(f"⏭️ Skipping already embedded record for Product {key[0]} + Warehouse {key[1]}")
        continue

    if count >= MAX_WEEKLY_REQUESTS:
        print("🛑 Weekly quota reached. Stopping.")
        break

    try:
        description = preprocess_inventory_row(row)
        payload = {"input": [description]}
        embedding = get_embedding_with_retry(payload)

        supabase.table("vector_store").insert({
            "description": description,
            "embedding": embedding,
            "table_join": "inventory+product+warehouse",
            "metadata": json.dumps({
                "product_id": row["product_id"],
                "product_name": row["product_name"],
                "category": row["category"],
                "price": row["price"],
                "section_width": row["section_width"],
                "aspect_ratio": row["aspect_ratio"],
                "rim_diameter_inch": row["rim_diameter_inch"],
                "construction_type": row["construction_type"],
                "warehouse_id": row["warehouse_id"],
                "warehouse_location": row["warehouse_location"],
                "warehouse_zone": row["warehouse_zone"],
                "quantity": row["quantity"]
            })
        }).execute()

        print(f"✅ Embedded and stored Product {key[0]} in Warehouse {key[1]}")
        count += 1
        time.sleep(3)

    except Exception as e:
        print(f"❌ Failed to embed inventory record {key}: {e}")
