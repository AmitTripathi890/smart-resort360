from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models import Department, User
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api/departments", tags=["Departments"])


@router.get("")
def get_departments(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return the departments available in the current user's resort."""
    departments = db.query(Department).filter(
        Department.resort_id == current_user.resort_id
    ).order_by(Department.name.asc()).all()
    return [{"id": department.id, "name": department.name} for department in departments]
