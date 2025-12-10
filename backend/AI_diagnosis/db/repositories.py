from typing import List, Dict, Any
from supabase import Client
import logging
import httpx
logger = logging.getLogger("db.repositories_llm")
class DTCCatalogueRepo:
    def __init__(self, client: Client):
        self.client = client

    def get_by_code(self, dtc_code: str) -> dict | None:
        if not dtc_code or not isinstance(dtc_code, str):
            logger.warning("Invalid DTC code provided: %s", dtc_code)
            return None

        try:
            response = (
                self.client.table("DTC_Catalogue")
                .select("*")
                .eq("code", dtc_code.strip().upper())
                .maybe_single()
                .execute()
            )

            # Handle response object consistency
            if not hasattr(response, "data"):
                logger.error("Unexpected Supabase response: %s", response)
                return None

            data = response.data

            if not data:
                logger.info("No DTC entry found for code: %s", dtc_code)
                return None

            # Optional sanity checks
            if not isinstance(data, dict):
                logger.error("Malformed data for DTC %s: %s", dtc_code, data)
                return None

            return data

        except Exception as e:
            logger.exception("Error fetching DTC %s: %s", dtc_code, e)
            return None
        except httpx.ConnectError as e:
            logger.error("Error fetching DTC %s: %s", dtc_code, e)
            return None


class RedditEmbeddingRepo:
    def __init__(self, client: Client):
        self.client = client

    def similarity_search(self, embedding: List[float], top_k: int = 5) -> List[Dict[str, Any]]:
        resp = self.client.rpc(
            "match_reddit",
            {"query_embedding": embedding, "match_count": top_k}
        ).execute()

        return resp.data or []
    def search_keyword(self, dtc: str, top_k: int = 10) -> List[Dict[str, Any]]:
        """
        Pure keyword/structured search:
        give me rows whose metadata->>'dtc' = dtc.
        No embeddings, just the DTC tag in metadata.
        """
        resp = (
            self.client
            .table("reddit_embeddings")
            .select("id, content, metadata")
            .filter("metadata->>dtc", "eq", dtc)
            .limit(top_k)
            .execute()
        )
        return resp.data or []