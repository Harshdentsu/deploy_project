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

