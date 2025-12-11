from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.embeddings import SentenceTransformerEmbeddings
_model = None

def get_embedder():
    global _model
    if _model is None:
        _model = SentenceTransformerEmbeddings(model_name="all-MiniLM-L6-v2")
    return _model

def embed_text(text: str) -> list[float]:
    return get_embedder().embed_query(text)