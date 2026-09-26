import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models import InventoryItem, Booking

class InventoryEngine:
    """
    Light ML-based inventory forecasting engine.
    Predicts stockout risks based on occupancy forecast and consumption patterns.
    """

    def __init__(self, db: Session, resort_id: int):
        self.db = db
        self.resort_id = resort_id

    def calculate_projected_consumption(
        self,
        item: InventoryItem,
        forecast_occupancy: List[Dict[str, Any]],
        days: int = 7
    ) -> Dict[str, Any]:
        """
        Calculate projected consumption and stockout risk for an inventory item.

        Args:
            item: InventoryItem model instance
            forecast_occupancy: List of daily occupancy forecasts
            days: Number of days to forecast (default 7)

        Returns:
            Dict with projected consumption, days until stockout, risk level, and recommendation
        """
        # Calculate total expected occupied room-nights over forecast period
        total_occupied_room_nights = sum(
            day["occupied_rooms"] for day in forecast_occupancy[:days]
        )

        # Projected consumption = room-nights × consumption rate per room
        projected_consumption = total_occupied_room_nights * item.consumption_rate_per_occupied_room

        # Current stock vs projected consumption
        current_stock = item.current_stock
        net_position = current_stock - projected_consumption

        # Days until stockout (if consumption rate > 0)
        if item.consumption_rate_per_occupied_room > 0 and len(forecast_occupancy) > 0:
            avg_daily_occupied_rooms = total_occupied_room_nights / days
            daily_consumption = avg_daily_occupied_rooms * item.consumption_rate_per_occupied_room

            if daily_consumption > 0:
                days_until_stockout = current_stock / daily_consumption
            else:
                days_until_stockout = 999  # Effectively infinite
        else:
            days_until_stockout = 999

        # Determine risk level
        if days_until_stockout < item.lead_time_days:
            risk_level = "CRITICAL"
            priority = "HIGH"
        elif days_until_stockout < (item.lead_time_days + 2):
            risk_level = "HIGH"
            priority = "HIGH"
        elif current_stock < item.reorder_threshold:
            risk_level = "MEDIUM"
            priority = "MEDIUM"
        elif current_stock < item.min_stock:
            risk_level = "MEDIUM"
            priority = "MEDIUM"
        else:
            risk_level = "LOW"
            priority = "LOW"

        # Calculate reorder quantity if needed
        reorder_quantity = 0
        if risk_level in ["CRITICAL", "HIGH", "MEDIUM"]:
            # Reorder = (lead time demand + safety stock) - current stock
            lead_time_demand = daily_consumption * item.lead_time_days
            safety_stock = item.min_stock
            ideal_stock = lead_time_demand + safety_stock
            reorder_quantity = max(0, ideal_stock - current_stock)

            # Round to reasonable quantities
            if reorder_quantity > 0:
                reorder_quantity = np.ceil(reorder_quantity)

        return {
            "item_id": item.id,
            "item_name": item.name,
            "category": item.category,
            "unit": item.unit,
            "current_stock": current_stock,
            "projected_consumption_7d": round(projected_consumption, 2),
            "net_position": round(net_position, 2),
            "days_until_stockout": round(days_until_stockout, 2),
            "risk_level": risk_level,
            "priority": priority,
            "reorder_threshold": item.reorder_threshold,
            "min_stock": item.min_stock,
            "lead_time_days": item.lead_time_days,
            "reorder_quantity": round(reorder_quantity, 2) if reorder_quantity > 0 else 0,
            "unit_cost": item.unit_cost,
            "estimated_cost": round(reorder_quantity * item.unit_cost, 2) if reorder_quantity > 0 else 0
        }

    def analyze_all_inventory(self, forecast_occupancy: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Analyze stockout risk for all inventory items.

        Returns:
            List of inventory items with risk analysis, sorted by risk level
        """
        items = self.db.query(InventoryItem).filter(
            InventoryItem.resort_id == self.resort_id
        ).all()

        results = []
        for item in items:
            analysis = self.calculate_projected_consumption(item, forecast_occupancy)
            results.append(analysis)

        # Sort by risk level (CRITICAL > HIGH > MEDIUM > LOW) then by days until stockout
        risk_order = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3}
        results.sort(key=lambda x: (risk_order.get(x["risk_level"], 4), x["days_until_stockout"]))

        return results

    def get_stockout_items(self, forecast_occupancy: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Get only items at risk of stockout (CRITICAL, HIGH, MEDIUM).
        Used for generating recommendations.
        """
        all_items = self.analyze_all_inventory(forecast_occupancy)
        return [item for item in all_items if item["risk_level"] in ["CRITICAL", "HIGH", "MEDIUM"]]

    def generate_reorder_recommendation(
        self,
        item_analysis: Dict[str, Any],
        target_date: str = None
    ) -> Dict[str, Any]:
        """
        Generate a structured recommendation for reordering an inventory item.

        Args:
            item_analysis: Result from calculate_projected_consumption
            target_date: Target delivery date (optional)

        Returns:
            Recommendation dict ready for database insertion
        """
        if target_date is None:
            target_date = (datetime.utcnow() + timedelta(days=1)).strftime("%Y-%m-%d")

        # Build explanation
        explanation = (
            f"Current stock: {item_analysis['current_stock']} {item_analysis['unit']}\n"
            f"Projected 7-day consumption: {item_analysis['projected_consumption_7d']} {item_analysis['unit']}\n"
            f"Days until stockout: {item_analysis['days_until_stockout']:.1f} days\n"
            f"Lead time: {item_analysis['lead_time_days']} days\n\n"
            f"Risk level: {item_analysis['risk_level']}"
        )

        if item_analysis['days_until_stockout'] < item_analysis['lead_time_days']:
            explanation += f"\n\n⚠️ Stockout will occur before new stock can arrive."

        # Build expected impact
        if item_analysis['risk_level'] == "CRITICAL":
            expected_impact = "Prevents immediate stockout and guest service disruption."
        elif item_analysis['risk_level'] == "HIGH":
            expected_impact = "Prevents near-term stockout within lead time window."
        else:
            expected_impact = "Maintains optimal inventory levels and prevents future shortages."

        return {
            "type": "inventory",
            "priority": item_analysis['priority'],
            "title": f"Reorder {item_analysis['item_name']} - {item_analysis['risk_level']} Risk",
            "recommended_action": f"Order {item_analysis['reorder_quantity']} {item_analysis['unit']} of {item_analysis['item_name']}",
            "explanation": explanation,
            "expected_impact": expected_impact,
            "metrics_data": {
                "item_id": item_analysis['item_id'],
                "item_name": item_analysis['item_name'],
                "category": item_analysis['category'],
                "reorder_quantity": item_analysis['reorder_quantity'],
                "unit": item_analysis['unit'],
                "unit_cost": item_analysis['unit_cost'],
                "estimated_cost": item_analysis['estimated_cost'],
                "current_stock": item_analysis['current_stock'],
                "risk_level": item_analysis['risk_level'],
                "days_until_stockout": item_analysis['days_until_stockout']
            },
            "target_date": target_date,
            "status": "PENDING"
        }
