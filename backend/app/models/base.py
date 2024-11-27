"""
./app/models/base.py
"""
from sqlalchemy import Column, String, Integer, Numeric, Boolean, ForeignKey, Text, create_engine
from sqlalchemy.orm import relationship, DeclarativeBase, Mapped, mapped_column, registry, scoped_session, sessionmaker
from sqlalchemy import Table
from typing import List, Optional
from decimal import Decimal
from typing_extensions import Annotated

from config import Config

engine = create_engine(Config.SQLALCHEMY_DATABASE_URI)

SessionLocal = scoped_session(sessionmaker(bind=engine))

str_30 = Annotated[str, 30]
num_6_2 = Annotated[Decimal, 6]
num_10_2 = Annotated[Decimal, 10]
num_10_7 = Annotated[Decimal, 10]
num_10_8 = Annotated[Decimal, 10]


class Base(DeclarativeBase):
    def to_dict_full(self):
        return {c.name: str(getattr(self, c.name)) for c in self.__table__.columns}

    def to_dict(self):
        self.to_dict_detail()

    def to_dict_detail(self):
        return {}

    registry = registry(
        type_annotation_map={
            str_30: String(30),
            num_6_2: Numeric(6, 2),
            num_10_2: Numeric(10, 2),
            num_10_7: Numeric(10, 7),
            num_10_8: Numeric(10, 8),
        }
    )