from AI_diagnosis.db.repositories import DTCCatalogueRepo
from AI_diagnosis.services.rag_service import RAGService
from AI_diagnosis.services.llm_service import call_groq

class DiagnosisService:
    def __init__(self, session):
        self.cat = DTCCatalogueRepo(session)
        self.rag = RAGService(session)

    async def run(self, dtc: str, vehicle: dict, pid: dict) -> dict:
        row = self.cat.get_by_code(dtc)
        if row:
            query_text = f"DTC {row['code']}: {row['description']}"
            catalogue_data = {
                **row,
                "has_catalogue": True,   # 👈 flag
            }
        else:
            # no entry found, only use this for context to the LLM
            query_text = dtc
            catalogue_data = {
                "code": dtc,
                "description": f"DTC {dtc} (no catalogue entry)",
                "probable_causes": "Unknown",
                "solutions": "Refer to retrieved discussions",
                "symptoms": "Not provided",
                "has_catalogue": False,  # 👈 flag
            }

        reddit_text, sources = self.rag.retrieve(dtc, query_text, top_k=5)

        llm_resp = await call_groq(catalogue_data, reddit_text, vehicle, pid)
        return {
            "llm": llm_resp,
            "sources": sources,
        }