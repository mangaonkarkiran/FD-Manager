import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.auth import get_current_uid
from app.database import Base, get_db
from app.main import app


@pytest.fixture
def client():
    engine = create_engine(
        "sqlite+pysqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    test_session = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)
    Base.metadata.create_all(engine)

    def override_get_db():
        with test_session() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_uid] = lambda: "firebase-user-a"
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
    Base.metadata.drop_all(engine)
    engine.dispose()


@pytest.fixture
def deposit_payload():
    return {
        "institution": "Example Bank",
        "customerName": "Aarav Sharma",
        "kind": "Fixed deposit",
        "principal": 100000,
        "annualRate": 7.5,
        "startDate": "2026-01-01",
        "maturityDate": "2027-01-01",
        "accountNumber": "•••• 4821",
        "hasNominee": False,
        "nomineeName": None,
        "status": "Active",
    }
