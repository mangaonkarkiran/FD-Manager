from typing import Annotated
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth import get_current_uid
from app.database import get_db
from app.models import DepositRecord
from app.schemas import (
    DepositCreate,
    DepositImportRequest,
    DepositResponse,
    DepositUpdate,
)


router = APIRouter(prefix="/deposits", tags=["deposits"])
DbSession = Annotated[Session, Depends(get_db)]
CurrentUid = Annotated[str, Depends(get_current_uid)]


def _owned_deposit(session: Session, deposit_id: str, owner_uid: str) -> DepositRecord:
    deposit = session.scalar(
        select(DepositRecord).where(
            DepositRecord.id == deposit_id,
            DepositRecord.owner_uid == owner_uid,
        )
    )
    if deposit is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deposit not found.",
        )
    return deposit


def _new_record(payload: DepositCreate, owner_uid: str) -> DepositRecord:
    return DepositRecord(
        id=str(uuid4()),
        owner_uid=owner_uid,
        **payload.model_dump(),
    )


@router.get("", response_model=list[DepositResponse])
def list_deposits(session: DbSession, owner_uid: CurrentUid) -> list[DepositRecord]:
    return list(
        session.scalars(
            select(DepositRecord)
            .where(DepositRecord.owner_uid == owner_uid)
            .order_by(DepositRecord.created_at.desc(), DepositRecord.id)
        )
    )


@router.post("", response_model=DepositResponse, status_code=status.HTTP_201_CREATED)
def create_deposit(
    payload: DepositCreate,
    session: DbSession,
    owner_uid: CurrentUid,
) -> DepositRecord:
    deposit = _new_record(payload, owner_uid)
    session.add(deposit)
    session.commit()
    session.refresh(deposit)
    return deposit


@router.post("/import", response_model=list[DepositResponse], status_code=201)
def import_deposits(
    payload: DepositImportRequest,
    session: DbSession,
    owner_uid: CurrentUid,
) -> list[DepositRecord]:
    existing = session.scalar(
        select(DepositRecord.id).where(DepositRecord.owner_uid == owner_uid).limit(1)
    )
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Deposits already exist in this account. Import was not performed.",
        )

    deposits = [_new_record(item, owner_uid) for item in payload.deposits]
    session.add_all(deposits)
    session.commit()
    for deposit in deposits:
        session.refresh(deposit)
    return deposits


@router.get("/{deposit_id}", response_model=DepositResponse)
def get_deposit(
    deposit_id: str,
    session: DbSession,
    owner_uid: CurrentUid,
) -> DepositRecord:
    return _owned_deposit(session, deposit_id, owner_uid)


@router.put("/{deposit_id}", response_model=DepositResponse)
def update_deposit(
    deposit_id: str,
    payload: DepositUpdate,
    session: DbSession,
    owner_uid: CurrentUid,
) -> DepositRecord:
    deposit = _owned_deposit(session, deposit_id, owner_uid)
    for field, value in payload.model_dump().items():
        setattr(deposit, field, value)
    session.commit()
    session.refresh(deposit)
    return deposit


@router.delete("/{deposit_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_deposit(
    deposit_id: str,
    session: DbSession,
    owner_uid: CurrentUid,
) -> Response:
    deposit = _owned_deposit(session, deposit_id, owner_uid)
    session.delete(deposit)
    session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
