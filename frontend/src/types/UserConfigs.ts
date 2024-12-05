// RecipeConfig for each individual recipe
export interface RecipeConfigData {
	id: number;
	known?: boolean;
	excluded?: boolean;
	preferred?: boolean;
}

export interface RecipeConfigs {
	[id: number]: RecipeConfigData
}

// RecipeConfigState for the context
export interface RecipeConfigState {
	loadingRecipeConfigs: boolean;
	recipeConfigs: RecipeConfigs;
}

export interface RecipeConfigUpdate {
	updateRecipesKnown: (id: number) => void;
	updateRecipesExcluded: (id: number) => void;
	updateRecipesPreferred: (id: number) => void;
	// syncUpdatesToDatabase: () => void;
}
