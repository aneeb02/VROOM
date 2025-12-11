from utils.db import supabase
from passlib.context import CryptContext
import uuid
from datetime import datetime

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def signup_user(email: str, password: str, name: str):
    try:
        
        existing = supabase.table("user").select("*").eq("email", email).execute()
        if existing.data:
            return {"success": False, "error": "User already exists"}

        hashed_password = pwd_context.hash(password)
        new_user = {
            "id": str(uuid.uuid4()),  # generate UUID manually to avoid NOT NULL issue
            "name": name,
            "email": email,
            "password_hash": hashed_password,
            "created_at": datetime.utcnow().isoformat()
        }

        supabase.table("user").insert(new_user).execute()
        return {"success": True, "user": new_user}

    except Exception as e:
        print(" Signup error:", e)
        return {"success": False, "error": str(e)}



def login_user(email: str, password: str):
    try:
        user = supabase.table("user").select("*").eq("email", email).execute()
        if not user.data:
            return {"success": False, "error": "Invalid email or password"}

        user = user.data[0]
        if not pwd_context.verify(password, user["password_hash"]):
            return {"success": False, "error": "Invalid email or password"}

   
        session = {
            "token": str(uuid.uuid4()),
            "user_id": user["id"]
        }

        return {"success": True, "session": session}
    except Exception as e:
        print(" Login error:", e)
        return {"success": False, "error": str(e)}



def update_user(user_id: str, name: str = None, email: str = None):
    try:
        update_data = {}
        if name:
            update_data["name"] = name
        if email:
            update_data["email"] = email
        if not update_data:
            return {"success": False, "error": "No fields to update"}

        supabase.table("user").update(update_data).eq("id", user_id).execute()
        return {"success": True, "message": "User updated successfully"}
    except Exception as e:
        print(" Update error:", e)
        return {"success": False, "error": str(e)}


def delete_user(user_id: str):
    try:
        supabase.table("user").delete().eq("id", user_id).execute()
        return {"success": True, "message": "User deleted successfully"}
    except Exception as e:
        print(" Delete error:", e)
        return {"success": False, "error": str(e)}
    
def get_user_by_id(user_id: str):
    try:
        response = supabase.table("user").select("*").eq("id", user_id).execute()
        if not response.data:
            return {"success": False, "error": "User not found"}
        return {"success": True, "user": response.data[0]}
    except Exception as e:
        print(" Get user by ID error:", e)
        return {"success": False, "error": str(e)}