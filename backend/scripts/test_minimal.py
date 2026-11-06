from fastapi import FastAPI
from starlette.testclient import TestClient

print("Creating dummy app...")
dummy = FastAPI()
@dummy.get("/ping")
def ping():
    return {"pong": True}

print("Creating TestClient for dummy...")
client = TestClient(dummy)
print("Requesting /ping...")
r = client.get("/ping")
print("Result:", r.status_code, r.json())
