from fastapi import FastAPI
from routes.api import router as api_router

app = FastAPI(title="AI Vision Service")

@app.get("/")
def home():
    return {"status": "running"}

app.include_router(api_router, prefix="/api")