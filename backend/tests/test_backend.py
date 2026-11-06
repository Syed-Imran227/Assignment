import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from backend.app.main import app
from backend.app.database import init_db
from backend.app.services.grounding import verify_quote_in_source, normalize_whitespace

@pytest.mark.asyncio
async def test_health_check():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get("/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "ok"
        assert data["service"] == "rootline-backend"

@pytest.mark.asyncio
async def test_quote_verification():
    source_text = "Tray dryer TD-204 was stopped approximately 2 hours earlier than the validated 16-hour drying cycle."
    
    # 1. Exact match
    verified, start, end = verify_quote_in_source("Tray dryer TD-204", source_text)
    assert verified is True
    assert start == 0
    assert end == 17

    # 2. Normalized whitespace match
    verified, start, end = verify_quote_in_source("stopped   approximately   2 hours", source_text)
    assert verified is True

    # 3. Fabricated / missing quote
    verified, start, end = verify_quote_in_source("Operator was absent from building 4", source_text)
    assert verified is False
    assert start is None

@pytest.mark.asyncio
async def test_investigation_lifecycle():
    await init_db()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Create investigation
        create_resp = await client.post("/api/investigations", json={"title": "Test Batch Deviation"})
        assert create_resp.status_code == 200
        inv_data = create_resp.json()
        inv_id = inv_data["id"]
        assert "rca_number" in inv_data
        assert inv_data["status"] == "draft"

        # Patch investigation
        patch_resp = await client.patch(f"/api/investigations/{inv_id}", json={
            "form_data": {
                "product_name": {"value": "Amlodipine Besylate API", "status": "pencil"},
                "batch_number": {"value": "AMB260409B", "status": "pencil"}
            }
        })
        assert patch_resp.status_code == 200

        # Fetch investigation
        get_resp = await client.get(f"/api/investigations/{inv_id}")
        assert get_resp.status_code == 200
        fetched = get_resp.json()
        assert fetched["product_name"] == "Amlodipine Besylate API"
        assert fetched["batch_number"] == "AMB260409B"

        # Save and lock revision
        save_resp = await client.post(f"/api/investigations/{inv_id}/save")
        assert save_resp.status_code == 200
        assert save_resp.json()["status"] == "locked"

        # Attempt to patch locked investigation should fail
        locked_patch = await client.patch(f"/api/investigations/{inv_id}", json={"title": "Hacked Title"})
        assert locked_patch.status_code == 400

        # Reopen creates new draft
        reopen_resp = await client.post(f"/api/investigations/{inv_id}/reopen")
        assert reopen_resp.status_code == 200
        assert reopen_resp.json()["status"] == "reopened"
        assert reopen_resp.json()["version"] == 2
