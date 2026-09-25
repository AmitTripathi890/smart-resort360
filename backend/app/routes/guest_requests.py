from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import and_, desc
from typing import List, Optional
from datetime import datetime

from app.database.connection import get_db
from app.models import GuestRequest, Room, Task, Department, ActivityLog, User
from app.schemas import GuestRequestCreate, GuestRequestResponse
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api/guest-requests", tags=["Guest Requests"])

@router.post("", response_model=GuestRequestResponse)
def create_guest_request(
    request_in: GuestRequestCreate,
    db: Session = Depends(get_db)
):
    """
    Public / QR Code endpoint for guests to submit operational requests.
    Does NOT require internal staff login.
    """
    # Find resort and room
    room = db.query(Room).filter(Room.room_number == request_in.room_number).first()
    resort_id = room.resort_id if room else 1

    # Map request type to department
    dept_name = "Front Desk"
    req_lower = request_in.request_type.lower()
    if "ac" in req_lower or "maintenance" in req_lower or "plumb" in req_lower:
        dept_name = "Maintenance"
    elif "towel" in req_lower or "linen" in req_lower or "clean" in req_lower or "housekeeping" in req_lower:
        dept_name = "Housekeeping"
    elif "food" in req_lower or "service" in req_lower or "beverage" in req_lower or "dining" in req_lower:
        dept_name = "Food & Beverage"

    dept = db.query(Department).filter(
        and_(
            Department.resort_id == resort_id,
            Department.name.ilike(f"%{dept_name}%")
        )
    ).first()

    # Create guest request record
    guest_req = GuestRequest(
        resort_id=resort_id,
        room_id=room.id if room else None,
        room_number=request_in.room_number,
        guest_name=request_in.guest_name or "Guest",
        request_type=request_in.request_type,
        description=request_in.description,
        priority=request_in.priority or "MEDIUM",
        status="PENDING"
    )
    db.add(guest_req)
    db.flush()

    # Automatically create operational task for the department
    task = Task(
        resort_id=resort_id,
        department_id=dept.id if dept else 1,
        title=f"Guest Request: Room {request_in.room_number} ({request_in.request_type})",
        description=f"Guest {request_in.guest_name or 'In-house'}: {request_in.description}",
        priority=request_in.priority or "MEDIUM",
        status="PENDING",
        room_number=request_in.room_number
    )
    db.add(task)
    db.flush()

    guest_req.task_id = task.id

    # Activity Log
    log = ActivityLog(
        resort_id=resort_id,
        user_name=f"Guest (Room {request_in.room_number})",
        user_role="GUEST",
        action_type="GUEST_REQUEST_SUBMITTED",
        entity_type="guest_request",
        entity_id=guest_req.id,
        description=f"Guest in Room {request_in.room_number} submitted request: '{request_in.request_type}'. Task created for {dept_name}.",
        details_json={"room": request_in.room_number, "task_id": task.id}
    )
    db.add(log)
    db.commit()
    db.refresh(guest_req)

    return guest_req


@router.get("", response_model=List[GuestRequestResponse])
def get_all_guest_requests(
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Internal endpoint for staff to view all guest requests.
    """
    resort_id = current_user.resort_id

    query = db.query(GuestRequest).filter(GuestRequest.resort_id == resort_id)
    if status:
        query = query.filter(GuestRequest.status == status.upper())

    return query.order_by(GuestRequest.created_at.desc()).all()


@router.patch("/{request_id}/status")
def update_guest_request_status(
    request_id: int,
    status: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update guest request status (PENDING, IN_PROGRESS, COMPLETED).
    """
    resort_id = current_user.resort_id

    req = db.query(GuestRequest).filter(
        and_(GuestRequest.id == request_id, GuestRequest.resort_id == resort_id)
    ).first()

    if not req:
        raise HTTPException(status_code=404, detail="Guest request not found")

    req.status = status.upper()
    if req.status == "COMPLETED":
        req.completed_at = datetime.utcnow()
        if req.task:
            req.task.status = "COMPLETED"
            req.task.completed_at = datetime.utcnow()

    db.commit()

    return {"success": True, "request_id": req.id, "status": req.status}
