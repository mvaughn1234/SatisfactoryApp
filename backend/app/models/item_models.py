"""
./app/models/item_models.py
"""
from decimal import Decimal
from typing import List

from sqlalchemy import Numeric

from .base import Base, Mapped, mapped_column, Optional, relationship, ForeignKey, str_30, num_6_2, num_10_2, num_10_7


class Item(Base):
    __tablename__ = 'items'

    id: Mapped[int] = mapped_column(primary_key=True)
    class_name: Mapped[str] = mapped_column(unique=True, nullable=False)
    display_name: Mapped[str] = mapped_column(nullable=False)
    abbreviated_display_name: Mapped[Optional[str]]
    can_be_discarded: Mapped[bool]
    class_to_scan_for: Mapped[Optional[str]]
    compatible_item_descriptors: Mapped[Optional[str]]
    crosshair_material: Mapped[Optional[str]]
    description: Mapped[Optional[str]]
    descriptor_stat_bars: Mapped[Optional[str]]
    energy_value: Mapped[Decimal] = mapped_column(Numeric(10,2))
    fluid_color: Mapped[Optional[str]]
    form: Mapped[str_30]
    gas_color: Mapped[Optional[str]]
    gas_type: Mapped[str_30]
    is_alien_item: Mapped[bool]
    menu_priority: Mapped[Decimal] = mapped_column(Numeric(10,7))
    needs_pick_up_marker: Mapped[bool]
    persistent_big_icon: Mapped[str]
    radioactive_decay: Mapped[num_6_2]
    remember_pick_up: Mapped[bool]
    scannable_type: Mapped[str_30]
    scanner_display_text: Mapped[Optional[str_30]]
    scanner_light_color: Mapped[Optional[str_30]]
    should_override_scanner_display_text: Mapped[bool]
    small_icon: Mapped[str]
    stack_size: Mapped[str_30]
    sub_categories: Mapped[Optional[str]]

    # Relationships to subclass-specific attributes
    alien_power_fuel: Mapped["AlienPowerFuel"] = relationship(back_populates="item")
    component: Mapped["Component"] = relationship(back_populates="item")
    consumable: Mapped["Consumable"] = relationship(back_populates="item")
    nuclear_fuel: Mapped["NuclearFuel"] = relationship(back_populates="item")
    power_shard: Mapped["PowerShard"] = relationship(back_populates="item")
    raw_resource: Mapped["RawResource"] = relationship(back_populates="item")
    sinkable: Mapped["Sinkable"] = relationship(back_populates="item")

    # Back references to the inputs and outputs
    recipe_inputs: Mapped[List["RecipeInputs"]] = relationship("RecipeInputs", back_populates="item")
    recipe_outputs: Mapped[List["RecipeOutputs"]] = relationship("RecipeOutputs", back_populates="item")

    def to_dict_summary(self):
        return {
            "id": self.id,
            "class_name": self.class_name,
            "display_name": self.display_name,
            "description": self.description,
        }

    def to_dict_detail(self):
        item_summary_dict = self.to_dict_summary()
        item_detail_dict = {
        "form": self.form,
        "stack_size": self.stack_size,
        "energy_value": self.energy_value,
        "radioactive_decay": self.radioactive_decay,
        }
        return {**item_summary_dict, **item_detail_dict}


class AlienPowerFuel(Base):
    __tablename__ = 'alien_power_fuels'

    id: Mapped[int] = mapped_column(primary_key=True)
    item_id: Mapped[int] = mapped_column(ForeignKey('items.id'))
    boost_duration: Mapped[Optional[num_6_2]]
    boost_percentage: Mapped[Optional[num_6_2]]

    item: Mapped["Item"] = relationship(back_populates="alien_power_fuel")

class Sinkable(Base):
    __tablename__ = 'sinkables'

    id: Mapped[int] = mapped_column(primary_key=True)
    item_id: Mapped[int] = mapped_column(ForeignKey('items.id'))
    resource_sink_points: Mapped[Optional[int]]

    item: Mapped["Item"] = relationship(back_populates="sinkable")

class Component(Base):
    __tablename__ = 'components'

    id: Mapped[int] = mapped_column(primary_key=True)
    item_id: Mapped[int] = mapped_column(ForeignKey('items.id'))
    building_id: Mapped[int] = mapped_column(ForeignKey('buildings.id'))
    recipe_id: Mapped[int] = mapped_column(ForeignKey('recipes.id'))
    recipe_type: Mapped[str]

    item: Mapped["Item"] = relationship(back_populates="component")
    recipes: Mapped[List["Recipe"]] = relationship(back_populates="component")
    buildings: Mapped[List["Building"]] = relationship(back_populates="components")

class Consumable(Base):
    __tablename__ = 'consumables'

    id: Mapped[int] = mapped_column(primary_key=True)
    item_id: Mapped[int] = mapped_column(ForeignKey('items.id'))
    custom_hands_mesh_scale: Mapped[Optional[num_6_2]]
    custom_location: Mapped[str]
    custom_rotation: Mapped[str]
    health_gain: Mapped[Optional[num_6_2]]

    # Back-reference to items
    item: Mapped["Item"] = relationship(back_populates="consumable")

class NuclearFuel(Base):
    __tablename__ = 'nuclear_fuels'

    id: Mapped[int] = mapped_column(primary_key=True)
    item_id: Mapped[int] = mapped_column(ForeignKey('items.id'))
    amount_of_waste: Mapped[int]
    spent_fuel_class: Mapped[str]

    item: Mapped["Item"] = relationship(back_populates="nuclear_fuel")

class PowerShard(Base):
    __tablename__ = 'power_shards'

    id: Mapped[int] = mapped_column(primary_key=True)
    item_id: Mapped[int] = mapped_column(ForeignKey('items.id'))
    extra_potential: Mapped[num_6_2]
    extra_production_boost: Mapped[num_6_2]
    power_shard_type: Mapped[str_30]

    item: Mapped["Item"] = relationship(back_populates="power_shard")

class RawResource(Base):
    __tablename__ = 'raw_resources'

    id: Mapped[int] = mapped_column(primary_key=True)
    item_id: Mapped[int] = mapped_column(ForeignKey('items.id'))
    collect_speed_multiplier: Mapped[Optional[num_6_2]]
    decal_size: Mapped[Optional[num_6_2]]
    manual_mining_audio_name: Mapped[Optional[str_30]]
    ping_color: Mapped[Optional[str]]

    item: Mapped["Item"] = relationship(back_populates="raw_resource")
