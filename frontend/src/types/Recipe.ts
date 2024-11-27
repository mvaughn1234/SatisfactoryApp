// Item.ts
export interface Item {
	id: number;
	class_name: string;
	display_name: string;
	form: string;
	stack_size: string;
	// Optional properties for detailed view
	description?: string;
	energy_value?: number;
	radioactive_decay?: number;
	small_icon?: string;
	persistent_big_icon?: string;
}

// Building.ts
export interface Building {
	id: number;
	class_name: string;
	display_name: string;
	power_consumption?: number; // Optional: may not be needed in all views
	// More building-related fields can be added here as needed
}

// Recipe.ts
export interface RecipeSummary {
	id: number;
	display_name: string;
	class_name: string;
	manufacturing_duration: string; // E.g., "6.00s"
	produced_in?: Building[]; // Optional: can be null for hand-made items
}

export interface RecipeDetail extends RecipeSummary {
	ingredients: RecipeInput[];
	products: RecipeOutput[];
}

export interface RecipeInput {
	item_class_name: string;
	item_display_name: string;
	item_id: number;
	amount: number;
}

export interface RecipeOutput {
	item_class_name: string;
	item_display_name: string;
	item_id: number;
	amount: number;
}
