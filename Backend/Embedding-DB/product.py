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

# ✅ Get already embedded product_ids
print("🔄 Fetching already embedded product_id values...")
existing = supabase.table("vector_store").select("metadata").eq("table_join", "product").execute().data
embedded_product_ids = {
    str(json.loads(row["metadata"]).get("product_id")) for row in existing if row.get("metadata")
}
print(f"✅ {len(embedded_product_ids)} product records already embedded.")

# ✅ Fetch fresh product rows
data = supabase.table("product").select("*").execute().data
print(f"📦 Total products fetched: {len(data)}")

# ✅ Description formatter
def preprocess_product_row(row):
    return (
        f"Product '{row['product_name']}' (ID: {row['product_id']}) is a {row['category']} category item priced at ₹{row['price']}. "
        f"It has a section width of {row['section_width']}mm, an aspect ratio of {row['aspect_ratio']}, "
        f"a rim diameter of {row['rim_diameter_inch']} inches, and is built with {row['construction_type']} construction."
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

for row in data:
    product_id_str = str(row["product_id"])
    if product_id_str in embedded_product_ids:
        print(f"⏭️ Skipping already embedded product ID {product_id_str}")
        continue

    if count >= MAX_WEEKLY_REQUESTS:
        print("🛑 Weekly quota reached. Stopping.")
        break

    try:
        description = preprocess_product_row(row)
        payload = {"input": [description]}
        embedding = get_embedding_with_retry(payload)

        supabase.table("vector_store").insert({
            "description": description,
            "embedding": embedding,
            "table_join": "product",
            "metadata": json.dumps({
                "product_id": row["product_id"],
                "product_name": row["product_name"],
                "category": row["category"],
                "price": row["price"],
                "section_width": row["section_width"],
                "aspect_ratio": row["aspect_ratio"],
                "rim_diameter_inch": row["rim_diameter_inch"],
                "construction_type": row["construction_type"]
            })
        }).execute()

        print(f"✅ Embedded and stored product ID {product_id_str}")
        count += 1
        time.sleep(3)

    except Exception as e:
        print(f"❌ Failed to embed product {row.get('product_id')}: {e}")
