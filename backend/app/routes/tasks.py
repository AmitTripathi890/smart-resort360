from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import and_, desc
from typing import List
from datetime import datetime

from app.database.connection import get_db
from app.models import User, Task, Department, ActivityLog
from app.schemas import TaskResponse, TaskCreate, TaskAssignRequest, TaskStatusRequest, TaskEscalateRequest
from app.utils.auth import get_current_user, require_role

router = APIRouter(prefix="/api/tasks", tags=["Tasks"])

@router.get("", response_model=List[TaskResponse])
def get_tasks(
    department_id: int = None,
    status: str = None,
    assigned_to: int = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get tasks with optional filters:
    - department_id: filter by department
    - status: PENDING, IN_PROGRESS, COMPLETED, CANCELLED
    - assigned_to: filter by assigned staff user ID
    """
    resort_id = current_user.resort_id

    query = db.query(Task).filter(Task.resort_id == resort_id)

    if department_id:
        query = query.filter(Task.department_id == department_id)

    if status:
        query = query.filter(Task.status == status.upper())

    if assigned_to:
        query = query.filter(Task.assigned_to == assigned_to)

    tasks = query.order_by(Task.priority.desc(), Task.created_at.desc()).all()

    # Format response with department and assignee names
    result = []
    for t in tasks:
        task_dict = {
            "id": t.id,
            "resort_id": t.resort_id,
            "recommendation_id": t.recommendation_id,
            "department_id": t.department_id,
            "department_name": t.department.name if t.department else None,
            "assigned_to": t.assigned_to,
            "assignee_name": t.assignee.name if t.assignee else "Unassigned",
            "title": t.title,
            "description": t.description,
            "priority": t.priority,
            "status": t.status,
            "due_date": t.due_date,
            "room_number": t.room_number,
            "created_at": t.created_at,
            "completed_at": t.completed_at
        }
        result.append(task_dict)

    return result


@router.post("", response_model=TaskResponse)
def create_task(
    task_in: TaskCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Manually create a new operational task.
    """
    resort_id = current_user.resort_id

    # Calculate SLA if not provided
    sla_minutes = task_in.sla_minutes
    if not sla_minutes:
        # Default SLA by priority
        sla_map = {"CRITICAL": 60, "HIGH": 120, "MEDIUM": 240, "LOW": 480}
        sla_minutes = sla_map.get(task_in.priority or "MEDIUM", 240)

    # Calculate due_date from SLA if not explicitly provided
    due_date = task_in.due_date
    if not due_date and sla_minutes:
        due_date = datetime.utcnow() + timedelta(minutes=sla_minutes)

    task = Task(
        resort_id=resort_id,
        department_id=task_in.department_id,
        assigned_to=task_in.assigned_to,
        title=task_in.title,
        description=task_in.description,
        priority=task_in.priority or "MEDIUM",
        due_date=due_date,
        sla_minutes=sla_minutes,
        room_number=task_in.room_number,
        status="PENDING"
    )
    db.add(task)
    db.commit()
    db.refresh(task)

    # Log action
    log = ActivityLog(
        resort_id=resort_id,
        user_id=current_user.id,
        user_name=current_user.name,
        user_role=current_user.role,
        action_type="TASK_CREATED",
        entity_type="task",
        entity_id=task.id,
        description=f"{current_user.name} created task: '{task.title}'",
        details_json={"task_id": task.id, "department_id": task.department_id}
    )
    db.add(log)
    db.commit()

    return {
        "id": task.id,
        "resort_id": task.resort_id,
        "recommendation_id": task.recommendation_id,
        "department_id": task.department_id,
        "department_name": task.department.name if task.department else None,
        "assigned_to": task.assigned_to,
        "assignee_name": task.assignee.name if task.assignee else "Unassigned",
        "title": task.title,
        "description": task.description,
        "priority": task.priority,
        "status": task.status,
        "due_date": task.due_date,
        "sla_minutes": task.sla_minutes,
        "room_number": task.room_number,
        "blocker_reason": task.blocker_reason,
        "escalated_to_user_id": task.escalated_to_user_id,
        "escalated_at": task.escalated_at,
        "created_at": task.created_at,
        "completed_at": task.completed_at
    }


@router.patch("/{task_id}/assign")
def assign_task(
    task_id: int,
    request: TaskAssignRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Assign or reassign task to a staff member.
    Department Head / Manager role endpoint.
    """
    resort_id = current_user.resort_id

    task = db.query(Task).filter(
        and_(Task.id == task_id, Task.resort_id == resort_id)
    ).first()

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    staff = db.query(User).filter(
        and_(User.id == request.assigned_to, User.resort_id == resort_id)
    ).first()

    if not staff:
        raise HTTPException(status_code=404, detail="Staff user not found")

    old_assignee = task.assignee.name if task.assignee else "Unassigned"
    task.assigned_to = staff.id

    log = ActivityLog(
        resort_id=resort_id,
        user_id=current_user.id,
        user_name=current_user.name,
        user_role=current_user.role,
        action_type="TASK_ASSIGNED",
        entity_type="task",
        entity_id=task.id,
        description=f"{current_user.name} assigned task '{task.title}' to {staff.name} (was: {old_assignee})",
        details_json={"task_id": task.id, "assigned_to": staff.id, "staff_name": staff.name}
    )
    db.add(log)
    db.commit()

    return {
        "success": True,
        "task_id": task.id,
        "assigned_to": staff.id,
        "assignee_name": staff.name,
        "message": f"Task assigned to {staff.name}"
    }


@router.patch("/{task_id}/status")
def update_task_status(
    task_id: int,
    request: TaskStatusRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update task status (PENDING, IN_PROGRESS, COMPLETED, CANCELLED).
    Staff updates their assigned tasks.
    """
    resort_id = current_user.resort_id

    task = db.query(Task).filter(
        and_(Task.id == task_id, Task.resort_id == resort_id)
    ).first()

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    old_status = task.status
    task.status = request.status.upper()

    if task.status == "COMPLETED" and old_status != "COMPLETED":
        task.completed_at = datetime.utcnow()

    log = ActivityLog(
        resort_id=resort_id,
        user_id=current_user.id,
        user_name=current_user.name,
        user_role=current_user.role,
        action_type="TASK_STATUS_UPDATED",
        entity_type="task",
        entity_id=task.id,
        description=f"{current_user.name} updated task '{task.title}' status to {task.status}",
        details_json={"task_id": task.id, "old_status": old_status, "new_status": task.status}
    )
    db.add(log)
    db.commit()

    return {
        "success": True,
        "task_id": task.id,
        "status": task.status,
        "completed_at": task.completed_at.isoformat() if task.completed_at else None,
        "message": f"Task status updated to {task.status}"
    }
