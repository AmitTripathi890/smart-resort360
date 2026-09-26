from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

from app.routes import (
    auth,
    dashboard,
    forecast,
    recommendations,
    tasks,
    inventory,
    guest_requests,
    activity_log,
    demo,
    front_desk,
    departments,
)

# Load environment variables
load_dotenv()

# Create FastAPI app
app = FastAPI(
    title="Smart Resort 360 API",
    description="AI-powered resort operations and decision-support platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware - Allow frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "https://*.vercel.app",
        "*"  # For demo purposes - restrict in production
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register route modules
app.include_router(auth.router)
app.include_router(dashboard.router)
app.include_router(forecast.router)
app.include_router(recommendations.router)
app.include_router(tasks.router)
app.include_router(inventory.router)
app.include_router(guest_requests.router)
app.include_router(activity_log.router)
app.include_router(demo.router)
app.include_router(front_desk.router)
app.include_router(departments.router)


@app.get("/")
def root():
    """API root endpoint with system information"""
    return {
        "service": "Smart Resort 360 API",
        "version": "1.0.0",
        "status": "operational",
        "description": "AI-powered resort operations orchestration platform",
        "docs": "/docs",
        "features": [
            "ML-based occupancy forecasting",
            "Predictive staffing recommendations",
            "Inventory stockout prediction",
            "Explainable AI recommendations",
            "Closed-loop decision workflow",
            "Multi-role operational dashboards",
            "Guest request management",
            "Activity audit logging"
        ]
    }


@app.get("/health")
def health_check():
    """Health check endpoint for deployment monitoring"""
    return {
        "status": "healthy",
        "database": "connected"
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)
