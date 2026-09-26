from fastapi import HTTPException

ROOM_STATUSES = {
    "clean",
    "occupied",
    "dirty",
    "cleaning",
    "inspecting",
    "maintenance",
    "repair",
    "out_of_service",
}

ROOM_TRANSITIONS = {
    "clean": {"occupied", "dirty", "maintenance", "out_of_service"},
    "occupied": {"dirty", "maintenance", "out_of_service"},
    "dirty": {"cleaning", "maintenance", "out_of_service"},
    "cleaning": {"inspecting", "maintenance"},
    "inspecting": {"clean", "dirty", "maintenance"},
    "maintenance": {"repair", "dirty", "out_of_service"},
    "repair": {"inspecting", "maintenance"},
    "out_of_service": {"dirty", "maintenance"},
}


def transition_room_status(room, new_status: str):
    new_status = new_status.lower()
    if new_status not in ROOM_STATUSES:
        raise HTTPException(status_code=400, detail=f"Unsupported room status: {new_status}")

    current_status = room.status or "clean"
    if new_status not in ROOM_TRANSITIONS.get(current_status, set()):
        raise HTTPException(
            status_code=409,
            detail=f"Invalid room transition: {current_status} -> {new_status}",
        )

    room.status = new_status
    return room