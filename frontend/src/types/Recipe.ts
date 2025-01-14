// Recipe.ts
import {BuildingDetail} from "./Building.ts";
import {ItemSummary} from "./Item.ts";

export interface RecipeSummary {
	id: number;
	display_name: string;
	class_name: string;
	manufactoring_duration: string; // E.g., "6.00s"
	produced_in?: BuildingDetail[]; // Optional: can be null for hand-made items
}

export interface RecipeItem extends ItemSummary{
	amount: number;
}

export interface RecipeDetail extends RecipeSummary {
	ingredients?: RecipeItem[];
	products?: RecipeItem[];
	variable_power_consumption_constant: number;
	variable_power_consumption_factor: number;
}

export interface RecipeGroupDetail {
	standard_product_display_name: string;
	alternate?: RecipeDetail[];
	standard?: RecipeDetail;
}

export interface ActiveRecipeGroup {
	selectedRecipe: RecipeDetail; // The recipe currently selected by the optimizer
	otherRecipes: RecipeDetail[]; // The other recipes in the same group
	recipeGroupName: string; // Name of the group (e.g., "Iron Ingot")
}
