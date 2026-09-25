from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from app.database.connection import get_db
from app.models import User, InventoryItem, PurchaseOrder, ActivityLog
from app.schemas import (
    InventoryItemResponse, PurchaseOrderResponse,
    PurchaseOrderCreate
)
from app.utils.auth import get_current_user, require_role
from app.services.forecast_engine import ForecastEngine
from app.services.inventory_engine import InventoryEngine
from datetime import datetime

router = APIRouter(prefix="/api/inventory", tags=["Inventory & Purchase Orders"])

@router.get("", response_model=List[InventoryItemResponse])
def get_inventory_items(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all inventory items with dynamic ML-driven stockout risk indicators.
    """
    resort_id = current_user.resort_id

    # Get forecast for demand analysis
    forecast_engine = ForecastEngine(db, resort_id)
    forecast_result = forecast_engine.generate_7day_forecast()
    forecast_days = forecast_result.get("forecast_days", [])

    inventory_engine = InventoryEngine(db, resort_id)
    analysis_list = inventory_engine.analyze_all_inventory(forecast_days)

    # Map back to InventoryItemResponse
    items = db.query(InventoryItem).filter(InventoryItem.resort_id == resort_id).all()
    analysis_map = {a["item_id"]: a for a in analysis_list}

    results = []
    for item in items:
        item_analysis = analysis_map.get(item.id, {})
        results.append({
            "id": item.id,
            "resort_id": item.resort_id,
            "name": item.name,
            "category": item.category,
            "unit": item.unit,
            "current_stock": item.current_stock,
            "reorder_threshold": item.reorder_threshold,
            "min_stock": item.min_stock,
            "max_stock": item.max_stock,
            "unit_cost": item.unit_cost,
            "consumption_rate_per_occupied_room": item.consumption_rate_per_occupied_room,
            "lead_time_days": item.lead_time_days,
            "stockout_risk": item_analysis.get("risk_level", "LOW"),
            "projected_days_left": item_analysis.get("days_until_stockout", 0.0)
        })

    return results


@router.get("/stockouts")
def get_stockout_predictions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get ML stockout risk analysis for all inventory items.
    """
    resort_id = current_user.resort_id

    forecast_engine = ForecastEngine(db, resort_id)
    forecast_result = forecast_engine.generate_7day_forecast()
    forecast_days = forecast_result.get("forecast_days", [])

    inventory_engine = InventoryEngine(db, resort_id)
    return inventory_engine.analyze_all_inventory(forecast_days)


@router.get("/purchase-orders", response_model=List[PurchaseOrderResponse])
def get_purchase_orders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all purchase orders created via AI recommendations or manual orders.
    """
    resort_id = current_user.resort_id

    pos = db.query(PurchaseOrder).filter(
        PurchaseOrder.resort_id == resort_id
    ).order_by(PurchaseOrder.created_at.desc()).all()

    return pos


@router.post("/purchase-orders", response_model=PurchaseOrderResponse)
def create_manual_purchase_order(
    po_in: PurchaseOrderCreate,
    current_user: User = Depends(require_role(["MANAGER", "DEPARTMENT_HEAD"])),
    db: Session = Depends(get_db)
):
    """
    Manually create a purchase order.
    """
    resort_id = current_user.resort_id

    item = db.query(InventoryItem).filter(
        InventoryItem.id == po_in.inventory_item_id,
        InventoryItem.resort_id == resort_id
    ).first()

    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")

    po = PurchaseOrder(
        resort_id=resort_id,
        inventory_item_id=item.id,
        item_name=item.name,
        quantity=po_in.quantity,
        unit=item.unit,
        estimated_cost=po_in.quantity * item.unit_cost,
        supplier=po_in.supplier or "Standard Supplier",
        status="ORDERED",
        approved_by=current_user.name
    )
    db.add(po)
    db.commit()
    db.refresh(po)

    # Activity log
    log = ActivityLog(
        resort_id=resort_id,
        user_id=current_user.id,
        user_name=current_user.name,
        user_role=current_user.role,
        action_type="PO_CREATED",
        entity_type="purchase_order",
        entity_id=po.id,
        description=f"{current_user.name} created Purchase Order for {po.quantity} {po.unit} of {po.item_name}",
        details_json={"po_id": po.id, "quantity": po.quantity, "cost": po.estimated_cost}
    )
    db.add(log)
    db.commit()

    return po


@router.patch("/purchase-orders/{po_id}/receive")
def receive_purchase_order(
    po_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Mark a purchase order as received and restock the inventory item.
    """
    resort_id = current_user.resort_id

    po = db.query(PurchaseOrder).filter(
        PurchaseOrder.id == po_id,
        PurchaseOrder.resort_id == resort_id
    ).first()

    if not po:
        raise HTTPException(status_code=404, detail="Purchase order not found")

    if po.status == "RECEIVED":
        return {"message": "Purchase order was already received"}

    po.status = "RECEIVED"
    po.fulfilled_at = datetime.utcnow()

    # Restock inventory
    item = db.query(InventoryItem).filter(InventoryItem.id == po.inventory_item_id).first()
    if item:
        item.current_stock += po.quantity

    log = ActivityLog(
        resort_id=resort_id,
        user_id=current_user.id,
        user_name=current_user.name,
        user_role=current_user.role,
        action_type="PO_RECEIVED",
        entity_type="purchase_order",
        entity_id=po.id,
        description=f"{current_user.name} received delivery of PO #{po.id}: +{po.quantity} {po.unit} {po.item_name}",
        details_json={"po_id": po.id, "new_stock": item.current_stock if item else None}
    )
    db.add(log)
    db.commit()

    return {
        "success": True,
        "po_id": po.id,
        "status": po.status,
        "new_stock": item.current_stock if item else None,
        "message": f"Received {po.quantity} {po.unit} of {po.item_name}. Inventory updated!"
    }
