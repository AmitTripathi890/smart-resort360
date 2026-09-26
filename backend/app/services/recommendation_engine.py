from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_, update

from app.models import (
    Recommendation, Task, PurchaseOrder, InventoryItem,
    Department, User, ActivityLog, Resort
)
from app.services.forecast_engine import ForecastEngine
from app.services.staffing_engine import StaffingEngine
from app.services.inventory_engine import InventoryEngine

class RecommendationEngine:
    """
    Central orchestration engine for AI recommendations and closed-loop decision workflow.
    """

    def __init__(self, db: Session, resort_id: int):
        self.db = db
        self.resort_id = resort_id
        self.forecast_engine = ForecastEngine(db, resort_id)
        self.staffing_engine = StaffingEngine(db, resort_id)
        self.inventory_engine = InventoryEngine(db, resort_id)

    def generate_and_sync_recommendations(self) -> List[Recommendation]:
        """
        Scan all operational engines (forecast, staffing, inventory) and generate
        fresh explainable recommendations if not already existing.
        """
        # 1. Get 7-day forecast
        forecast_result = self.forecast_engine.generate_7day_forecast()
        forecast_days = forecast_result.get("forecast_days", [])

        # Target tomorrow's operations as primary focus
        tomorrow = datetime.utcnow() + timedelta(days=1)
        tomorrow_str = tomorrow.strftime("%Y-%m-%d")

        # 2. Check Staffing Gap for tomorrow
        staffing_analysis = self.staffing_engine.analyze_housekeeping_needs(tomorrow)
        if staffing_analysis["has_risk"] and staffing_analysis["staffing_gap"] > 0:
            existing_rec = self.db.query(Recommendation).filter(
                and_(
                    Recommendation.resort_id == self.resort_id,
                    Recommendation.type == "staffing",
                    Recommendation.target_date == tomorrow_str,
                    Recommendation.status == "PENDING"
                )
            ).first()

            if not existing_rec:
                rec_data = self.staffing_engine.generate_housekeeping_recommendation(staffing_analysis)
                new_rec = Recommendation(
                    resort_id=self.resort_id,
                    type=rec_data["type"],
                    priority=rec_data["priority"],
                    title=rec_data["title"],
                    recommended_action=rec_data["recommended_action"],
                    explanation=rec_data["explanation"],
                    expected_impact=rec_data["expected_impact"],
                    metrics_data=rec_data["metrics_data"],
                    target_date=rec_data["target_date"],
                    status="PENDING"
                )
                self.db.add(new_rec)

        # 3. Check Inventory Stockout Risks
        stockout_items = self.inventory_engine.get_stockout_items(forecast_days)
        for item_analysis in stockout_items:
            existing_po_rec = self.db.query(Recommendation).filter(
                and_(
                    Recommendation.resort_id == self.resort_id,
                    Recommendation.type == "inventory",
                    Recommendation.status == "PENDING",
                    Recommendation.title.ilike(f"%{item_analysis['item_name']}%")
                )
            ).first()

            if not existing_po_rec:
                rec_data = self.inventory_engine.generate_reorder_recommendation(item_analysis, tomorrow_str)
                new_rec = Recommendation(
                    resort_id=self.resort_id,
                    type=rec_data["type"],
                    priority=rec_data["priority"],
                    title=rec_data["title"],
                    recommended_action=rec_data["recommended_action"],
                    explanation=rec_data["explanation"],
                    expected_impact=rec_data["expected_impact"],
                    metrics_data=rec_data["metrics_data"],
                    target_date=rec_data["target_date"],
                    status="PENDING"
                )
                self.db.add(new_rec)

        self.db.commit()

        # Return all pending & recent recommendations
        return self.db.query(Recommendation).filter(
            Recommendation.resort_id == self.resort_id
        ).order_by(Recommendation.created_at.desc()).all()

    def approve_recommendation(
        self,
        recommendation_id: int,
        user_name: str = "General Manager",
        user_id: Optional[int] = None,
        user_role: str = "MANAGER"
    ) -> Dict[str, Any]:
        """
        Closed-loop execution:
        Approve recommendation -> Create Tasks or Purchase Orders -> Log in Activity Log.
        """
        approved_at = datetime.utcnow()
        result = self.db.execute(
            update(Recommendation)
            .where(
                Recommendation.id == recommendation_id,
                Recommendation.resort_id == self.resort_id,
                Recommendation.status == "PENDING",
            )
            .values(status="APPROVED", approved_by=user_name, approved_at=approved_at)
        )
        if result.rowcount != 1:
            self.db.rollback()
            existing = self.db.query(Recommendation).filter(
                Recommendation.id == recommendation_id,
                Recommendation.resort_id == self.resort_id,
            ).first()
            if not existing:
                raise ValueError("Recommendation not found")
            raise ValueError(f"Recommendation is already {existing.status}")

        rec = self.db.query(Recommendation).filter(
            Recommendation.id == recommendation_id,
            Recommendation.resort_id == self.resort_id,
        ).first()

        created_tasks = []
        created_pos = []

        # Closed Loop 1: Staffing Recommendation -> Create Tasks for Department
        if rec.type == "staffing":
            metrics = rec.metrics_data or {}
            dept_id = metrics.get("department_id")

            if not dept_id:
                dept = self.db.query(Department).filter(
                    and_(
                        Department.resort_id == self.resort_id,
                        Department.name.ilike("%housekeeping%")
                    )
                ).first()
                dept_id = dept.id if dept else 1

            staff_count = metrics.get("staff_needed", 2)
            target_date = metrics.get("target_date", "Tomorrow")

            # Create individual shift preparation tasks
            for i in range(int(staff_count)):
                task = Task(
                    resort_id=self.resort_id,
                    recommendation_id=rec.id,
                    department_id=dept_id,
                    title=f"Extra Housekeeping Shift #{i+1} ({target_date})",
                    description=(
                        f"Generated from approved AI Recommendation: '{rec.title}'. "
                        f"Support high turnover workload of {metrics.get('rooms_to_clean', 93)} rooms."
                    ),
                    priority=rec.priority,
                    status="PENDING",
                    due_date=datetime.utcnow() + timedelta(days=1),
                    sla_minutes=1440
                )
                self.db.add(task)
                created_tasks.append(task)

        # Closed Loop 2: Inventory Recommendation -> Create Purchase Order
        elif rec.type == "inventory":
            metrics = rec.metrics_data or {}
            item_id = metrics.get("item_id")
            quantity = metrics.get("reorder_quantity", 10.0)
            item_name = metrics.get("item_name", "Inventory Item")
            unit = metrics.get("unit", "units")
            estimated_cost = metrics.get("estimated_cost", 0.0)

            po = PurchaseOrder(
                resort_id=self.resort_id,
                recommendation_id=rec.id,
                inventory_item_id=item_id,
                item_name=item_name,
                quantity=quantity,
                unit=unit,
                estimated_cost=estimated_cost,
                supplier="Premium Resort Supply Co.",
                status="ORDERED",
                approved_by=user_name,
                created_at=datetime.utcnow()
            )
            self.db.add(po)
            created_pos.append(po)

        # Create Activity Log entry
        log_entry = ActivityLog(
            resort_id=self.resort_id,
            user_id=user_id,
            user_name=user_name,
            user_role=user_role,
            action_type="RECOMMENDATION_APPROVED",
            entity_type="recommendation",
            entity_id=rec.id,
            description=f"{user_name} approved recommendation: '{rec.title}'",
            details_json={
                "recommendation_id": rec.id,
                "type": rec.type,
                "priority": rec.priority,
                "created_tasks_count": len(created_tasks),
                "created_pos_count": len(created_pos),
                "approved_at": rec.approved_at.isoformat()
            }
        )
        self.db.add(log_entry)
        self.db.commit()

        return {
            "success": True,
            "recommendation_id": rec.id,
            "status": rec.status,
            "tasks_created": len(created_tasks),
            "purchase_orders_created": len(created_pos),
            "message": f"Recommendation '{rec.title}' successfully approved and converted to operational actions."
        }

    def reject_recommendation(
        self,
        recommendation_id: int,
        reason: Optional[str] = "Manager rejected recommendation",
        user_name: str = "General Manager",
        user_id: Optional[int] = None,
        user_role: str = "MANAGER"
    ) -> Dict[str, Any]:
        """
        Reject recommendation and log the decision.
        """
        rec = self.db.query(Recommendation).filter(
            and_(
                Recommendation.id == recommendation_id,
                Recommendation.resort_id == self.resort_id
            )
        ).first()

        if not rec:
            raise ValueError("Recommendation not found")

        rec.status = "REJECTED"
        rec.modified_details = reason
        rec.approved_by = user_name
        rec.approved_at = datetime.utcnow()

        log_entry = ActivityLog(
            resort_id=self.resort_id,
            user_id=user_id,
            user_name=user_name,
            user_role=user_role,
            action_type="RECOMMENDATION_REJECTED",
            entity_type="recommendation",
            entity_id=rec.id,
            description=f"{user_name} rejected recommendation: '{rec.title}'. Reason: {reason}",
            details_json={"recommendation_id": rec.id, "reason": reason}
        )
        self.db.add(log_entry)
        self.db.commit()

        return {
            "success": True,
            "recommendation_id": rec.id,
            "status": rec.status,
            "message": f"Recommendation '{rec.title}' rejected."
        }

    def modify_and_approve_recommendation(
        self,
        recommendation_id: int,
        modified_quantity: float,
        notes: Optional[str] = None,
        user_name: str = "General Manager",
        user_id: Optional[int] = None,
        user_role: str = "MANAGER"
    ) -> Dict[str, Any]:
        """
        Modify recommendation parameters (e.g., adjust staff count or purchase quantity) and approve.
        """
        modified_at = datetime.utcnow()
        result = self.db.execute(
            update(Recommendation)
            .where(
                Recommendation.id == recommendation_id,
                Recommendation.resort_id == self.resort_id,
                Recommendation.status == "PENDING",
            )
            .values(status="MODIFIED", approved_by=user_name, approved_at=modified_at)
        )
        if result.rowcount != 1:
            self.db.rollback()
            existing = self.db.query(Recommendation).filter(
                Recommendation.id == recommendation_id,
                Recommendation.resort_id == self.resort_id,
            ).first()
            if not existing:
                raise ValueError("Recommendation not found")
            raise ValueError(f"Recommendation is already {existing.status}")

        rec = self.db.query(Recommendation).filter(
            Recommendation.id == recommendation_id,
            Recommendation.resort_id == self.resort_id,
        ).first()
        rec.modified_details = f"Adjusted quantity to {modified_quantity}. Notes: {notes or 'None'}"

        # Update metrics data
        metrics = rec.metrics_data or {}
        if rec.type == "staffing":
            metrics["staff_needed"] = int(modified_quantity)
            rec.metrics_data = metrics
            rec.title = f"Add {int(modified_quantity)} Housekeeper(s) [Manager Adjusted]"
            rec.recommended_action = f"Schedule {int(modified_quantity)} additional housekeeping shifts."

            # Create adjusted tasks
            dept_id = metrics.get("department_id", 1)
            for i in range(int(modified_quantity)):
                task = Task(
                    resort_id=self.resort_id,
                    recommendation_id=rec.id,
                    department_id=dept_id,
                    title=f"Extra Housekeeping Shift #{i+1} (Modified to {int(modified_quantity)} total)",
                    description=f"Manager-modified action from recommendation: {notes or 'Increased/Adjusted staffing'}",
                    priority=rec.priority,
                    status="PENDING",
                    due_date=datetime.utcnow() + timedelta(days=1),
                    sla_minutes=1440
                )
                self.db.add(task)

        elif rec.type == "inventory":
            metrics["reorder_quantity"] = float(modified_quantity)
            rec.metrics_data = metrics
            rec.title = f"Reorder {metrics.get('item_name')} ({modified_quantity} {metrics.get('unit')}) [Manager Adjusted]"
            rec.recommended_action = f"Order {modified_quantity} {metrics.get('unit')} of {metrics.get('item_name')}."

            po = PurchaseOrder(
                resort_id=self.resort_id,
                recommendation_id=rec.id,
                inventory_item_id=metrics.get("item_id", 1),
                item_name=metrics.get("item_name", "Item"),
                quantity=float(modified_quantity),
                unit=metrics.get("unit", "units"),
                estimated_cost=float(modified_quantity) * metrics.get("unit_cost", 1.0),
                supplier="Premium Resort Supply Co.",
                status="ORDERED",
                approved_by=user_name,
                created_at=datetime.utcnow()
            )
            self.db.add(po)

        log_entry = ActivityLog(
            resort_id=self.resort_id,
            user_id=user_id,
            user_name=user_name,
            user_role=user_role,
            action_type="RECOMMENDATION_MODIFIED",
            entity_type="recommendation",
            entity_id=rec.id,
            description=f"{user_name} modified and approved recommendation: '{rec.title}' to quantity {modified_quantity}",
            details_json={
                "recommendation_id": rec.id,
                "modified_quantity": modified_quantity,
                "notes": notes
            }
        )
        self.db.add(log_entry)
        self.db.commit()

        return {
            "success": True,
            "recommendation_id": rec.id,
            "status": rec.status,
            "message": f"Recommendation successfully modified and approved."
        }
