import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from livekit import api
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/livekit", tags=["livekit"])

LIVEKIT_API_KEY = os.getenv("LIVEKIT_API_KEY")
LIVEKIT_API_SECRET = os.getenv("LIVEKIT_API_SECRET")
LIVEKIT_URL = os.getenv("LIVEKIT_URL")

class TokenRequest(BaseModel):
    room_name: str
    participant_name: str

@router.post("/token")
async def get_token(req: TokenRequest):
    if not LIVEKIT_API_KEY or not LIVEKIT_API_SECRET:
        raise HTTPException(status_code=500, detail="LiveKit credentials not configured")

    try:
        token = api.AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET) \
            .with_identity(req.participant_name) \
            .with_name(req.participant_name) \
            .with_grants(api.VideoGrants(
                room_join=True,
                room=req.room_name,
            ))
        
        jwt_token = token.to_jwt()
        
        return {
            "token": jwt_token,
            "url": LIVEKIT_URL
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
