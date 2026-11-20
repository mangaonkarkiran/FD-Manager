"""Create deposits table.

Revision ID: 0001_create_deposits
Revises:
Create Date: 2026-11-18
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0001_create_deposits"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "deposits",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("owner_uid", sa.String(length=128), nullable=False),
        sa.Column("institution", sa.String(length=120), nullable=False),
        sa.Column("customer_name", sa.String(length=120), nullable=False),
        sa.Column("kind", sa.String(length=32), nullable=False),
        sa.Column("principal", sa.Numeric(precision=14, scale=2), nullable=False),
        sa.Column("annual_rate", sa.Numeric(precision=5, scale=2), nullable=False),
        sa.Column("start_date", sa.Date(), nullable=False),
        sa.Column("maturity_date", sa.Date(), nullable=False),
        sa.Column("account_number", sa.String(length=32), nullable=False),
        sa.Column("has_nominee", sa.Boolean(), nullable=False),
        sa.Column("nominee_name", sa.String(length=120), nullable=True),
        sa.Column("status", sa.String(length=16), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_deposits_owner_uid", "deposits", ["owner_uid"])
    op.create_index(
        "ix_deposits_owner_created",
        "deposits",
        ["owner_uid", "created_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_deposits_owner_created", table_name="deposits")
    op.drop_index("ix_deposits_owner_uid", table_name="deposits")
    op.drop_table("deposits")
