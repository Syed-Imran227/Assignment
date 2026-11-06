from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.config import REASONING_MODEL, FAST_MODEL, ENVIRONMENT
from backend.app.database import init_db

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables on startup
    init_db()
    yield

app = FastAPI(
    title="Rootline RCA API",
    description="AI-Powered Root Cause Analysis Module for Active Pharmaceutical Ingredient (API) Manufacturing",
    version="1.0.0",
    lifespan=lifespan
)

# CORS setup for Vite frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "rootline-backend",
        "environment": ENVIRONMENT,
        "models": {
            "reasoning": REASONING_MODEL,
            "fast": FAST_MODEL
        }
    }

# Register routers (will be mounted as implemented)
from backend.app.routers import investigations, copilot, sources, evidence, capa, audit, samples
app.include_router(investigations.router, prefix="/api", tags=["Investigations"])
app.include_router(copilot.router, prefix="/api", tags=["Co-Pilot & LangGraph"])
app.include_router(sources.router, prefix="/api", tags=["Sources"])
app.include_router(evidence.router, prefix="/api", tags=["Evidence & Hypotheses"])
app.include_router(capa.router, prefix="/api", tags=["CAPA"])
app.include_router(audit.router, prefix="/api", tags=["Audit Log"])
app.include_router(samples.router, prefix="/api", tags=["Samples"])
