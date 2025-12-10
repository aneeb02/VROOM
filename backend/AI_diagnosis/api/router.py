from fastapi import APIRouter, Depends, HTTPException,status
from sqlalchemy.ext.asyncio import AsyncSession
from AI_diagnosis.models.request_response import DiagnoseRequest, DiagnoseResponse, LLMResponse
from AI_diagnosis.services.diagnosis_service import DiagnosisService
from AI_diagnosis.db.db_engine import get_supabase
from supabase import Client
import logging

router = APIRouter(prefix="/AI_diagnosis", tags=["diagnosis"])
logger = logging.getLogger("api.diagnosis")


async def get_session() -> Client:
   
    try:
        return await get_supabase()
    except Exception as e:
        logger.exception("Failed to connect to Supabase: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection failed."
        )



@router.post("/dtc_diagnose", response_model=DiagnoseResponse)
async def diagnose(req: DiagnoseRequest, client: Client = Depends(get_session)):

    try:
        svc = DiagnosisService(client)
        result = await svc.run(req.dtc, req.vehicle.model_dump(), req.vehicle.pid_snapshot)
        sources = result.get("sources", [])
        llm_resp = result.get("llm")

        # If the LLM failed to respond or returned invalid JSON
        if not llm_resp:
            logger.warning("LLM returned no valid response for DTC %s", req.dtc)
            fallback = LLMResponse(
                dtc_code=req.dtc,
                dtc_meaning="N/A",
                summary="The AI model did not return a structured diagnosis.",
                severity="LOW",
                causes=["Incomplete context or model timeout."],
                effects=["Unable to analyze current vehicle data."],
                quick_fixes=["Try again later or verify DTC code and PID snapshot."],
                safety_advice="If the warning light stays on or the car behaves abnormally, have it inspected by a qualified technician."
            )
            return DiagnoseResponse(vehicle=req.vehicle, results=[fallback])

        # Successful response
        return DiagnoseResponse(vehicle=req.vehicle, results=[llm_resp],reddit_sources=sources)

    except HTTPException:
        # Already a handled FastAPI error
        raise
    except Exception as e:
        logger.exception("Unexpected error in /AI_diagnosis/dtc_diagnose: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred during diagnosis."
        )
