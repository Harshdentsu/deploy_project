from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from email_api import router as email_router
from login_api import app as login_app

app = FastAPI()

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers from email_api
app.include_router(email_router)

# Mount login_api endpoints under the same app
# If login_api uses @app directly, we need to convert its endpoints to a router or mount as a sub-app
# Here, we mount it as a sub-app for /api endpoints
app.mount("/", login_app)
