import sys
import asyncio

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from pathlib import Path
root = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(root))

from httpx import AsyncClient, ASGITransport
from backend.app.main import app

async def main():
    print("Testing /health with SelectorEventLoop...")
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get("/health")
        print("Status code:", resp.status_code)
        print("Body:", resp.json())

if __name__ == "__main__":
    asyncio.run(main())
