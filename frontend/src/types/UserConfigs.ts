// RecipeConfig for each individual recipe
export interface RecipeConfigData {
	id: number;
	known?: boolean;
	excluded?: boolean;
	preferred?: number;
}

export type RecipeConfigs = Record<number, RecipeConfigData>;