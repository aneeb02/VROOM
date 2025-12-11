import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from livekit import api
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

app = FastAPI()

# Allow your React Native app to connect (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load keys from .env
LIVEKIT_API_KEY = os.getenv("LIVEKIT_API_KEY")
LIVEKIT_API_SECRET = os.getenv("LIVEKIT_API_SECRET")

class TokenRequest(BaseModel):
    room_name: str
    participant_name: str

@app.post("/livekit/token")
async def create_token(req: TokenRequest):
    if not LIVEKIT_API_KEY or not LIVEKIT_API_SECRET:
        raise HTTPException(status_code=500, detail="Server keys not set")

    try:
        # Create a VideoGrant
        # room_join=True allows the user to enter the room
        grant = api.VideoGrant(room_join=True, room=req.room_name)
        
        # Create Access Token
        token = api.AccessToken(
            LIVEKIT_API_KEY, 
            LIVEKIT_API_SECRET, 
            grant=grant, 
            identity=req.participant_name,
            name=req.participant_name
        )
        
        jwt_token = token.to_jwt()
        
        return {
            "token": jwt_token,
            "url": os.getenv("LIVEKIT_URL") # Returns the WSS URL to the client
        }
    except Exception as e:
        print(f"Error creating token: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    # Runs on port 8001 as defined in your .env
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("SERVER_PORT", 8001)))