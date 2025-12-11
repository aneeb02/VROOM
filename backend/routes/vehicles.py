from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from utils.db import supabase
import uuid

router = APIRouter(prefix="/vehicles", tags=["vehicles"])




class VehicleCreateRequest(BaseModel):
    user_id: str
    make: str
    model: str
    variant: str | None = None
    year: int
    vin: str | None = None
    is_primary: bool | None = False


class VehicleUpdateRequest(BaseModel):
    make: str | None = None
    model: str | None = None
    variant: str | None = None
    year: int | None = None
    vin: str | None = None
    is_primary: bool | None = None




@router.post("/")
def create_vehicle(request: VehicleCreateRequest):
    try:
        new_vehicle = {
            "id": str(uuid.uuid4()),
            "user_id": request.user_id,
            "make": request.make,
            "model": request.model,
            "variant": getattr(request, "variant", None),
            "year": request.year,
            "vin": request.vin,
            "is_primary": getattr(request, "is_primary", None),
        }

        response = supabase.table("vehicles").insert(new_vehicle).execute()

       
        if not response.data:
            raise Exception("Vehicle insert failed (no data returned).")

        return {"success": True, "vehicle": response.data[0]}

    except Exception as e:
        print(" Create vehicle error:", e)
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/")
def get_vehicles(
    user_id: str = Query(..., description="User ID to fetch vehicles for"),
    limit: int = Query(50, ge=1),
    offset: int = Query(0, ge=0),
):
    try:
        response = (
            supabase.table("vehicles")
            .select("*")
            .eq("user_id", user_id)
            .range(offset, offset + limit - 1)
            .execute()
        )

        # check if data exists
        if not response.data:
            return {"success": True, "vehicles": []}

        return {"success": True, "vehicles": response.data}

    except Exception as e:
        print(" Get vehicles error:", e)
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{vehicle_id}")
def get_vehicle(vehicle_id: str):
    try:
        response = (
            supabase.table("vehicles")
            .select("*")
            .eq("id", vehicle_id)
            .execute()
        )

        if not response.data:
            raise HTTPException(status_code=404, detail="Vehicle not found")

        return {"success": True, "vehicle": response.data[0]}

    except Exception as e:
        print(" Get vehicle error:", e)
        raise HTTPException(status_code=400, detail=str(e))



@router.put("/{vehicle_id}")
def update_vehicle(vehicle_id: str, request: VehicleUpdateRequest):
    try:
        update_data = request.model_dump(exclude_none=True)
        if not update_data:
            raise HTTPException(status_code=400, detail="No fields to update")

        response = (
            supabase.table("vehicles")
            .update(update_data)
            .eq("id", vehicle_id)
            .execute()
        )

        if not response.data:
            raise HTTPException(status_code=404, detail="Vehicle not found or not updated")

        return {"success": True, "vehicle": response.data[0]}

    except Exception as e:
        print("Update vehicle error:", e)
        raise HTTPException(status_code=400, detail=str(e))



@router.delete("/{vehicle_id}")
def delete_vehicle(vehicle_id: str):
    try:
        response = (
            supabase.table("vehicles")
            .delete()
            .eq("id", vehicle_id)
            .execute()
        )

        if not response.data:
            raise HTTPException(status_code=404, detail="Vehicle not found")

        return {"success": True, "message": "Vehicle deleted successfully"}

    except Exception as e:
        print(" Delete vehicle error:", e)
        raise HTTPException(status_code=400, detail=str(e))