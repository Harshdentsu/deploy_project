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

# ✅ Get already embedded claim_ids
print("🔄 Fetching already embedded claim_id values...")
existing = supabase.table("vector_store").select("metadata").eq("table_join", "claim+product+dealer+sales_reps").execute().data
embedded_claim_ids = {
    str(json.loads(row["metadata"]).get("claim_id")) for row in existing if row.get("metadata")
}
print(f"✅ {len(embedded_claim_ids)} claim records already embedded.")

# ✅ Fetch fresh claim rows via joined view
rows = supabase.table("claims_with_joins").select("*").execute().data
print(f"📦 Total joined claim records: {len(rows)}")

# ✅ Description formatter
def preprocess_claim_row(row):
    return (
        f"Claim {row['claim_id']} was filed on {row['claim_date']} by dealer '{row['dealer_name']}' (ID: {row['dealer_id']}) from zone '{row['dealer_zone']}'. "
        f"The claim is related to product '{row['product_name']}' (ID: {row['product_id']}, category: {row['category']}), "
        f"priced at ₹{row['price']}, with specs: {row['section_width']}mm width, {row['aspect_ratio']} aspect ratio, {row['rim_diameter_inch']} inch rim, {row['construction_type']} type. "
        f"Status: {row['status']}, Amount: ₹{row['amount']}, Reason: {row.get('reason', 'N/A')}. "
        f"The sales rep handling the dealer is '{row['sales_rep_name']}' (ID: {row['sales_rep_id']}) from zone '{row['sales_rep_zone']}'."
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
    claim_id_str = str(row["claim_id"])
    if claim_id_str in embedded_claim_ids:
        print(f"⏭️ Skipping already embedded claim ID {claim_id_str}")
        continue

    if count >= MAX_WEEKLY_REQUESTS:
        print("🛑 Weekly quota reached. Stopping.")
        break

    try:
        description = preprocess_claim_row(row)
        payload = {"input": [description]}
        embedding = get_embedding_with_retry(payload)

        supabase.table("vector_store").insert({
            "description": description,
            "embedding": embedding,
            "table_join": "claim+product+dealer+sales_reps",
            "metadata": json.dumps({
                "claim_id": row["claim_id"],
                "claim_date": row["claim_date"],
                "status": row["status"],
                "amount": row["amount"],
                "reason": row["reason"],
                "dealer_id": row["dealer_id"],
                "dealer_name": row["dealer_name"],
                "dealer_zone": row["dealer_zone"],
                "product_id": row["product_id"],
                "product_name": row["product_name"],
                "category": row["category"],
                "price": row["price"],
                "section_width": row["section_width"],
                "aspect_ratio": row["aspect_ratio"],
                "rim_diameter_inch": row["rim_diameter_inch"],
                "construction_type": row["construction_type"],
                "sales_rep_id": row["sales_rep_id"],
                "sales_rep_name": row["sales_rep_name"],
                "sales_rep_zone": row["sales_rep_zone"]
            })
        }).execute()

        print(f"✅ Embedded and stored claim ID {row['claim_id']}")
        count += 1
        time.sleep(3)

    except Exception as e:
        print(f"❌ Failed to embed claim {row.get('claim_id')}: {e}")
