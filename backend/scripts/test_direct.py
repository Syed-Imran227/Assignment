import sys
from pathlib import Path
root = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(root))

print("1. Importing app...")
from backend.app.main import app
print("2. App imported successfully!")

from starlette.testclient import TestClient
print("3. Creating TestClient...")
with TestClient(app) as client:
    print("4. Sending GET /health...")
    resp = client.get("/health")
    print("5. Response:", resp.status_code, resp.json())
