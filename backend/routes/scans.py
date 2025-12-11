from fastapi import APIRouter
router = APIRouter(prefix="/scans", tags=["scans"])

@router.get("/")
def scans_index():
    return {"message": "Scans route working"}

