from fastapi import FastAPI
from AI_diagnosis.api.router import router as ai_router
from dotenv import load_dotenv
import os
from fastapi.middleware.cors import CORSMiddleware
load_dotenv()


app = FastAPI(title="DTC Diagnosis POC")
origins = [
    "*",  # for dev it's fine; later you can restrict to ["https://snack.expo.dev", "http://localhost:19006", ...]
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],   # <-- allows OPTIONS, POST, etc.
    allow_headers=["*"],
)
app.include_router(ai_router)

