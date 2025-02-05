// src/types/ProductionLine.ts
import {ItemSummary} from './Item';
import {RecipeDetail, RecipeSummary} from './Recipe';

// Interface for a production target (e.g., 100 iron plates/min)
export interface ProductionTarget {
	id: string;            // Unique identifier for the target
	product: ItemSummary | null;         // The product being produced (e.g., Iron Plate)
	rate: number | null;          // Production rate (e.g., 100 units per minute)
}

// Interface for an input customization (e.g., limiting input resources)
export interface InputCustomization {
	id: string;
	item: ItemSummary;            // The input item (e.g., Plastic)
	total_amount_available: number;          // Input rate (e.g., 100 plastic/min)
	is_global_resource: boolean; // Whether it's treated like a global resource (like raw ores)
}

// Interface for recipe customizations (learned, excluded, etc.)
export interface RecipeCustomization {
	recipe: RecipeSummary;        // The recipe being customized
	included: boolean;     // Whether the recipe is included or excluded
	isRequired: boolean;   // Whether the recipe must be used (forced inclusion)
}

// Full interface for a production line (i.e., a tab)
export interface ProductionLine {
	id: string;                           // Unique ID for the production line
	name: string;                         // Name of the production line (e.g., 'Plastic Production')
	production_targets: ProductionTarget[];          // List of products being produced
	input_customizations: InputCustomization[]; // Custom input limitations
	recipe_customizations: RecipeCustomization[]; // Learned/excluded/required recipes
	// lastUpdated: Date;                    // Last updated timestamp for tracking changes
}

export interface OptimizationResult {
	production_line: {
		[recipe_id: number]: {
			recipe_data: RecipeDetail;
			scale: number;
		};
	},
	raw_resource_usage: [{
		item_id: number,
		total_quantity: number,
	}],
	target_output: [{
		item_id: number,
		amount: number,
	}]
}