import React, {createContext, useContext, useEffect, useRef, useState} from 'react';
import {useFetchItemsComponentsDetail} from "../hooks/itemHooks.ts";
import {useFetchRecipesComponentsDetail, useFetchRecipesGroupedDetail} from "../hooks/recipeHooks.ts";
import {initializeUserKey} from "../services/userConfigService.ts";
import {ItemDetail} from "../types/Item.ts";
import {ProductionLine} from "../types/ProductionLine";
import {RecipeDetail, RecipeGroupDetail} from "../types/Recipe.ts";

// const LOCAL_STORAGE_KEY = 'productionAppState';

// AppState interface definition
interface AppState {
	productionLines: ProductionLine[];
	activeTabId: string;
	itemsComponentsDetail: ItemDetail[];
	recipesComponentsDetail: RecipeDetail[];
	recipesGroupedDetail: RecipeGroupDetail[];
	loadingItemsComponentsDetail: boolean;
	loadingRecipesComponentsDetail: boolean;
	loadingRecipesGroupedDetail: boolean;
	setActiveTabId: (id: string) => void;
	addProductionLine: (name: string) => void;
	updateProductionLine: (id: string, updates: Partial<ProductionLine>) => void;
}

// Create the initial context
const AppContext = createContext<AppState | undefined>(undefined);

// Custom hook to use the context
export const useAppContext = () => {
	const context = useContext(AppContext);
	if (!context) throw new Error('useAppContext must be used within AppProvider');
	return context;
};

export const AppProvider: React.FC = ({children}) => {
	const [productionLines, setProductionLines] = useState<ProductionLine[]>([
		{
			id: '0', // Default to Tab 0
			name: 'Default Production Line',
			productionTargets: [],
			inputCustomizations: [],
			recipeCustomizations: [],
			// lastUpdated: new Date(),
		}
	]);


	const [activeTabId, setActiveTabId] = useState<string>('0');  // Active tab ID
	const [itemsComponentsDetail, setitemsComponentsDetail] = useState<ItemDetail[]>([]);  // State for items
	const [recipesComponentsDetail, setRecipesComponentsDetail] = useState<RecipeDetail[]>([]);  // State for items
	const [recipesGroupedDetail, setRecipesGroupedDetail] = useState<RecipeGroupDetail[]>([]);  // State for items
	const [loadingItemsComponentsDetail, setLoadingItemsComponentsDetail] = useState<boolean>(false);  // Loading state for items
	const [loadingRecipesComponentsDetail, setLoadingRecipesComponentsDetail] = useState<boolean>(false);  // Loading state for recipes
	const [loadingRecipesGroupedDetail, setLoadingRecipesGroupedDetail] = useState<boolean>(false);  // Loading state for recipes

	const {fetchedItemsComponentsDetail} = useFetchItemsComponentsDetail();
	const {fetchedRecipesGroupedDetail} = useFetchRecipesGroupedDetail();
	const {fetchedRecipesComponentsDetail} = useFetchRecipesComponentsDetail();

	useEffect(() =>{
		initializeUserKey()
	}, [])

	// Initialize production lines from local storage or with a default line
	useEffect(() => {
		// Update loading states
		setLoadingItemsComponentsDetail(fetchedItemsComponentsDetail.loading);
		setLoadingRecipesComponentsDetail(fetchedRecipesComponentsDetail.loading);
		setLoadingRecipesGroupedDetail(fetchedRecipesGroupedDetail.loading);

		// Update items state when data loads
		if (!fetchedItemsComponentsDetail.loading && fetchedItemsComponentsDetail.data.length) {
			setitemsComponentsDetail(fetchedItemsComponentsDetail.data);
		}
		// Update recipes state when data loads
		if (!fetchedRecipesComponentsDetail.loading && fetchedRecipesComponentsDetail.data.length) {
			setRecipesComponentsDetail(fetchedRecipesComponentsDetail.data);
			setLoadingRecipesComponentsDetail(false); // Done loading recipes
		}

		// Update recipesGrouped state when data loads
		if (!fetchedRecipesGroupedDetail.loading && fetchedRecipesGroupedDetail.data.length) {
			setRecipesGroupedDetail(fetchedRecipesGroupedDetail.data);
			setLoadingRecipesGroupedDetail(false); // Done loading grouped recipes
		}

		// Handle errors
		if (fetchedItemsComponentsDetail.error) {
			console.error("Error loading items:", fetchedItemsComponentsDetail.error);
		}
		if (fetchedRecipesComponentsDetail.error) {
			console.error("Error loading recipes:", fetchedRecipesComponentsDetail.error);
		}
		if (fetchedRecipesGroupedDetail.error) {
			console.error("Error loading grouped recipes:", fetchedRecipesGroupedDetail.error);
		}
	}, [fetchedItemsComponentsDetail, fetchedRecipesGroupedDetail, fetchedRecipesComponentsDetail]);

	const addProductionLine = (name: string) => {
		const newLine: ProductionLine = {
			id: `${productionLines.length}`,
			name,
			productionTargets: [],
			inputCustomizations: [],
			recipeCustomizations: [],
			// lastUpdated: new Date(),
		};
		setProductionLines([...productionLines, newLine]);
		setActiveTabId(newLine.id);
	};

	const updateProductionLine = (id: string, updates: Partial<ProductionLine>) => {
		setProductionLines(
			productionLines.map((line) =>
				line.id === id ? {...line, ...updates} : line
			)
		);
	};

	useEffect(() => {

	}, [productionLines])

	return (
		<AppContext.Provider
			value={{
				productionLines,
				activeTabId,
				itemsComponentsDetail: itemsComponentsDetail,
				recipesComponentsDetail: recipesComponentsDetail,
				recipesGroupedDetail: recipesGroupedDetail,
				loadingItemsComponentsDetail: loadingItemsComponentsDetail,
				loadingRecipesComponentsDetail: loadingRecipesComponentsDetail,
				loadingRecipesGroupedDetail: loadingRecipesGroupedDetail,
				setActiveTabId,
				addProductionLine,
				updateProductionLine,
			}}
		>
			{children}
		</AppContext.Provider>
	);
};
