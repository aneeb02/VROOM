from AI_diagnosis.utils.embedder import embed_text
from AI_diagnosis.db.repositories import RedditEmbeddingRepo
import re
from typing import List, Dict, Any, Tuple
class RAGService:
    def __init__(self, session):
        self.repo = RedditEmbeddingRepo(session)



    def retrieve(self, dtc: str, query: str, top_k: int = 15) -> Tuple[str, List[Dict[str, Any]]]:
        """
        HYBRID STRATEGY:
        1) First, get posts whose metadata.dtc == dtc (keyword / structured).
        2) If fewer than top_k, call semantic similarity_search to fill the rest.
        3) Remove duplicates by id.
        4) Build:
           - context_text (joined 'content' for LLM)
           - sources [{url, subreddit, title}, ...] for the response.
        """
        # ---------- 1) Keyword / metadata search by DTC ----------
        keyword_rows = self.repo.search_keyword(dtc, top_k=top_k)

        rows_by_id = {}
        for row in keyword_rows:
            row_id = row.get("id")
            if row_id is not None:
                rows_by_id[row_id] = row
            else:
                # no id? just append using a synthetic key
                rows_by_id[f"kw_{len(rows_by_id)}"] = row

        # ---------- 2) Semantic search if we still need more ----------
        if len(rows_by_id) < top_k:
            embedding = embed_text(query)
            # over-fetch so we can dedupe
            semantic_rows = self.repo.similarity_search(embedding, top_k=top_k * 3)

            for row in semantic_rows:
                row_id = row.get("id")
                key = row_id if row_id is not None else f"sem_{len(rows_by_id)}"
                if key in rows_by_id:
                    continue  # skip duplicates
                rows_by_id[key] = row
                if len(rows_by_id) >= top_k:
                    break

        # Final ordered list (keyword results first, then semantic)
        final_rows: List[Dict[str, Any]] = list(rows_by_id.values())[:top_k]

        # ---------- 3) Build LLM context + sources ----------
        snippets: List[str] = []
        sources: List[Dict[str, Any]] = []

        for row in final_rows:
            content = row.get("content", "") or ""
            snippets.append(content)

            meta = row.get("metadata") or {}
            url = meta.get("url") or meta.get("source_url")
            subreddit = meta.get("subreddit")
            title = meta.get("title")

            if url:
                sources.append(
                    {
                        "url": url,
                        "subreddit": subreddit,
                        "title": title,
                    }
                )

        context_text = "\n".join(snippets)
        return context_text, sources
       

