from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Boolean, Date, DateTime, Index, Numeric, String, false, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class DepositRecord(Base):
    __tablename__ = "deposits"
    __table_args__ = (
        Index("ix_deposits_owner_created", "owner_uid", "created_at"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    owner_uid: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    institution: Mapped[str] = mapped_column(String(120), nullable=False)
    customer_name: Mapped[str] = mapped_column(String(120), nullable=False)
    kind: Mapped[str] = mapped_column(String(32), nullable=False, default="Fixed deposit")
    principal: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    annual_rate: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    maturity_date: Mapped[date] = mapped_column(Date, nullable=False)
    account_number: Mapped[str] = mapped_column(String(32), nullable=False)
    has_nominee: Mapped[bool] = mapped_column(nullable=False, default=False)
    nominee_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    auto_renew: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default=false()
    )
    status: Mapped[str] = mapped_column(String(16), nullable=False, default="Active")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )
