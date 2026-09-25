import sys
import os
import random
from datetime import datetime, timedelta
import bcrypt
from sqlalchemy.orm import Session

from app.database.connection import Base, engine, SessionLocal
from app.models import (
    Resort, Department, User, Room, Booking,
    InventoryItem, Recommendation, Task, PurchaseOrder,
    GuestRequest, ActivityLog
)
from app.services.forecast_engine import ForecastEngine
from app.services.recommendation_engine import RecommendationEngine

def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def seed_database():
    """Wipes and seeds the database with rich synthetic resort operational data."""
    print("🔄 Resetting database schema...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db: Session = SessionLocal()

    try:
        print("🏨 Creating Resort...")
        resort = Resort(
            name="Azure Haven Luxury Resort & Spa",
            total_rooms=100,
            address="742 Ocean Palm Boulevard, Coastal Bay, CA 90210"
        )
        db.add(resort)
        db.flush()

        print("🏢 Creating Departments...")
        depts = [
            Department(resort_id=resort.id, name="Housekeeping"),
            Department(resort_id=resort.id, name="Front Desk"),
            Department(resort_id=resort.id, name="Food & Beverage"),
            Department(resort_id=resort.id, name="Maintenance"),
        ]
        db.add_all(depts)
        db.flush()

        hk_dept = depts[0]
        fd_dept = depts[1]
        fb_dept = depts[2]
        maint_dept = depts[3]

        print("👥 Creating Users across all 4 roles...")
        users = [
            # 1. Manager
            User(
                resort_id=resort.id,
                department_id=None,
                name="Sarah Jenkins",
                email="manager@resort360.com",
                password_hash=get_password_hash("password123"),
                role="MANAGER",
                phone="+1 (555) 234-5678",
                avatar_url="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150"
            ),
            # 2. Front Desk Lead & Staff
            User(
                resort_id=resort.id,
                department_id=fd_dept.id,
                name="Alex Rivera",
                email="frontdesk@resort360.com",
                password_hash=get_password_hash("password123"),
                role="FRONT_DESK",
                phone="+1 (555) 345-6789",
                avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
            ),
            # 3. Department Heads
            User(
                resort_id=resort.id,
                department_id=hk_dept.id,
                name="Maria Santos",
                email="housekeeping.head@resort360.com",
                password_hash=get_password_hash("password123"),
                role="DEPARTMENT_HEAD",
                phone="+1 (555) 456-7890",
                avatar_url="https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150"
            ),
            User(
                resort_id=resort.id,
                department_id=fb_dept.id,
                name="Chef Marco Rossi",
                email="fb.head@resort360.com",
                password_hash=get_password_hash("password123"),
                role="DEPARTMENT_HEAD",
                phone="+1 (555) 567-8901",
                avatar_url="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"
            ),
            User(
                resort_id=resort.id,
                department_id=maint_dept.id,
                name="David Chen",
                email="maintenance.head@resort360.com",
                password_hash=get_password_hash("password123"),
                role="DEPARTMENT_HEAD",
                phone="+1 (555) 678-9012",
                avatar_url="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150"
            ),
            # 4. Staff members
            User(
                resort_id=resort.id,
                department_id=hk_dept.id,
                name="Elena Rostova",
                email="staff.elena@resort360.com",
                password_hash=get_password_hash("password123"),
                role="STAFF",
                phone="+1 (555) 789-0123",
                avatar_url="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150"
            ),
            User(
                resort_id=resort.id,
                department_id=hk_dept.id,
                name="Carlos Mendez",
                email="staff.carlos@resort360.com",
                password_hash=get_password_hash("password123"),
                role="STAFF",
                phone="+1 (555) 890-1234",
                avatar_url="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150"
            ),
            User(
                resort_id=resort.id,
                department_id=hk_dept.id,
                name="Amina Diallo",
                email="staff.amina@resort360.com",
                password_hash=get_password_hash("password123"),
                role="STAFF",
                phone="+1 (555) 890-1235",
                avatar_url="https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150"
            ),
            User(
                resort_id=resort.id,
                department_id=maint_dept.id,
                name="Jamal Washington",
                email="staff.jamal@resort360.com",
                password_hash=get_password_hash("password123"),
                role="STAFF",
                phone="+1 (555) 901-2345",
                avatar_url="https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150"
            ),
            User(
                resort_id=resort.id,
                department_id=fb_dept.id,
                name="Priya Sharma",
                email="staff.priya@resort360.com",
                password_hash=get_password_hash("password123"),
                role="STAFF",
                phone="+1 (555) 012-3456",
                avatar_url="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150"
            ),
        ]
        db.add_all(users)
        db.flush()

        print("🛏️ Creating 100 Resort Rooms across 4 floors...")
        room_types = [
            ("Standard Deluxe King", 2, 0.40),
            ("Ocean View Double Queen", 4, 0.35),
            ("Executive Garden Suite", 3, 0.15),
            ("Presidential Beachfront Villa", 6, 0.10),
        ]

        rooms = []
        statuses = ["clean", "clean", "dirty", "occupied", "occupied", "occupied", "inspecting"]

        for floor in range(1, 5):
            for r in range(1, 26):
                room_num = f"{floor}{r:02d}"
                rand_val = random.random()
                cumulative = 0
                selected_type = room_types[0]
                for rtype, max_g, prob in room_types:
                    cumulative += prob
                    if rand_val <= cumulative:
                        selected_type = (rtype, max_g, prob)
                        break

                # For demo realism: floor 1 and 2 has dirty & inspecting rooms ready for cleaning
                status = random.choice(statuses)
                if r <= 6:
                    status = "dirty"
                elif r == 7 or r == 8:
                    status = "inspecting"
                elif r == 9:
                    status = "maintenance"

                room = Room(
                    resort_id=resort.id,
                    room_number=room_num,
                    room_type=selected_type[0],
                    status=status,
                    floor=floor,
                    max_guests=selected_type[1]
                )
                rooms.append(room)

        db.add_all(rooms)
        db.flush()

        print("📦 Creating Inventory Items...")
        inventory = [
            InventoryItem(
                resort_id=resort.id,
                name="Fresh Farm Eggs",
                category="F&B",
                unit="cartons (30 eggs)",
                current_stock=18.0,
                reorder_threshold=50.0,
                min_stock=20.0,
                max_stock=120.0,
                unit_cost=8.50,
                consumption_rate_per_occupied_room=0.35,  # ~10 eggs / room breakfast
                lead_time_days=2
            ),
            InventoryItem(
                resort_id=resort.id,
                name="Organic Whole Milk",
                category="F&B",
                unit="liters",
                current_stock=32.0,
                reorder_threshold=60.0,
                min_stock=25.0,
                max_stock=150.0,
                unit_cost=3.20,
                consumption_rate_per_occupied_room=0.45,
                lead_time_days=1
            ),
            InventoryItem(
                resort_id=resort.id,
                name="Egyptian Cotton Linen Sets",
                category="Housekeeping",
                unit="sets",
                current_stock=42.0,
                reorder_threshold=90.0,
                min_stock=40.0,
                max_stock=200.0,
                unit_cost=45.00,
                consumption_rate_per_occupied_room=0.60,
                lead_time_days=3
            ),
            InventoryItem(
                resort_id=resort.id,
                name="Plush Bath Towel Bundles",
                category="Housekeeping",
                unit="bundles (4 towels)",
                current_stock=65.0,
                reorder_threshold=110.0,
                min_stock=50.0,
                max_stock=250.0,
                unit_cost=22.00,
                consumption_rate_per_occupied_room=0.85,
                lead_time_days=2
            ),
            InventoryItem(
                resort_id=resort.id,
                name="Luxury Spa Shampoo (300ml)",
                category="Guest Amenities",
                unit="bottles",
                current_stock=280.0,
                reorder_threshold=150.0,
                min_stock=80.0,
                max_stock=500.0,
                unit_cost=4.80,
                consumption_rate_per_occupied_room=0.70,
                lead_time_days=4
            ),
            InventoryItem(
                resort_id=resort.id,
                name="HVAC Air Filter Units",
                category="Maintenance",
                unit="filters",
                current_stock=8.0,
                reorder_threshold=15.0,
                min_stock=10.0,
                max_stock=40.0,
                unit_cost=18.50,
                consumption_rate_per_occupied_room=0.05,
                lead_time_days=2
            ),
        ]
        db.add_all(inventory)
        db.flush()

        print("📅 Creating Realistic Synthetic Bookings (~250 bookings)...")
        guest_names = [
            "Jonathan Vance", "Emily Watson", "Marcus Sterling", "Chloe Dubois",
            "Liam Gallagher", "Sophia Loren", "Vikram Patel", "Hannah Schmidt",
            "Daniel O'Connor", "Aaliyah Mansour", "Ethan Hunt", "Olivia Wilde",
            "Alexander Hamilton", "Isabella Rossellini", "Benjamin Franklin", "Charlotte Brontë",
            "Lucas Thorne", "Grace Hopper", "Sebastian Bach", "Amelia Earhart",
            "Noah Bennett", "Harper Lee", "Oliver Twist", "Mia Wallace",
            "Gabriel Garcia", "Zoe Saldana", "Mateo Silva", "Chloe Bennett"
        ]

        today = datetime.utcnow().replace(hour=14, minute=0, second=0, microsecond=0)
        bookings = []

        # 1. Historical Bookings (Past 60 days) - for ML linear regression training
        for day_offset in range(-60, 0):
            b_date = today + timedelta(days=day_offset)
            # Create weekend peaks
            is_weekend = b_date.weekday() >= 5
            day_bookings_count = random.randint(18, 25) if is_weekend else random.randint(10, 16)

            for _ in range(day_bookings_count):
                room = random.choice(rooms)
                stay_nights = random.randint(2, 5)
                check_in_dt = b_date
                check_out_dt = check_in_dt + timedelta(days=stay_nights)

                booking = Booking(
                    resort_id=resort.id,
                    room_id=room.id,
                    guest_name=random.choice(guest_names),
                    guest_email="guest@example.com",
                    guest_phone="+1 555-0199",
                    check_in=check_in_dt,
                    check_out=check_out_dt,
                    status="checked_out" if check_out_dt < today else "checked_in",
                    guests_count=random.randint(1, 4),
                    early_arrival=random.random() < 0.20,
                    revenue=stay_nights * random.choice([160, 220, 350, 600])
                )
                bookings.append(booking)

        # 2. TODAY's Active Stays & Check-ins
        for r_idx in range(65):
            room = rooms[r_idx]
            check_in_dt = today - timedelta(days=random.randint(1, 3))
            check_out_dt = today + timedelta(days=random.randint(1, 4))
            booking = Booking(
                resort_id=resort.id,
                room_id=room.id,
                guest_name=random.choice(guest_names),
                guest_email=f"guest{r_idx}@example.com",
                check_in=check_in_dt,
                check_out=check_out_dt,
                status="checked_in",
                guests_count=random.randint(1, 4),
                early_arrival=False,
                revenue=450.0
            )
            bookings.append(booking)

        # 3. TOMORROW (The Core Operational Spike Scenario)
        # 68 check-ins, 31 check-outs, 18 early arrivals -> 95% occupancy!
        tomorrow = today + timedelta(days=1)
        for r_idx in range(68):
            room = rooms[r_idx]
            check_in_dt = tomorrow
            check_out_dt = tomorrow + timedelta(days=random.randint(2, 5))
            is_early = (r_idx < 18)  # 18 early arrivals!

            booking = Booking(
                resort_id=resort.id,
                room_id=room.id,
                guest_name=random.choice(guest_names) + f" ({r_idx+1})",
                guest_email=f"arrival{r_idx+1}@example.com",
                check_in=check_in_dt,
                check_out=check_out_dt,
                status="confirmed",
                guests_count=random.randint(1, 4),
                early_arrival=is_early,
                expected_arrival_time="10:30 AM" if is_early else "03:00 PM",
                revenue=random.choice([180, 250, 420, 850])
            )
            bookings.append(booking)

        # 31 check-outs tomorrow
        for r_idx in range(31):
            room = rooms[r_idx + 10]
            check_in_dt = today - timedelta(days=2)
            check_out_dt = tomorrow
            booking = Booking(
                resort_id=resort.id,
                room_id=room.id,
                guest_name=random.choice(guest_names) + f" (Departing {r_idx+1})",
                guest_email=f"checkout{r_idx+1}@example.com",
                check_in=check_in_dt,
                check_out=check_out_dt,
                status="checked_in",
                guests_count=2,
                early_arrival=False,
                revenue=360.0
            )
            bookings.append(booking)

        # 4. Next 6 Days Future Bookings
        for day_f in range(2, 8):
            f_date = today + timedelta(days=day_f)
            count = random.randint(40, 75)
            for f_i in range(count):
                room = rooms[f_i % len(rooms)]
                booking = Booking(
                    resort_id=resort.id,
                    room_id=room.id,
                    guest_name=random.choice(guest_names),
                    guest_email=f"future{day_f}_{f_i}@example.com",
                    check_in=f_date,
                    check_out=f_date + timedelta(days=random.randint(2, 4)),
                    status="confirmed",
                    guests_count=random.randint(1, 3),
                    early_arrival=random.random() < 0.15,
                    revenue=random.choice([190, 240, 380])
                )
                bookings.append(booking)

        db.add_all(bookings)
        db.flush()

        print("🛎️ Creating Realistic Guest Requests...")
        guest_reqs = [
            GuestRequest(
                resort_id=resort.id,
                room_id=rooms[3].id,
                room_number="104",
                guest_name="Emily Watson",
                request_type="Housekeeping/Towels",
                description="Requested 3 extra pool towels and plush bathrobes for children.",
                priority="MEDIUM",
                status="IN_PROGRESS",
                assigned_to="Elena Rostova"
            ),
            GuestRequest(
                resort_id=resort.id,
                room_id=rooms[8].id,
                room_number="109",
                guest_name="Marcus Sterling",
                request_type="AC/Maintenance",
                description="Air conditioning unit is blowing lukewarm air. Room temperature is 78°F.",
                priority="HIGH",
                status="PENDING",
                assigned_to="Jamal Washington"
            ),
            GuestRequest(
                resort_id=resort.id,
                room_id=rooms[26].id,
                room_number="202",
                guest_name="Chloe Dubois",
                request_type="F&B/Room Service",
                description="Breakfast hamper delivery requested for 7:30 AM tomorrow with almond milk.",
                priority="LOW",
                status="PENDING"
            ),
        ]
        db.add_all(guest_reqs)
        db.flush()

        print("📋 Creating Initial Department Tasks...")
        tasks = [
            Task(
                resort_id=resort.id,
                department_id=maint_dept.id,
                assigned_to=users[8].id,  # Jamal
                title="Inspect HVAC Unit Room 109",
                description="Guest reported weak cooling. Check compressor and refrigerant pressure.",
                priority="HIGH",
                status="IN_PROGRESS",
                room_number="109",
                due_date=datetime.utcnow() + timedelta(hours=2)
            ),
            Task(
                resort_id=resort.id,
                department_id=hk_dept.id,
                assigned_to=users[5].id,  # Elena
                title="Deliver Extra Linens & Towels to Room 104",
                description="Pool towels and bathrobes delivery.",
                priority="MEDIUM",
                status="IN_PROGRESS",
                room_number="104",
                due_date=datetime.utcnow() + timedelta(hours=1)
            ),
            Task(
                resort_id=resort.id,
                department_id=hk_dept.id,
                assigned_to=users[6].id,  # Carlos
                title="Deep Clean & Sanitize Villa 401",
                description="VIP Arrival scheduled for tomorrow 11:00 AM.",
                priority="HIGH",
                status="PENDING",
                room_number="401",
                due_date=datetime.utcnow() + timedelta(hours=6)
            ),
        ]
        db.add_all(tasks)
        db.flush()

        print("🤖 Running AI Recommendation Engine to generate initial explainable recommendations...")
        rec_engine = RecommendationEngine(db, resort.id)
        rec_engine.generate_and_sync_recommendations()

        print("📜 Creating Initial Activity Logs...")
        logs = [
            ActivityLog(
                resort_id=resort.id,
                user_id=users[0].id,
                user_name="Sarah Jenkins",
                user_role="MANAGER",
                action_type="SYSTEM_INITIALIZED",
                entity_type="system",
                description="Smart Resort 360 initialized Azure Haven operations database.",
                created_at=datetime.utcnow() - timedelta(hours=4)
            ),
            ActivityLog(
                resort_id=resort.id,
                user_name="AI Predictive Engine",
                user_role="SYSTEM",
                action_type="RISK_DETECTED",
                entity_type="recommendation",
                description="AI detected tomorrow's 95% occupancy surge (68 check-ins, 31 check-outs, 18 early arrivals). Generated housekeeping staffing recommendation.",
                created_at=datetime.utcnow() - timedelta(hours=2)
            ),
            ActivityLog(
                resort_id=resort.id,
                user_name="AI Predictive Engine",
                user_role="SYSTEM",
                action_type="STOCKOUT_RISK_DETECTED",
                entity_type="inventory",
                description="AI detected F&B stockout risk for Fresh Farm Eggs and Egyptian Cotton Linen Sets based on projected 7-day occupancy.",
                created_at=datetime.utcnow() - timedelta(hours=1)
            ),
        ]
        db.add_all(logs)
        db.commit()

        print("✅ Database seeding complete! Summary:")
        print(f"   • Resort: {resort.name}")
        print(f"   • Rooms: {len(rooms)}")
        print(f"   • Users: {len(users)}")
        print(f"   • Bookings: {len(bookings)}")
        print(f"   • Inventory Items: {len(inventory)}")
        print("   • Default Credentials:")
        print("     - Manager: manager@resort360.com / password123")
        print("     - Front Desk: frontdesk@resort360.com / password123")
        print("     - Housekeeping Lead: housekeeping.head@resort360.com / password123")
        print("     - Staff: staff.elena@resort360.com / password123")

    except Exception as e:
        db.rollback()
        print(f"❌ Error seeding database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
