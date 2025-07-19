from supabase import create_client
from dotenv import load_dotenv
import os

# Load .env variables
load_dotenv()


SUPABASE_URL="https://ojbalezgbnwunzzoajum.supabase.co"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qYmFsZXpnYm53dW56em9hanVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0OTk0MzMsImV4cCI6MjA2NTA3NTQzM30.20UaD3p7f1PHDCUhyEO4n3orWGqB-ku7pzBQLESXh4E"

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def debug_users_table():
    try:
        result = supabase.table("users").select("*").limit(3).execute()
        return result.data
    except Exception as e:
        return {"error": str(e)}
