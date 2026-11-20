from datetime import date, datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator


def to_camel(value: str) -> str:
    first, *rest = value.split("_")
    return first + "".join(part.capitalize() for part in rest)


class DepositFields(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        str_strip_whitespace=True,
    )

    institution: str = Field(min_length=1, max_length=120)
    customer_name: str = Field(min_length=1, max_length=120)
    kind: Literal["Fixed deposit"] = "Fixed deposit"
    principal: Decimal = Field(ge=1000, le=100_000_000, max_digits=14, decimal_places=2)
    annual_rate: Decimal = Field(ge=0.1, le=20, max_digits=5, decimal_places=2)
    start_date: date
    maturity_date: date
    account_number: str = Field(min_length=1, max_length=32)
    has_nominee: bool = False
    nominee_name: str | None = Field(default=None, max_length=120)
    auto_renew: bool = False
    status: Literal["Active", "Matured"] = "Active"

    @model_validator(mode="after")
    def validate_deposit(self) -> "DepositFields":
        if self.maturity_date <= self.start_date:
            raise ValueError("Maturity date must be after the start date.")
        if self.has_nominee and not (self.nominee_name or "").strip():
            raise ValueError("Nominee name is required when a nominee is selected.")
        if not self.has_nominee:
            self.nominee_name = None
        elif self.nominee_name is not None:
            self.nominee_name = self.nominee_name.strip()
        return self


class DepositCreate(DepositFields):
    pass


class DepositUpdate(DepositFields):
    pass


class DepositImportRequest(BaseModel):
    deposits: list[DepositCreate] = Field(min_length=1, max_length=500)


class DepositResponse(DepositFields):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )

    id: str
    created_at: datetime
    updated_at: datetime
