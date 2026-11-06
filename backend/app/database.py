from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from backend.app.config import DATABASE_URL

# Handle sqlite relative path and postgres scheme normalization
async_db_url = DATABASE_URL
sync_db_url = DATABASE_URL

if "sqlite" in DATABASE_URL:
    if not DATABASE_URL.startswith("sqlite+aiosqlite:///"):
        async_db_url = DATABASE_URL.replace("sqlite:///", "sqlite+aiosqlite:///")
    sync_db_url = async_db_url.replace("sqlite+aiosqlite:///", "sqlite:///")
elif "postgresql" in DATABASE_URL:
    if not DATABASE_URL.startswith("postgresql+asyncpg://"):
        async_db_url = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")
    sync_db_url = async_db_url.replace("postgresql+asyncpg://", "postgresql://")

# Async engine for FastAPI endpoints
async_engine = create_async_engine(
    async_db_url,
    echo=False,
    future=True,
    connect_args={"check_same_thread": False} if "sqlite" in async_db_url else {}
)

AsyncSessionLocal = async_sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False
)

class Base(DeclarativeBase):
    pass

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

def init_db():
    """Synchronous, rock-solid schema creation that registers all models."""
    from backend.app import models  # noqa: F401
    sync_engine = create_engine(
        sync_db_url,
        echo=False,
        future=True,
        connect_args={"check_same_thread": False} if "sqlite" in sync_db_url else {}
    )
    Base.metadata.create_all(bind=sync_engine)
    sync_engine.dispose()
