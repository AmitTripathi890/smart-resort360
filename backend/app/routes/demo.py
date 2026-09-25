from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.connection import get_db, engine, Base
from app.database.seed import seed_database
from app.models import User
from app.utils.auth import require_role

router = APIRouter(prefix="/api/demo", tags=["Demo & Admin"])

@router.post("/reset")
def reset_demo_data(
    current_user: User = Depends(require_role(["MANAGER"])),
    db: Session = Depends(get_db)
):
    """
    Reset the entire database to demo state.
    Wipes all data and reseeds with synthetic operational data.

    Manager-only endpoint.

    WARNING: This is destructive and should only be used for demo/development.
    """
    try:
        # Close current session
        db.close()

        # Run seed
        seed_database()

        return {
            "success": True,
            "message": "Database successfully reset to demo state with synthetic operational data."
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": "Database reset failed. Check logs."
        }
