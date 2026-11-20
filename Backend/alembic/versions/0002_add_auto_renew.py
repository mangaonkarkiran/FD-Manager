"""Add auto-renew preference to deposits.

Revision ID: 0002_add_auto_renew
Revises: 0001_create_deposits
Create Date: 2026-11-20
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0002_add_auto_renew"
down_revision: Union[str, None] = "0001_create_deposits"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "deposits",
        sa.Column("auto_renew", sa.Boolean(), server_default=sa.false(), nullable=False),
    )


def downgrade() -> None:
    op.drop_column("deposits", "auto_renew")
