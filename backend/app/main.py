"""FastAPI 入口。"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.db import init_db
from app.routers import divine, hexagram, history, share, yarrow


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(title="六爻占卜 API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(divine.router, prefix="/api", tags=["divine"])
app.include_router(hexagram.router, prefix="/api", tags=["hexagram"])
app.include_router(share.router, prefix="/api", tags=["share"])
app.include_router(yarrow.router, prefix="/api", tags=["yarrow"])
app.include_router(history.router, prefix="/api", tags=["history"])


@app.get("/api/health")
async def health() -> dict:
    return {"status": "ok"}
