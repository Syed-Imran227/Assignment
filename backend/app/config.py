import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file from project root
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(ROOT_DIR / ".env")

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
REASONING_MODEL = os.getenv("REASONING_MODEL", "llama-3.3-70b-versatile")
FAST_MODEL = os.getenv("FAST_MODEL", "llama-3.1-8b-instant")
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./rootline.db")
BACKEND_PORT = int(os.getenv("BACKEND_PORT", "8000"))
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

