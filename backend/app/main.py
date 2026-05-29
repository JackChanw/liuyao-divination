"""FastAPI 入口。"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import divine, hexagram

app = FastAPI(title="六爻占卜 API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(divine.router, prefix="/api", tags=["divine"])
app.include_router(hexagram.router, prefix="/api", tags=["hexagram"])


@app.get("/api/health")
async def health() -> dict:
    return {"status": "ok"}
