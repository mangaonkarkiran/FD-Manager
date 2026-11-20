from app.auth import get_current_uid


def test_private_endpoint_requires_firebase_bearer_token(client):
    client.app.dependency_overrides.pop(get_current_uid)

    response = client.get("/api/v1/deposits")

    assert response.status_code == 401
    assert response.headers["www-authenticate"] == "Bearer"


def test_create_and_list_deposits(client, deposit_payload):
    created = client.post("/api/v1/deposits", json=deposit_payload)

    assert created.status_code == 201
    assert created.json()["institution"] == "Example Bank"
    assert created.json()["autoRenew"] is False

    listed = client.get("/api/v1/deposits")
    assert listed.status_code == 200
    assert len(listed.json()) == 1
    assert listed.json()[0]["id"] == created.json()["id"]


def test_auto_renew_preference_is_persisted(client, deposit_payload):
    payload = {**deposit_payload, "autoRenew": True}

    created = client.post("/api/v1/deposits", json=payload)

    assert created.status_code == 201
    assert created.json()["autoRenew"] is True
    assert client.get("/api/v1/deposits").json()[0]["autoRenew"] is True


def test_get_update_and_delete_deposit(client, deposit_payload):
    created = client.post("/api/v1/deposits", json=deposit_payload).json()
    deposit_id = created["id"]

    fetched = client.get(f"/api/v1/deposits/{deposit_id}")
    assert fetched.status_code == 200

    updated_payload = {**deposit_payload, "institution": "Updated Bank"}
    updated = client.put(
        f"/api/v1/deposits/{deposit_id}",
        json=updated_payload,
    )
    assert updated.status_code == 200
    assert updated.json()["institution"] == "Updated Bank"

    deleted = client.delete(f"/api/v1/deposits/{deposit_id}")
    assert deleted.status_code == 204
    assert client.get(f"/api/v1/deposits/{deposit_id}").status_code == 404


def test_deposit_records_are_isolated_by_firebase_uid(client, deposit_payload):
    created = client.post("/api/v1/deposits", json=deposit_payload).json()
    client.app.dependency_overrides[get_current_uid] = lambda: "firebase-user-b"

    assert client.get("/api/v1/deposits").json() == []
    assert client.get(f"/api/v1/deposits/{created['id']}").status_code == 404


def test_invalid_date_range_is_rejected(client, deposit_payload):
    invalid_payload = {**deposit_payload, "maturityDate": "2025-12-31"}

    response = client.post("/api/v1/deposits", json=invalid_payload)

    assert response.status_code == 422


def test_import_refuses_to_overwrite_existing_server_records(client, deposit_payload):
    client.post("/api/v1/deposits", json=deposit_payload)

    response = client.post(
        "/api/v1/deposits/import",
        json={"deposits": [deposit_payload]},
    )

    assert response.status_code == 409
    assert len(client.get("/api/v1/deposits").json()) == 1


def test_import_adds_deposits_to_an_empty_account(client, deposit_payload):
    response = client.post(
        "/api/v1/deposits/import",
        json={"deposits": [deposit_payload]},
    )

    assert response.status_code == 201
    assert len(response.json()) == 1
    assert len(client.get("/api/v1/deposits").json()) == 1
