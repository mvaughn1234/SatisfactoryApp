import {OptimizationResult, ProductionLine} from '../types/ProductionLine';
import {RecipeConfigs} from "./UserConfigs.ts";
import { ItemDetail } from "../types/Item";
import { RecipeDetail, RecipeGroupDetail } from "../types/Recipe";

export interface ProductionLineState {
	productionLines: ProductionLine[];
	activeTabId: string;
	loadingProductionLines: boolean;
	optimizedLineData?: OptimizationResult;
	loadingOptimization: boolean;
	calculationError?: string;
}

export interface ProductionLineUpdate {
	setActiveTabId: (id: string) => void;
	addProductionLine: (name: string) => void;
	updateProductionLine: (id: string, updates: Partial<ProductionLine>) => void;
	removeProductionLine: (id: string) => void;
	queueCalculation: () => void;
}

// RecipeConfigState for the context
export interface RecipeConfigState {
	recipeIds: number[];
	loadingRecipeConfigs: boolean;
	recipeConfigs: RecipeConfigs;
}

export interface RecipeConfigUpdate {
	updateRecipesKnown: (id: number) => void;
	updateRecipesExcluded: (id: number) => void;
	updateRecipesPreferred: (id: number, preferred_id: number) => void;
}

export interface StaticDataState {
	itemsComponentsDetail: ItemDetail[];
	recipesComponentsDetail: RecipeDetail[];
	recipesGroupedDetail: RecipeGroupDetail[];
	loading: boolean;
	error: string | null;
}
