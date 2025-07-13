from fastapi import APIRouter, Query
from supabase_client import supabase 
from fastapi.responses import JSONResponse # Already configured
from collections import defaultdict
from collections import Counter
router = APIRouter()


@router.get("/orders-count")
def get_dealer_kpi(dealer_id: str = Query(...)):
    print("Fetching orders for dealer:", dealer_id)

    response = supabase \
        .table("orders") \
        .select("order_id") \
        .eq("dealer_id", dealer_id) \
        .execute()

    print("Raw response:", response)

    # Now, use len of response.data since supabase-py returns the rows directly
    total_orders = len(response.data) if response.data else 0

    return {"total_orders": total_orders}

@router.get("/total-units")
def get_total_units_ordered(dealer_id: str = Query(...)):
    response = (
        supabase
        .table("orders")
        .select("quantity")
        .eq("dealer_id", dealer_id)
        .execute()
    )

    # Remove error check, just check for data
    if not response.data:
        return {"total_units": 0}

    total_units = sum(order["quantity"] for order in response.data if "quantity" in order)
    return {"total_units": total_units}

@router.get("/total-purchase")
def get_total_purchase_value(dealer_id: str = Query(...)):
    response = (
        supabase
        .table("orders")
        .select("total_cost")
        .eq("dealer_id", dealer_id)
        .execute()
    )

    # Remove error check, just check for data
    if not response.data:
        return {"total_purchase": 0}

    total_purchase = sum(item["total_cost"] for item in response.data if item.get("total_cost"))
    return {"total_purchase": total_purchase}

@router.get("/dealer-claims-count")
def get_claims_count(dealer_id: str = Query(...)):
    response = (
        supabase
        .table("claim")
        .select("claim_id")
        .eq("dealer_id", dealer_id)
        .execute()
    )

    claims_raised = len(response.data) if response.data else 0
    return {
        "claims_raised": claims_raised
    }



@router.get("/top-ordered-skus")
def get_top_ordered_skus(
    dealer_id: str = Query(...),
    sort_by: str = Query("quantity"),
    limit: int = 5,
):
    print("Fetching orders for dealer:", dealer_id)

    # Fetch order data
    response = supabase.table("orders").select("product_id, quantity").eq("dealer_id", dealer_id).execute()

    if not response.data:
        return {"top_skus": []}

    orders_data = response.data
    if not orders_data:
        return {"top_skus": []}

    # Aggregate quantity
    product_quantity_map = defaultdict(int)
    for row in orders_data:
        product_quantity_map[row["product_id"]] += row["quantity"]

    product_ids = list(product_quantity_map.keys())

    # Fetch product info
    product_resp = supabase.table("product").select("product_id, product_name, price").in_("product_id", product_ids).execute()

    if not product_resp.data:
        return {"top_skus": []}

    result = []
    for product in product_resp.data:
        pid = product["product_id"]
        qty = product_quantity_map[pid]
        revenue = qty * product["price"]
        result.append({
            "product_id": pid,
            "product_name": product["product_name"],
            "total_quantity": qty,
            "revenue": revenue,
        })

    if sort_by == "revenue":
        result.sort(key=lambda x: x["revenue"], reverse=True)
    else:
        result.sort(key=lambda x: x["total_quantity"], reverse=True)

    return result[:limit]

@router.get("/claim-status-distribution")
def get_claim_status_distribution(dealer_id: str = Query(None)):
    # Fetch status field, optionally filter by dealer
    query = supabase.table("claim").select("status")
    if dealer_id:
        query = query.eq("dealer_id", dealer_id)

    response = query.execute()

    if not response.data:
        return []

    # Count claims per status
    status_counts = defaultdict(int)
    for row in response.data:
        status = row.get("status", "unknown")
        status_counts[status] += 1

    return [{"status": k, "count": v} for k, v in status_counts.items()]


@router.get("/category-split")
def get_category_split(dealer_id: str):
    # Get all orders for the dealer with product -> category join
    response = supabase.from_("orders").select("product:product_id(category)").eq("dealer_id", dealer_id).execute()

    if not response.data:
        return []
    
    rows = response.data

    category_counts = Counter(row["product"]["category"] for row in rows if row.get("product"))
    total = sum(category_counts.values())

    result = [
        {
            "category": category,
            "count": count,
            "percentage": round(count * 100 / total, 2)
        }
        for category, count in category_counts.items()
    ]
    return result

@router.get("/zone-wise-orders")
def get_dealer_zone_orders(dealer_id: str):
    # Fetch orders for the dealer with linked warehouse zone info
    response = supabase.table("orders") \
        .select("warehouse:warehouse_id(location)") \
        .eq("dealer_id", dealer_id) \
        .execute()

    data = response.data or []

    # Aggregate order count per state (location)
    state_orders = {}
    for order in data:
        state = order.get("warehouse", {}).get("location")
        if state:
            state_orders[state] = state_orders.get(state, 0) + 1

    # Convert to list of dicts for frontend
    result = [{"state": state, "total_sales": count} for state, count in state_orders.items()]
    return result
