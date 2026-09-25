from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Dict, Any

from app.database.connection import get_db
from app.models import User
from app.utils.auth import get_current_user
from app.services.forecast_engine import ForecastEngine
from app.schemas import ForecastOverviewResponse

router = APIRouter(prefix="/api/forecast", tags=["Forecasting"])

@router.get("/occupancy", response_model=ForecastOverviewResponse)
def get_occupancy_forecast(
    days: int = 7,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get 7-day occupancy forecast with ML predictions.

    Uses Linear Regression trained on historical booking patterns.
    Combines confirmed bookings with predictive modeling.

    Returns:
    - Daily occupancy predictions
    - Check-in/check-out forecasts
    - Housekeeping workload projections
    - Staffing requirements
    - Revenue estimates
    - ML confidence scores
    """
    resort_id = current_user.resort_id

    forecast_engine = ForecastEngine(db, resort_id)
    forecast_result = forecast_engine.generate_7day_forecast()

    return forecast_result


@router.get("/workload")
def get_workload_forecast(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get departmental workload forecast derived from occupancy predictions.

    Returns workload metrics for:
    - Housekeeping (rooms to clean, turnovers)
    - Front Desk (check-ins/check-outs)
    - F&B (guest count, meal forecasts)
    """
    resort_id = current_user.resort_id

    forecast_engine = ForecastEngine(db, resort_id)
    forecast_result = forecast_engine.generate_7day_forecast()
    forecast_days = forecast_result.get("forecast_days", [])

    # Extract workload-specific metrics
    workload_by_department = {
        "housekeeping": [
            {
                "date": day["date"],
                "day_name": day["day_name"],
                "rooms_to_clean": day["cleaning_workload_rooms"],
                "housekeepers_needed": day["housekeepers_needed"],
                "housekeepers_scheduled": day["housekeepers_scheduled"],
                "staffing_gap": day["staffing_gap"],
                "check_outs": day["check_outs"],
                "early_arrivals": day["early_arrivals"]
            }
            for day in forecast_days
        ],
        "front_desk": [
            {
                "date": day["date"],
                "day_name": day["day_name"],
                "check_ins": day["check_ins"],
                "check_outs": day["check_outs"],
                "early_arrivals": day["early_arrivals"],
                "occupancy_pct": day["predicted_occupancy_pct"]
            }
            for day in forecast_days
        ],
        "food_beverage": [
            {
                "date": day["date"],
                "day_name": day["day_name"],
                "occupied_rooms": day["occupied_rooms"],
                "estimated_breakfast_guests": int(day["occupied_rooms"] * 1.8),  # avg 1.8 guests per room
                "estimated_dinner_covers": int(day["occupied_rooms"] * 1.3)  # ~60% dine at resort
            }
            for day in forecast_days
        ]
    }

    return {
        "workload_by_department": workload_by_department,
        "overall_summary": forecast_result.get("overall_summary", {}),
        "model_metadata": forecast_result.get("model_metadata", {})
    }
