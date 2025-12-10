from pydantic import BaseModel, Field
from typing import List, Dict, Optional
from typing import Literal

class VehicleMeta(BaseModel):
    make: str
    model: str
    year: Optional[int] = None
    pid_snapshot: Dict[str, float] = Field(default_factory=dict)

class DiagnoseRequest(BaseModel):
    dtc: str = Field(pattern=r"^[PCBU]\d{3}[0-9A-Z]$")
    vehicle: VehicleMeta

# ----------  RESPONSE  --------------------
class LLMResponse(BaseModel):
    dtc_code: str
    dtc_meaning: str
    summary: str
    severity: Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"] = Field(..., description="Severity of issue.")
    causes: List[str] = Field(default_factory=list, description="3–6 probable root causes, ordered by likelihood.")
    effects: List[str] = Field(default_factory=list, description="Driver-noticeable symptoms or system effects.")
    quick_fixes: List[str] = Field(default_factory=list, description="Low-risk actions user can try before a shop visit.")
    safety_advice: str = Field(..., description="Short statement on drivability and urgency.")
class RedditSource(BaseModel):
    url: str
    title: Optional[str] = None
    subreddit: Optional[str] = None
class DiagnoseResponse(BaseModel):
    vehicle: VehicleMeta
    results: List[LLMResponse]
    reddit_sources: List[RedditSource] = Field(default_factory=list)