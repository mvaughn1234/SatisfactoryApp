"""
This file will contain the definitions of your SQLAlchemy models representing the data entities in your app
(e.g., Items, Buildings, Recipes, Users).
Each model maps directly to a table in your database.
"""

from sqlalchemy import Column, String, Integer, Numeric, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship, DeclarativeBase, Mapped, mapped_column, registry
from sqlalchemy import Table
from typing import List, Optional
from decimal import Decimal
from typing_extensions import Annotated

str_30 = Annotated[str, 30]
num_6_2 = Annotated[Decimal, 6]
num_10_2 = Annotated[Decimal, 10]


class Base(DeclarativeBase):
    registry = registry(
        type_annotation_map={
            str_30: String(30),
            num_6_2: Numeric(6, 2),
            num_10_2: Numeric(10, 2),
        }
    )

class Item(Base):
    __tablename__ = 'items'

    id: Mapped[int] = mapped_column(primary_key=True)
    classname: Mapped[str] = mapped_column(unique=True, nullable=False)
    display_name: Mapped[str] = mapped_column(nullable=False)
    abbreviated_display_name: Mapped[Optional[str]]
    can_be_discarded: Mapped[bool]
    class_to_scan_for: Mapped[Optional[str]]
    compatible_item_descriptors: Mapped[Optional[str]]
    crosshair_material: Mapped[Optional[str]]
    description: Mapped[Optional[str]]
    descriptor_stat_bars: Mapped[Optional[str]]
    energy_value: Mapped[Optional[num_10_2]]
    fluid_color: Mapped[Optional[str]]
    form: Mapped[str_30]
    gas_color: Mapped[Optional[str]]
    gas_type: Mapped[str_30]
    is_alien_item: Mapped[bool]
    menu_priority: Mapped[num_6_2]
    needs_pickup_marker: Mapped[bool]
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

    # Raw Resources
    collect_speed_multiplier: Mapped[Optional[num_6_2]]
    decal_size: Mapped[Optional[num_6_2]]
    manual_mining_audio_name: Mapped[Optional[str_30]]
    ping_color: Mapped[Optional[str]]

    # Relationships to subclass-specific attributes
    alien_power_fuel: Mapped["AlienPowerFuel"] = relationship(back_populates="item")
    component: Mapped["Component"] = relationship(back_populates="item")
    consumable: Mapped["Consumable"] = relationship(back_populates="item")
    nuclear_fuel: Mapped["NuclearFuel"] = relationship(back_populates="item")
    power_shard: Mapped["PowerShard"] = relationship(back_populates="item")
    raw_resource: Mapped["RawResources"] = relationship(back_populates="item")

class AlienPowerFuel(Base):
    __tablename__ = 'alien_power_fuels'

    id: Mapped[int] = mapped_column(primary_key=True)
    item_id: Mapped[int] = mapped_column(ForeignKey('items.id'))
    boost_duration: Mapped[Optional[num_6_2]]
    boost_percentage: Mapped[Optional[num_6_2]]

    item: Mapped["Item"] = relationship(back_populates="alien_power_fuel")

class Component(Base):
    __tablename__ = 'components'

    id: Mapped[int] = mapped_column(primary_key=True)
    item_id: Mapped[int] = mapped_column(ForeignKey('items.id'))
    resource_sink_points: Mapped[Optional[int]]

    item: Mapped["Item"] = relationship(back_populates="component")

class Consumable(Base):
    __tablename__ = 'consumables'

    id: Mapped[int] = mapped_column(primary_key=True)
    item_id: Mapped[int] = mapped_column(ForeignKey('items.id'))
    custom_hands_mesh_scale: Mapped[Optional[num_6_2]]
    custom_location: Mapped[str]
    custom_rotation: Mapped[str]
    health_gain: Mapped[num_6_2]

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

class RawResources(Base):
    __tablename__ = 'raw_resources'

    id: Mapped[int] = mapped_column(primary_key=True)
    item_id: Mapped[int] = mapped_column(ForeignKey('items.id'))
    collect_speed_multiplier: Mapped[Optional[num_6_2]]
    decal_size: Mapped[Optional[num_6_2]]
    manual_mining_audio_name: Mapped[Optional[str_30]]
    ping_color: Mapped[Optional[str]]

    item: Mapped["Item"] = relationship(back_populates="raw_resource")

class Building(Base):
    __tablename__ = 'buildings'

    id: Mapped[int] = mapped_column(primary_key=True)
    classname: Mapped[str] = mapped_column(unique=True)
    display_name: Mapped[str]
    description: Mapped[str]
    power_consumption: Mapped[Optional[float]]
    is_variable_power: Mapped[Optional[bool]]
    native_class: Mapped[Optional[str]]

    # Relationships to subclass-specific attributes
    extractor: Mapped["Extractor"] = relationship(back_populates="building")
    manufacturer: Mapped["Manufacturer"] = relationship(back_populates="building")
    smelter: Mapped["Smelter"] = relationship(back_populates="building")

class Extractor(Base):
    __tablename__ = 'extractors'

    id: Mapped[int] = mapped_column(primary_key=True)
    building_id: Mapped[int] = mapped_column(ForeignKey('buildings.id'))
    extraction_rate: Mapped[Optional[float]]
    resource_type: Mapped[Optional[str]]
    is_fracking_extractor: Mapped[Optional[bool]]

    building: Mapped["Building"] = relationship(back_populates="extractor")

class Manufacturer(Base):
    __tablename__ = 'manufacturers'

    id: Mapped[int] = mapped_column(primary_key=True)
    building_id: Mapped[int] = mapped_column(ForeignKey('buildings.id'))
    manufacturing_speed: Mapped[Optional[float]]
    can_produce_multiple_items: Mapped[Optional[bool]]

    building: Mapped["Building"] = relationship(back_populates="manufacturer")

class Smelter(Base):
    __tablename__ = 'smelters'

    id: Mapped[int] = mapped_column(primary_key=True)
    building_id: Mapped[int] = mapped_column(ForeignKey('buildings.id'))
    smelting_speed: Mapped[Optional[float]]

    building: Mapped["Building"] = relationship(back_populates="smelter")

# Many-to-many relationship between recipes and items
recipe_item_inputs = Table('recipe_item_inputs', Base.metadata,
    Column('recipe_id', Integer, ForeignKey('recipes.id')),
    Column('item_id', Integer, ForeignKey('items.id')),
    Column('quantity', Numeric)
)

recipe_item_outputs = Table('recipe_item_outputs', Base.metadata,
    Column('recipe_id', Integer, ForeignKey('recipes.id')),
    Column('item_id', Integer, ForeignKey('items.id')),
    Column('quantity', Numeric)
)

# Many-to-many relationship between recipes and buildings
recipe_building = Table('recipe_building', Base.metadata,
    Column('recipe_id', Integer, ForeignKey('recipes.id')),
    Column('building_id', Integer, ForeignKey('buildings.id'))
)

class Recipe(Base):
    __tablename__ = 'recipes'

    id: Mapped[int] = mapped_column(primary_key=True)
    recipe_name: Mapped[str] = mapped_column(nullable=False)
    duration: Mapped[Optional[float]]
    is_alternate: Mapped[Optional[bool]]

    # Relationships to inputs/outputs and buildings
    inputs: Mapped["Item"] = relationship(secondary=recipe_item_inputs, back_populates="recipes_as_input")
    outputs: Mapped["Item"] = relationship(secondary=recipe_item_outputs, back_populates="recipes_as_output")
    buildings: Mapped["Building"] = relationship(secondary=recipe_building, back_populates="recipes")
