// RecipeConfig for each individual recipe
export interface RecipeConfigData {
	id: number;
	known?: boolean;
	excluded?: boolean;
	preferred?: number;
}

export interface RecipeConfigs {
	[id: number]: RecipeConfigData
}