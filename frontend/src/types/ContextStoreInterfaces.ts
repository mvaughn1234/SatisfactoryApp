import {OptimizationResult, ProductionLine} from '../types/ProductionLine';
import {RecipeConfigs} from "./UserConfigs.ts";
import { ItemDetail } from "../types/Item";
import { RecipeDetail, RecipeGroupDetail } from "../types/Recipe";
import {DebouncedFunc} from "lodash";

export interface ProductionLineState {
	productionLines: Record<string, ProductionLine>;
	activeTabId: string | null;
	loadingState: boolean;
	optimizationResults: Record<string, OptimizationResult>;
	syncInProgress: boolean;
	calculatingResult: boolean;
}

export interface ProductionLineUpdate {
	handleTabChange: (id: string) => void;
	addProductionLine: (name: string) => void;
	updateProductionLine: (id: string, updates: Partial<ProductionLine>) => void;
	removeProductionLine: (id: string) => void;
	queueRecalculation: DebouncedFunc<(lineId?: string) => Promise<void>>;
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

export interface RecipeConfigsState {
	loading: boolean;
	error: string | null;
}
