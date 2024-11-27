// Item.ts
export interface ItemSummary {
	id: number;
	class_name: string;
	display_name: string;
	description?: string;
}

export interface ItemDetail extends ItemSummary{
	form: string;
	stack_size: string;
	energy_value?: number;
	radioactive_decay?: number;
}