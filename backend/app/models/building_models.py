"""

"""
from decimal import Decimal
from typing import List

from sqlalchemy import Numeric

from .base import Base, Mapped, mapped_column, Optional, relationship, ForeignKey, num_10_2, str_30, num_10_8


class Building(Base):
    __tablename__ = 'buildings'

    consumption_average = {
        'Build_Converter_C': 250,
        'Build_HadronCollider_C': 500,
        'Build_QuantumEncoder_C': 1000,
    }

    id: Mapped[int] = mapped_column(primary_key=True)
    class_name: Mapped[str] = mapped_column(unique=True, nullable=False)
    add_to_significance_manager: Mapped[bool]
    affects_occlusion: Mapped[bool]
    alien_over_clocking_attenuation_scaling_factor: Mapped[Decimal] = mapped_column(Numeric(10,2))
    alien_over_clocking_highpass_rtpc: Mapped[Decimal] = mapped_column(Numeric(10,2))
    alien_over_clocking_particle_effects: Mapped[Optional[str_30]]
    alien_over_clocking_pitch_rtpc: Mapped[Decimal] = mapped_column(Numeric(10,2))
    alien_over_clocking_volume_db_rtpc: Mapped[Decimal] = mapped_column(Numeric(10,2))
    alien_over_clocking_z_offset: Mapped[Decimal] = mapped_column(Numeric(10,2))
    allow_coloring: Mapped[bool]
    allow_patterning: Mapped[bool]
    alternative_material_recipes: Mapped[Optional[str_30]]
    attachment_points: Mapped[Optional[str_30]]
    base_production_boost: Mapped[Decimal] = mapped_column(Numeric(10,2))
    blueprint_build_effect_id: Mapped[int]
    build_effect_speed: Mapped[Decimal] = mapped_column(Numeric(10,2))
    cached_skeletal_meshes: Mapped[Optional[str_30]]
    can_change_potential: Mapped[bool]
    can_change_production_boost: Mapped[bool]
    can_contain_lightweight_instances: Mapped[bool]
    can_ever_monitor_productivity: Mapped[bool]
    clearance_data: Mapped[Optional[str]]
    contains_components: Mapped[bool]
    current_productivity_measurement_duration: Mapped[Decimal] = mapped_column(Numeric(10,2))
    current_productivity_measurement_produce_duration: Mapped[Decimal] = mapped_column(Numeric(10,2))
    custom_scale_type: Mapped[Optional[str_30]]
    default_productivity_measurement_duration: Mapped[Decimal] = mapped_column(Numeric(10,2))
    description: Mapped[Optional[str]]
    display_name: Mapped[Optional[str_30]]
    does_have_shutdown_animation: Mapped[bool]
    effect_update_interval: Mapped[Decimal] = mapped_column(Numeric(10,2))
    fluid_stack_size_default: Mapped[Optional[str_30]]
    fluid_stack_size_multiplier: Mapped[int]
    force_build_effect_solo: Mapped[bool]
    force_legacy_build_effect: Mapped[bool]
    force_net_update_on_register_player: Mapped[bool]
    has_been_removed_from_subsystem: Mapped[bool]
    has_inventory_potential: Mapped[bool]
    hide_on_build_effect_start: Mapped[bool]
    interacting_players: Mapped[Optional[str_30]]
    interaction_register_player_with_circuit: Mapped[bool]
    is_considered_for_base_weight_value: Mapped[Decimal] = mapped_column(Numeric(10,2))
    is_multi_spawned_buildable: Mapped[bool]
    is_tick_rate_managed: Mapped[bool]
    is_useable: Mapped[bool]
    last_productivity_measurement_duration: Mapped[Decimal] = mapped_column(Numeric(10,2))
    last_productivity_measurement_produce_duration: Mapped[Decimal] = mapped_column(Numeric(10,2))
    managed_by_lightweight_buildable_subsystem: Mapped[bool]
    max_potential: Mapped[Decimal] = mapped_column(Numeric(10,2))
    max_render_distance: Mapped[Decimal] = mapped_column(Numeric(10,2))
    min_potential: Mapped[Decimal] = mapped_column(Numeric(10,2))
    minimum_producing_time: Mapped[Decimal] = mapped_column(Numeric(10,2))
    minimum_stopped_time: Mapped[Decimal] = mapped_column(Numeric(10,2))
    occlusion_box_info: Mapped[Optional[str_30]]
    occlusion_shape: Mapped[Optional[str_30]]
    on_current_productivity_changed: Mapped[Optional[str_30]]
    on_has_power_changed: Mapped[Optional[str_30]]
    on_has_production_changed: Mapped[Optional[str_30]]
    on_has_standby_changed: Mapped[Optional[str_30]]
    on_pending_potential_changed: Mapped[Optional[str_30]]
    on_pending_production_boost_changed: Mapped[Optional[str_30]]
    override_potential_shard_slots: Mapped[bool]
    override_production_shard_slot_size: Mapped[bool]
    pipe_output_connections: Mapped[Optional[str_30]]
    potential_shard_slots: Mapped[int]
    power_consumption: Mapped[Decimal] = mapped_column(Numeric(10,2))
    power_consumption_exponent: Mapped[Optional[num_10_8]]
    production_boost_power_consumption_exponent: Mapped[Decimal] = mapped_column(Numeric(10,2))
    production_shard_boost_multiplier: Mapped[Decimal] = mapped_column(Numeric(10,2))
    production_shard_slot_size: Mapped[int]
    productivity_monitor_enabled: Mapped[bool]
    remove_buildable_from_subsystem_on_dismantle: Mapped[bool]
    replicated_built_inside_blueprint_designer: Mapped[bool]
    scale_custom_offset: Mapped[Decimal] = mapped_column(Numeric(10,2))
    should_modify_world_grid: Mapped[bool]
    should_show_attachment_point_visuals: Mapped[bool]
    significance_range: Mapped[Decimal] = mapped_column(Numeric(10,2))
    skip_build_effect: Mapped[bool]
    tick_exponent: Mapped[Decimal] = mapped_column(Numeric(10,2))
    timelapse_bucket_id: Mapped[int]
    timelapse_delay: Mapped[Decimal] = mapped_column(Numeric(10,2))
    toggle_dormancy_on_interaction: Mapped[bool]

    # Relationships to subclass-specific attributes
    extractor: Mapped["Extractor"] = relationship(back_populates="building")
    manufacturer: Mapped["Manufacturer"] = relationship(back_populates="building")
    smelter: Mapped["Smelter"] = relationship(back_populates="building")

    # Back reference to compatible buildings for recipes
    recipe_compatible_buildings: Mapped[List["RecipeCompatibleBuildings"]] = relationship("RecipeCompatibleBuildings", back_populates="building")

    # Back reference to components for items
    components: Mapped[List["Component"]] = relationship("Component", back_populates="buildings")

    def to_dict_summary(self):
        return {
            'id': self.id,
            'class_name': self.class_name,
            'display_name': self.display_name,
            'description': self.description,
            'power_consumption': self.power_consumption if self.power_consumption not in self.consumption_average else
            self.consumption_average[self.class_name],
        }

    def to_dict_detail(self):
        building_summary_dict = self.to_dict_summary()
        building_detail_dict = {
            'power_consumption_exponent': self.power_consumption_exponent,
            'production_boost_power_consumption_exponent': self.production_boost_power_consumption_exponent,
            'production_shard_boost_multiplier': self.production_shard_boost_multiplier,
            'production_shard_slot_size': self.production_shard_slot_size,
        }

        return {**building_summary_dict, **building_detail_dict}



class Extractor(Base):
    __tablename__ = 'extractors'

    id: Mapped[int] = mapped_column(primary_key=True)
    building_id: Mapped[int] = mapped_column(ForeignKey('buildings.id'))
    allowed_resource_forms: Mapped[Optional[str_30]] #water, oil, miner1-3
    allowed_resources: Mapped[Optional[str]] #water, oil, miner1-3
    extractor_type_name: Mapped[Optional[str_30]] #water, oil, miner1-3
    only_allow_certain_resources: Mapped[Optional[bool]] #water, oil, miner1-3
    try_find_missing_resource: Mapped[Optional[bool]] #water, oil, miner1-3
    extract_cycle_time: Mapped[Optional[Decimal]] = mapped_column(Numeric(10,2)) #water, oil, miner1-3
    extract_startup_time: Mapped[Optional[Decimal]] = mapped_column(Numeric(10,2)) #water, oil, miner1-3
    extract_startup_timer: Mapped[Optional[Decimal]] = mapped_column(Numeric(10,2)) #water, oil, miner1-3
    items_per_cycle: Mapped[Optional[int]] #water, oil, miner1-3
    can_play_after_start_up_stopped: Mapped[Optional[bool]] #miner1-3
    particle_map: Mapped[Optional[str]] #miner1-3
    sam_reference: Mapped[Optional[str]] #miner1-3
    depth_trace_origin_offset: Mapped[Optional[str]] #Waterpump
    has_lost_significance: Mapped[Optional[bool]] #Waterpump
    internal_mining_state_0: Mapped[Optional[str_30]] #Minermk3
    internal_start_up_timer: Mapped[Optional[Decimal]] = mapped_column(Numeric(10,2)) #Minermk1
    maximum_drill_time_0: Mapped[Optional[Decimal]] = mapped_column(Numeric(10,2)) #Minermk3
    minimum_depth_for_placement: Mapped[Optional[Decimal]] = mapped_column(Numeric(10,2)) #Waterpump
    minimum_drill_time_0: Mapped[Optional[Decimal]] = mapped_column(Numeric(10,2)) #Minermk3
    toggle_mining_state_handle_0: Mapped[Optional[str_30]] #minermk3
    waterpump_timeline_direction: Mapped[Optional[str_30]] #waterpump
    waterpump_timeline_rtpc: Mapped[Optional[Decimal]] = mapped_column(Numeric(10,2)) #waterpump

    building: Mapped["Building"] = relationship(back_populates="extractor")

class Manufacturer(Base):
    __tablename__ = 'manufacturers'

    id: Mapped[int] = mapped_column(primary_key=True)
    building_id: Mapped[int] = mapped_column(ForeignKey('buildings.id'))
    current_recipe_changed: Mapped[Optional[str_30]] #quantum, converter, hadron, refinery, foundry, packager, manufacturer, assembler, blender, smelter, constructor
    factory_input_connections: Mapped[Optional[str_30]] #quantum, converter, hadron, refinery, foundry, packager, manufacturer, assembler, blender, smelter, constructor
    factory_output_connections: Mapped[Optional[str_30]] #quantum, converter, hadron, refinery, foundry, packager, manufacturer, assembler, blender, smelter, constructor
    manufacturing_speed: Mapped[Optional[Decimal]] = mapped_column(Numeric(10,2)) #quantum, converter, hadron, refinery, foundry, packager, manufacturer, assembler, blender, smelter, constructor
    pipe_input_connections: Mapped[Optional[str_30]] #quantum, converter, hadron, refinery, foundry, packager, manufacturer, assembler, blender, smelter, constructor
    is_powered: Mapped[Optional[bool]] #quantum, hadron, refinery, packager, blender, constructor
    production_effects_running: Mapped[Optional[bool]] #refinery, foundry, packager, blender, smelter
    estimated_maximum_power_consumption: Mapped[Optional[Decimal]] = mapped_column(Numeric(10,2)) #quantum, converter, hadron
    estimated_mininum_power_consumption: Mapped[Optional[Decimal]] = mapped_column(Numeric(10,2)) #quantum, converter, hadron
    ao_attenuation_scaling_factor: Mapped[Optional[Decimal]] = mapped_column(Numeric(10,2)) #Constructormk1
    ao_layer_z_offset: Mapped[Optional[Decimal]] = mapped_column(Numeric(10,2)) #Constructormk1
    color: Mapped[Optional[str_30]] #Blender
    current_color_vfx: Mapped[Optional[str]] # Packager
    current_packaging_mode: Mapped[Optional[str_30]] #Packager
    current_potential_convert: Mapped[Optional[str]] #Constructormk1
    current_producing_seek_time: Mapped[Optional[Decimal]] = mapped_column(Numeric(10,2)) #Hadroncolider
    current_recipe_check: Mapped[Optional[str_30]] #Constructormk1
    game_time_at_producing: Mapped[Optional[Decimal]] = mapped_column(Numeric(10,2)) #Hadron
    is_anim_producing: Mapped[Optional[bool]] #Quantumencoder
    is_radio_active: Mapped[Optional[bool]] #Blender
    lightning_timer: Mapped[Optional[str_30]] #Hadron
    notify_name_r_eferences: Mapped[Optional[str]] #blender
    previous_recipe_check: Mapped[Optional[str_30]] #constructormk1
    rtpc_ao_highpass_value: Mapped[Optional[Decimal]] = mapped_column(Numeric(10,2)) #constructormk1
    rtpc_ao_pitch: Mapped[Optional[Decimal]] = mapped_column(Numeric(10,2)) #constructormk1
    rtpc_ao_volume_db: Mapped[Optional[Decimal]] = mapped_column(Numeric(10,2)) #constructormk1
    sequence_duration: Mapped[Optional[Decimal]] = mapped_column(Numeric(10,2)) #hadron
    socket_stopped_ak_components: Mapped[Optional[str_30]] #manufacturer
    start_vector_vfx_large_end: Mapped[Optional[str]] #hadron
    start_vector_vfx_large_start: Mapped[Optional[str]] #hadron
    start_vector_vfx_medium_end: Mapped[Optional[str]] #hadron
    start_vector_vfx_medium_start: Mapped[Optional[str]] #hadron
    start_vector_vfx_small_end: Mapped[Optional[str]] #hadron
    start_vector_vfx_small_start: Mapped[Optional[str]] #hadron
    stopped_ak_components: Mapped[Optional[str_30]] #manufacturer
    stopped_producing_animation_sounds: Mapped[Optional[bool]] #manufacturer


    building: Mapped["Building"] = relationship(back_populates="manufacturer")

class Smelter(Base):
    __tablename__ = 'smelters'

    id: Mapped[int] = mapped_column(primary_key=True)
    building_id: Mapped[int] = mapped_column(ForeignKey('buildings.id'))
    current_recipe_changed: Mapped[Optional[str_30]] #quantum, converter, hadron, refinery, foundry, packager, manufacturer, assembler, blender, smelter, constructor
    factory_input_connections: Mapped[Optional[str_30]] #quantum, converter, hadron, refinery, foundry, packager, manufacturer, assembler, blender, smelter, constructor
    factory_output_connections: Mapped[Optional[str_30]] #quantum, converter, hadron, refinery, foundry, packager, manufacturer, assembler, blender, smelter, constructor
    manufacturing_speed: Mapped[Optional[Decimal]] = mapped_column(Numeric(10,2)) #quantum, converter, hadron, refinery, foundry, packager, manufacturer, assembler, blender, smelter, constructor
    pipe_input_connections: Mapped[Optional[str_30]] #quantum, converter, hadron, refinery, foundry, packager, manufacturer, assembler, blender, smelter, constructor
    is_pending_to_kill_vfx: Mapped[Optional[bool]] #Smeltermk1
    cached_current_potential: Mapped[Optional[int]] #Smeltermk1

    building: Mapped["Building"] = relationship(back_populates="smelter")

