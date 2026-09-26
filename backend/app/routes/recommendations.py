from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database.connection import get_db
from app.models import User, Recommendation, ActivityLog
from app.schemas import RecommendationResponse, RecommendationActionRequest, RecommendationOutcomeCreate
from app.utils.auth import get_current_user, require_role
from app.services.recommendation_engine import RecommendationEngine

router = APIRouter(prefix="/api/recommendations", tags=["Recommendations"])

@router.get("", response_model=List[RecommendationResponse])
def get_recommendations(
    status: str = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all recommendations for the resort.
    Optionally filter by status: PENDING, APPROVED, REJECTED, MODIFIED
    """
    resort_id = current_user.resort_id

    query = db.query(Recommendation).filter(Recommendation.resort_id == resort_id)

    if status:
        query = query.filter(Recommendation.status == status.upper())

    recommendations = query.order_by(
        Recommendation.priority.desc(),
        Recommendation.created_at.desc()
    ).all()

    return recommendations


@router.post("/generate")
def generate_recommendations(
    current_user: User = Depends(require_role(["MANAGER"])),
    db: Session = Depends(get_db)
):
    """
    Manually trigger AI recommendation generation.
    Manager-only endpoint.

    Scans operational data and generates fresh recommendations for:
    - Staffing gaps
    - Inventory stockouts
    - Maintenance needs
    """
    resort_id = current_user.resort_id

    rec_engine = RecommendationEngine(db, resort_id)
    recommendations = rec_engine.generate_and_sync_recommendations()

    return {
        "success": True,
        "generated_count": len([r for r in recommendations if r.status == "PENDING"]),
        "message": "AI recommendations successfully generated"
    }


@router.post("/{recommendation_id}/approve")
def approve_recommendation(
    recommendation_id: int,
    current_user: User = Depends(require_role(["MANAGER"])),
    db: Session = Depends(get_db)
):
    """
    Approve a recommendation and convert it into operational actions.

    Closed-loop execution:
    - Staffing recommendations → Create department tasks
    - Inventory recommendations → Create purchase orders
    - Log the approval in activity log
    """
    resort_id = current_user.resort_id

    rec_engine = RecommendationEngine(db, resort_id)
    result = rec_engine.approve_recommendation(
        recommendation_id=recommendation_id,
        user_name=current_user.name,
        user_id=current_user.id,
        user_role=current_user.role
    )

    return result


@router.post("/{recommendation_id}/reject")
def reject_recommendation(
    recommendation_id: int,
    request: RecommendationActionRequest,
    current_user: User = Depends(require_role(["MANAGER"])),
    db: Session = Depends(get_db)
):
    """
    Reject a recommendation with optional reason.
    """
    resort_id = current_user.resort_id

    rec_engine = RecommendationEngine(db, resort_id)
    result = rec_engine.reject_recommendation(
        recommendation_id=recommendation_id,
        reason=request.modified_notes or "Manager rejected recommendation",
        user_name=current_user.name,
        user_id=current_user.id,
        user_role=current_user.role
    )

    return result


@router.post("/{recommendation_id}/modify")
def modify_and_approve_recommendation(
    recommendation_id: int,
    request: RecommendationActionRequest,
    current_user: User = Depends(require_role(["MANAGER"])),
    db: Session = Depends(get_db)
):
    """
    Modify recommendation parameters (quantity) and approve.

    Example:
    - AI recommends "Add 2 housekeepers"
    - Manager modifies to "Add 3 housekeepers"
    - System creates 3 tasks instead of 2
    """
    resort_id = current_user.resort_id

    if request.modified_quantity is None:
        raise HTTPException(status_code=400, detail="modified_quantity is required")

    rec_engine = RecommendationEngine(db, resort_id)
    result = rec_engine.modify_and_approve_recommendation(
        recommendation_id=recommendation_id,
        modified_quantity=request.modified_quantity,
        notes=request.modified_notes,
        user_name=current_user.name,
        user_id=current_user.id,
        user_role=current_user.role
    )

    return result


@router.post("/{recommendation_id}/outcome")
def record_recommendation_outcome(
    recommendation_id: int,
    outcome: RecommendationOutcomeCreate,
    current_user: User = Depends(require_role(["MANAGER", "DEPARTMENT_HEAD"])),
    db: Session = Depends(get_db)
):
    """Record measured results after an approved recommendation is executed."""
    recommendation = db.query(Recommendation).filter(
        Recommendation.id == recommendation_id,
        Recommendation.resort_id == current_user.resort_id,
    ).first()
    if not recommendation:
        raise HTTPException(status_code=404, detail="Recommendation not found")
    if recommendation.status not in {"APPROVED", "MODIFIED"}:
        raise HTTPException(status_code=400, detail="Only approved recommendations can receive outcomes")
    if outcome.completion_percentage is not None and not 0 <= outcome.completion_percentage <= 100:
        raise HTTPException(status_code=422, detail="completion_percentage must be between 0 and 100")

    payload = outcome.model_dump(exclude_none=True)
    db.add(ActivityLog(
        resort_id=current_user.resort_id,
        user_id=current_user.id,
        user_name=current_user.name,
        user_role=current_user.role,
        action_type="RECOMMENDATION_OUTCOME_RECORDED",
        entity_type="recommendation",
        entity_id=recommendation.id,
        description=f"{current_user.name} recorded the outcome for recommendation '{recommendation.title}'",
        details_json={
            "recommendation_id": recommendation.id,
            "predicted_metrics": recommendation.metrics_data or {},
            "actual_outcome": payload,
        },
    ))
    db.commit()
    return {"success": True, "recommendation_id": recommendation.id, "outcome": payload}


@router.get("/{recommendation_id}/outcomes")
def get_recommendation_outcomes(
    recommendation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Read the recommendation's recorded outcome history."""
    return db.query(ActivityLog).filter(
        ActivityLog.resort_id == current_user.resort_id,
        ActivityLog.entity_type == "recommendation",
        ActivityLog.entity_id == recommendation_id,
        ActivityLog.action_type == "RECOMMENDATION_OUTCOME_RECORDED",
    ).order_by(ActivityLog.created_at.desc()).all()
