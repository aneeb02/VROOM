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
class QuickFix(BaseModel):
    step: str = Field(description="The action the user should take.")
    location_tip: str = Field(description="Guidance on where the user can find the part/component mentioned in the step.")
class LLMResponse(BaseModel):
    dtc_code: str
    dtc_meaning: str
    summary: str
    severity: Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"] = Field(..., description="Severity of issue.")
    causes: List[str] = Field(default_factory=list, description="3–6 probable root causes, ordered by likelihood.")
    effects: List[str] = Field(default_factory=list, description="Driver-noticeable symptoms or system effects.")
    quick_fixes: List[QuickFix] = Field(default_factory=list, description="Low-risk actions user can try before a shop visit, including location tips.")
    safety_advice: str = Field(
        default="No safety advice provided",
        description="Short statement on drivability and urgency.")
    technical_terms: Dict[str, str] = Field(default_factory=dict, description="Explanations for technical terms used in the summary, causes, and advice.")
    
class RedditSource(BaseModel):
    url: str
    title: Optional[str] = None
    subreddit: Optional[str] = None
class CatalogueDiscussionLink(BaseModel):
    url: str
    title: Optional[str] = None
class DiagnoseResponse(BaseModel):
    vehicle: VehicleMeta
    results: List[LLMResponse]
    reddit_sources: List[RedditSource] = Field(default_factory=list)
    dtc_catalogue_links: List[CatalogueDiscussionLink] = Field(
        default_factory=list,
        description="Links extracted from the DTC catalogue discussion column (e.g. obd-codes forum threads).",
    )