from fastapi import FastAPI

from routes import auth, vehicles, scans, livekit_auth
from dotenv import load_dotenv
load_dotenv()


from AI_diagnosis.api.router import router as ai_diagnosis_router


app = FastAPI(title="VROOM Backend API")

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return 10


app.include_router(auth.router)
app.include_router(vehicles.router)
app.include_router(scans.router)
app.include_router(ai_diagnosis_router)
app.include_router(livekit_auth.router)
