from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from email_api import router as email_router
from login_api import app as login_app
from chart_api import router as chart_router  # ✅ Add this
from vector_trigger import listen_to_new_orders
from inventory_trigger import listen_to_inventory_updates
import asyncio

app = FastAPI()

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(email_router)
app.include_router(chart_router)  # ✅ Add this

# Mount login_api endpoints
app.mount("/", login_app)

@app.on_event("startup")
async def start_background_listeners():
    asyncio.create_task(listen_to_new_orders())
    asyncio.create_task(listen_to_inventory_updates())
