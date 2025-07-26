from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from email_api import router as email_router
from login_api import router as login_router
from chart_api import router as chart_router
from vector_trigger import listen_to_new_orders
from inventory_trigger import listen_to_inventory_updates
from dealer_anlytics_api import router as dealer_analytics_router
import asyncio

app = FastAPI()

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=[ "https://thankful-cliff-024e50a10.1.azurestaticapps.net" , "http://localhost:8080",],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Include all routers
app.include_router(email_router)
app.include_router(chart_router)
app.include_router(dealer_analytics_router)
app.include_router(login_router)

# Optional: Background tasks
# @app.on_event("startup")
# async def start_background_listeners():
#     asyncio.create_task(listen_to_new_orders())
#     asyncio.create_task(listen_to_inventory_updates())
