# backend/chart_api.py
from fastapi import APIRouter, Query
from supabase_client import supabase 
from fastapi.responses import JSONResponse # Already configured

router = APIRouter()


@router.get("/monthly-target")
def get_sales_target_vs_achievement(salesrepid: str = Query(..., description="Sales Rep ID")):
    # Fetch target from sales_reps table
    rep_response = supabase.table("sales_reps").select("monthly_sales_target").eq("sales_rep_id", salesrepid).execute()
    
    if not rep_response.data:
        return JSONResponse(status_code=404, content={"error": "Sales rep not found"})

    target = rep_response.data[0]["monthly_sales_target"]

    # Fetch all orders and sum total_cost for this sales rep
    orders_response = supabase.table("orders").select("total_cost").eq("sales_rep_id", salesrepid).execute()
    
    if not orders_response.data:
        achieved = 0
    else:
        achieved = sum(order["total_cost"] for order in orders_response.data if order.get("total_cost"))

    # Calculate percentage achieved
    percentage = round((achieved / target) * 100, 1) if target else 0

    return {
        "target": target,
        "achieved": achieved,
        "percentageAchieved": percentage
    }


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
@router.get("/top-selling-skus")
def get_top_selling_skus(sales_rep_id: str = Query(..., description="Sales Rep ID")):
    # Fetch all orders for the sales rep
    orders_resp = supabase.table("orders") \
        .select("product_id, quantity") \
        .eq("sales_rep_id", sales_rep_id) \
        .execute()

    orders = orders_resp.data or []

    # Aggregate quantity per product
    sku_quantity = {}
    for order in orders:
        pid = order["product_id"]
        qty = order["quantity"]
        sku_quantity[pid] = sku_quantity.get(pid, 0) + qty

    if not sku_quantity:
        return []

    # Fetch product names
    product_ids = list(sku_quantity.keys())
    products_resp = supabase.table("product") \
        .select("product_id, product_name") \
        .in_("product_id", product_ids) \
        .execute()

    product_names = {p["product_id"]: p["product_name"] for p in (products_resp.data or [])}

    # Prepare and sort result
    result = [
        {
            "product_id": pid,
            "product_name": product_names.get(pid, "Unknown"),
            "total_quantity": qty
        }
        for pid, qty in sku_quantity.items()
    ]
    result.sort(key=lambda x: x["total_quantity"], reverse=True)

    return result[:5]


@router.get("/kpi-metrics")
def get_kpi_metrics(sales_rep_id: str = Query(..., description="Sales Rep ID")):
    # Fetch monthly target and achieved from sales_reps table
    rep_resp = supabase.table("sales_reps") \
        .select("monthly_sales_target, monthly_sales_achieved") \
        .eq("sales_rep_id", sales_rep_id) \
        .single() \
        .execute()
    
    rep_data = rep_resp.data or {}

    # Fetch all orders placed by this rep
    orders_resp = supabase.table("orders") \
        .select("total_cost") \
        .eq("sales_rep_id", sales_rep_id) \
        .execute()

    orders = orders_resp.data or []

    total_orders = len(orders)
    total_sales = round(sum(float(o["total_cost"]) for o in orders), 2)

    return {
        "monthly_target": rep_data.get("monthly_sales_target", 0),
        "monthly_achieved": rep_data.get("monthly_sales_achieved", 0),
        "total_orders": total_orders,
        "total_sales": total_sales,
        "percentage_achieved": round(
            (rep_data.get("monthly_sales_achieved", 0) / rep_data.get("monthly_sales_target", 1)) * 100,
            1,
        ) if rep_data.get("monthly_sales_target") else 0,
    }

@router.get("/category-sales-breakdown")
def category_sales_breakdown(sales_rep_id: str = Query(...)):
    # Fetch orders
    orders_resp = supabase.table("orders") \
        .select("product_id, quantity") \
        .eq("sales_rep_id", sales_rep_id) \
        .execute()
    orders = orders_resp.data or []

    if not orders:
        return []

    # Fetch product categories
    product_ids = list({o["product_id"] for o in orders})
    products_resp = supabase.table("product") \
        .select("product_id, category") \
        .in_("product_id", product_ids) \
        .execute()
    product_map = {p["product_id"]: p["category"] for p in (products_resp.data or [])}

    # Aggregate by category
    category_sales = {}
    for order in orders:
        category = product_map.get(order["product_id"], "Unknown")
        category_sales[category] = category_sales.get(category, 0) + order["quantity"]

    total_units = sum(category_sales.values())
    result = [
        {
            "category": category,
            "units_sold": qty,
            "percentage": round((qty / total_units) * 100, 1)
        }
        for category, qty in category_sales.items()
    ]
    result.sort(key=lambda x: x["units_sold"], reverse=True)
    return result

@router.get("/zone-sales")
def get_sales_by_state():
    # Fetch orders with warehouse data (joined)
    response = supabase.table("orders") \
        .select("total_cost, warehouse:warehouse_id(location)") \
        .execute()

    data = response.data or []

    # Aggregate sales per state (location)
    state_sales = {}
    for order in data:
        state = order.get("warehouse", {}).get("location")
        total_cost = order.get("total_cost", 0)

        if state:
            state_sales[state] = state_sales.get(state, 0) + total_cost

    # Convert to list of dicts
    result = [{"state": state, "total_sales": round(sales, 2)} for state, sales in state_sales.items()]
    return result
