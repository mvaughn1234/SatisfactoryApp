// Building.ts
import {ItemSummary} from "./Item.ts";

export interface BuildingSummary {
	id: number;
	class_name: string;
	display_name: string;
	description: string;
	power_consumption: number;
}

export interface BuildingDetail extends BuildingSummary {
	power_consumption_exponent: number;
	production_boost_power_consumption_exponent: number;
	production_shard_boost_multiplier: number;
	production_shard_slot_size: number;
}

export interface BuildingFull extends BuildingDetail {
	construction_components: ItemSummary[];
}