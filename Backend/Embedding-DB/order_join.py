import os
import requests
import time
import json
from dotenv import load_dotenv
from supabase_client import supabase  # your Supabase client setup

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

# ✅ Get already embedded order_ids
print("🔄 Fetching already embedded order_id values...")
existing = supabase.table("vector_store").select("metadata").eq("table_join", "orders+product+dealer+sales_reps+warehouse").execute().data
embedded_order_ids = {
    str(json.loads(row["metadata"]).get("order_id")) for row in existing if row.get("metadata")
}
print(f"✅ {len(embedded_order_ids)} order records already embedded.")

# ✅ Fetch fresh order rows via joined view
rows = supabase.table("get_order_with_joins").select("*").execute().data
print(f"📦 Total joined records from view: {len(rows)}")


# ✅ Description formatter
def preprocess_order_row(row):
    return (
        f"Order {row['order_id']} was placed on {row['order_date']} by dealer '{row['dealer_name']}' (ID: {row['dealer_id']}) "
        f"from zone '{row['dealer_zone']}', and handled by sales representative '{row['sales_rep_name']}' (ID: {row['sales_rep_id']}). "
        f"The order included {row['quantity']} units of the product '{row['product_name']}' (ID: {row['product_id']}, category: {row['category']}) "
        f"with specifications — section width: {row['section_width']}mm, aspect ratio: {row['aspect_ratio']}, "
        f"rim diameter: {row['rim_diameter_inch']} inches, and construction type: {row['construction_type']}. "
        f"The product's price was ₹{row['price']}, with a unit sale price of ₹{row['unit_price']} and a total order value of ₹{row['total_cost']}. "
        f"Fulfillment was done from warehouse '{row['warehouse_location']}' (ID: {row['warehouse_id']}) located in zone '{row['warehouse_zone']}'."
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
    order_id_str = str(row["order_id"])
    if order_id_str in embedded_order_ids:
        print(f"⏭️ Skipping already embedded order ID {order_id_str}")
        continue

    if count >= MAX_WEEKLY_REQUESTS:
        print("🛑 Weekly quota reached. Stopping.")
        break

    try:
        description = preprocess_order_row(row)
        payload = {"input": [description]}
        embedding = get_embedding_with_retry(payload)

        supabase.table("vector_store").insert({
            "description": description,
            "embedding": embedding,
            "table_join": "orders+product+dealer+sales_reps+warehouse",
            "metadata": json.dumps({
                "order_id": row["order_id"],
                "order_date": row["order_date"],
                "dealer_id": row["dealer_id"],
                "dealer_name": row["dealer_name"],
                "dealer_zone": row["dealer_zone"],
                "sales_rep_id": row["sales_rep_id"],
                "sales_rep_name": row["sales_rep_name"],
                "product_id": row["product_id"],
                "product_name": row["product_name"],
                "category": row["category"],
                "price": row["price"],
                "unit_price": row["unit_price"],
                "quantity": row["quantity"],
                "total_cost": row["total_cost"],
                "section_width": row["section_width"],
                "aspect_ratio": row["aspect_ratio"],
                "rim_diameter_inch": row["rim_diameter_inch"],
                "construction_type": row["construction_type"],
                "warehouse_id": row["warehouse_id"],
                "warehouse_location": row["warehouse_location"],
                "warehouse_zone": row["warehouse_zone"]
            })
        }).execute()

        print(f"✅ Embedded and stored order ID {row['order_id']}")
        count += 1
        time.sleep(3)

    except Exception as e:
        print(f"❌ Failed to embed order {row.get('order_id')}: {e}")
