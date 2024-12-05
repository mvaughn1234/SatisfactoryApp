"""
./app/models/recipe_models.py
"""
from typing import List

from .base import Base, Mapped, mapped_column, Optional, relationship, ForeignKey, str_30, num_6_2


class Recipe(Base):
    __tablename__ = 'recipes'

    id: Mapped[int] = mapped_column(primary_key=True)
    class_name: Mapped[str] = mapped_column(unique=True, nullable=False)
    display_name: Mapped[str]
    full_name: Mapped[str]
    ingredients: Mapped[str]
    manual_manufacturing_multiplier: Mapped[num_6_2]
    manufactoring_duration: Mapped[num_6_2]
    manufacturing_menu_priority: Mapped[num_6_2]
    produced_in: Mapped[str]
    product: Mapped[str]
    relevant_events: Mapped[Optional[str_30]]
    variable_power_consumption_constant: Mapped[num_6_2]
    variable_power_consumption_factor: Mapped[num_6_2]

    # Relationships to inputs/outputs and buildings
    inputs: Mapped[List["RecipeInputs"]] = relationship("RecipeInputs", back_populates="recipe")
    outputs: Mapped[List["RecipeOutputs"]] = relationship("RecipeOutputs", back_populates="recipe")
    compatible_buildings: Mapped[List["RecipeCompatibleBuildings"]] = relationship("RecipeCompatibleBuildings",
                                                                                   back_populates="recipe")
    user_recipe_config: Mapped["UserRecipeConfig"] = relationship("UserRecipeConfig", back_populates="recipe")


    def to_dict_summary(self):
        return {
            'id': self.id,
            'display_name': self.display_name,
            'class_name': self.class_name,
            'manufactoring_duration': self.manufactoring_duration,
            'produced_in': None if self.produced_in == '' else [],
        }

    def to_dict_detail(self):
        recipe_summary_dict = self.to_dict_summary()
        recipe_detail_dict = {
            'ingredients': None if (self.ingredients == '') else [],
            'products': None if (self.product == '') else [],
            'variable_power_consumption_constant': self.variable_power_consumption_constant,
            'variable_power_consumption_factor': self.variable_power_consumption_factor,
        }
        return {**recipe_summary_dict, **recipe_detail_dict}

    # Back reference to component items
    component: Mapped["Component"] = relationship("Component", back_populates="recipes")

class RecipeInputs(Base):
    __tablename__ = 'recipe_inputs'

    id: Mapped[int] = mapped_column(primary_key=True)
    recipe_id: Mapped[int] = mapped_column(ForeignKey('recipes.id'))
    item_id: Mapped[int] = mapped_column(ForeignKey('items.id'))
    input_quantity: Mapped[int]

    recipe: Mapped["Recipe"] = relationship("Recipe", back_populates="inputs")
    item: Mapped["Item"] = relationship("Item", back_populates="recipe_inputs")


class RecipeOutputs(Base):
    __tablename__ = 'recipe_outputs'

    id: Mapped[int] = mapped_column(primary_key=True)
    recipe_id: Mapped[int] = mapped_column(ForeignKey('recipes.id'))
    item_id: Mapped[int] = mapped_column(ForeignKey('items.id'))
    output_quantity: Mapped[int]

    recipe: Mapped["Recipe"] = relationship("Recipe", back_populates="outputs")
    item: Mapped["Item"] = relationship("Item", back_populates="recipe_outputs")

class RecipeCompatibleBuildings(Base):
    __tablename__ = 'recipe_compatible_buildings'

    id: Mapped[int] = mapped_column(primary_key=True)
    recipe_id: Mapped[int] = mapped_column(ForeignKey('recipes.id'))
    building_id: Mapped[Optional[int]] = mapped_column(ForeignKey('buildings.id'))
    is_produced_in_building: Mapped[bool]

    recipe: Mapped["Recipe"] = relationship("Recipe", back_populates="compatible_buildings")
    building: Mapped[Optional["Building"]] = relationship("Building", back_populates="recipe_compatible_buildings")
