# backend/chart_api.py
from fastapi import APIRouter, Query
from supabase_client import supabase  # Already configured

router = APIRouter()

@router.get("/sales-reps")
def get_sales_rep_data(salesrepid: str = Query(..., description="Sales Rep ID of the logged-in sales rep")):
    response = supabase.table("sales_reps").select("*").eq("sales_rep_id", salesrepid).execute()
    return response.data

@router.get("/dealer-performance")
def get_dealer_performance(sales_rep_id: str = Query(..., description="Sales Rep ID of the logged-in sales rep")):
    # Step 1: Fetch all dealers under the sales rep
    dealers_resp = supabase.table("dealer") \
        .select("dealer_id, name") \
        .eq("sales_rep_id", sales_rep_id) \
        .execute()

    dealers = dealers_resp.data or []
    performance = []

    for dealer in dealers:
        # Step 2: Fetch orders placed by this dealer
        orders_resp = supabase.table("orders") \
            .select("quantity, unit_price") \
            .eq("dealer_id", dealer["dealer_id"]) \
            .execute()
        
        # Step 3: Calculate total sales = quantity * unit_price
        total_sales = sum(
            order["quantity"] * order["unit_price"]
            for order in (orders_resp.data or [])
        )

        # Step 4: Append dealer performance
        performance.append({
            "dealer_id": dealer["dealer_id"],
            "dealer_name": dealer["name"],
            "total_sales": total_sales
        })

    return performance

# ✅ NEW: Top Selling SKUs Endpoint
@router.get("/top-selling-skus")
def get_top_selling_skus(sales_rep_id: str = Query(..., description="Sales Rep ID of the logged-in sales rep")):
    # Step 1: Fetch all orders made under this sales rep
    orders_resp = supabase.table("orders") \
        .select("product_id, quantity, unit_price") \
        .eq("sales_rep_id", sales_rep_id) \
        .execute()
    
    orders = orders_resp.data or []

    # Step 2: Aggregate by product_id
    product_totals = {}
    total_revenue = 0
    for order in orders:
        pid = order["product_id"]
        quantity = order["quantity"]
        revenue = order["quantity"] * order["unit_price"]
        total_revenue += revenue
        if pid not in product_totals:
            product_totals[pid] = {"quantity": 0, "revenue": 0}
        product_totals[pid]["quantity"] += quantity
        product_totals[pid]["revenue"] += revenue

    # Step 3: Fetch product names
    product_ids = list(product_totals.keys())
    if not product_ids:
        return []

    products_resp = supabase.table("product") \
        .select("product_id, product_name") \
        .in_("product_id", product_ids) \
        .execute()
    
    product_names = {p["product_id"]: p["product_name"] for p in (products_resp.data or [])}

    # Step 4: Merge data and sort by quantity
    result = []
    for pid, values in product_totals.items():
        result.append({
            "product_id": pid,
            "product_name": product_names.get(pid, "Unknown"),
            "total_quantity": values["quantity"],
            "total_revenue": values["revenue"],
            "contribution": round((values["revenue"] / total_revenue) * 100, 2) if total_revenue else 0
        })

    result.sort(key=lambda x: x["total_quantity"], reverse=True)
    return result[:5]
