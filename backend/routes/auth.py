from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from utils.auth import signup_user, login_user,update_user, delete_user,get_user_by_id
from utils.db import supabase
router = APIRouter(prefix="/auth", tags=["auth"])

class AuthSignupRequest(BaseModel):
    email: EmailStr
    password: str
    name:str

class AuthLoginRequest(BaseModel):
    email: EmailStr
    password: str

class AuthUpdateRequest(BaseModel):
    name: str | None = None
    email: EmailStr | None = None


@router.post("/signup")
def signup(request: AuthSignupRequest):
    result = signup_user(request.email, request.password,request.name)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["error"])
    return {"message": "Signup successful", "user": result["user"]}

@router.post("/login")
def login(request: AuthLoginRequest):
    result = login_user(request.email, request.password)
    if not result["success"]:
        raise HTTPException(status_code=401, detail=result["error"])
    return {"message": "Login successful", "session": result["session"]}




@router.put("/update/{user_id}")
def update(user_id: str, request: AuthUpdateRequest):
    result = update_user(user_id, request.name, request.email)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


@router.delete("/delete/{user_id}")
def delete(user_id: str):
    result = delete_user(user_id)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["error"])
    return result

@router.get("/user/{user_id}")
def get_user(user_id: str):
    result = get_user_by_id(user_id)
    if not result["success"]:
        raise HTTPException(status_code=404, detail=result["error"])
    return result["user"]



