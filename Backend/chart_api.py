# backend/chart_api.py
from fastapi import APIRouter
from supabase_client import supabase  # Already configured

router = APIRouter()

@router.get("/sales-reps")
def get_sales_rep_data():
    response = supabase.table("sales_reps").select("*").execute()
    return response.data
