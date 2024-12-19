"""
./app/models/recipe_models.py
"""
from datetime import datetime
from typing import List

from sqlalchemy import DateTime, func

from .base import Base, Mapped, mapped_column, Optional, relationship, ForeignKey, str_30, num_6_2


class User(Base):
    __tablename__ = 'users'

    id: Mapped[int] = mapped_column(primary_key=True)
    user_key: Mapped[str] = mapped_column(unique=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())

    # Relationships to inputs/outputs and buildings
    user_recipe_configs: Mapped[List["UserRecipeConfig"]] = relationship("UserRecipeConfig", back_populates="user")
    user_production_lines: Mapped[List["UserProductionLine"]] = relationship("UserProductionLine", back_populates="user")

class UserRecipeConfig(Base):
    __tablename__ = 'user_recipes'

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id'), nullable=False)
    recipe_id: Mapped[int] = mapped_column(ForeignKey('recipes.id'), nullable=False)
    known: Mapped[bool] = mapped_column(nullable=False, default=True)  # Consider using an Enum type
    excluded: Mapped[bool] = mapped_column(nullable=False, default=False)
    preferred: Mapped[int] = mapped_column(ForeignKey('recipes.id'), nullable=False)

    # Relationships
    user: Mapped["User"] = relationship('User', back_populates='user_recipe_configs')
    # Explicit foreign key bindings for relationships
    recipe: Mapped["Recipe"] = relationship('Recipe', foreign_keys=[recipe_id], back_populates='user_recipe_configs')
    preferred_recipe: Mapped["Recipe"] = relationship('Recipe', foreign_keys=[preferred], back_populates='preferred_by_configs')

class UserProductionLine(Base):
    __tablename__ = 'production_lines'

    id: Mapped[int] = mapped_column(primary_key=True)
    line_id_frontend: Mapped[str] = mapped_column(nullable=False)
    name: Mapped[str] = mapped_column(nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id'))

    production_line_target: Mapped[List["ProductionLineTarget"]] = relationship("ProductionLineTarget", back_populates="production_line")
    user: Mapped["User"] = relationship("User", back_populates="user_production_lines")

class ProductionLineTarget(Base):
    __tablename__ = 'production_line_targets'

    id: Mapped[int] = mapped_column(primary_key=True)
    line_id: Mapped[int] = mapped_column(ForeignKey('production_lines.id'))
    target_id_frontend: Mapped[str] = mapped_column(nullable=False, unique=True)
    item_id: Mapped[int] = mapped_column(ForeignKey('items.id'), nullable=True)
    rate: Mapped[float] = mapped_column(default=0.0)

    item: Mapped["Item"] = relationship("Item", back_populates="production_line_target")
    production_line: Mapped["UserProductionLine"] = relationship("UserProductionLine", back_populates="production_line_target")