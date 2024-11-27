import React, { createContext, useCallback, useContext, useEffect, useState, useMemo } from 'react';
import {useFetchRecipesComponentsIds} from "../hooks/recipeHooks.ts";

// RecipeConfig for each individual recipe
interface RecipeConfig {
	learned: boolean;
	excluded: boolean;
}

// RecipeConfigState for the context
interface RecipeConfigState {
	recipeIds: number[];
	loadingRecipeConfigs: boolean;
	recipeConfigs: { [id: number]: RecipeConfig };
}

interface RecipeConfigUpdate {
	updateRecipesLearned: (id: number) => void;
	updateRecipesExcluded: (id: number) => void;
}

// Create state and update contexts
const RecipeConfigStateContext = createContext(null);
const RecipeConfigUpdateContext = createContext(null);

// Custom hook to access only the recipe state
export const useRecipeConfigState = () => {
	const context = useContext(RecipeConfigStateContext);
	if (!context) throw new Error('useRecipeConfigState must be used within RecipeConfigProvider');
	return context as RecipeConfigState;
};

// Custom hook to access only the update functions
export const useRecipeConfigUpdate = () => {
	const context = useContext(RecipeConfigUpdateContext);
	if (!context) throw new Error('useRecipeConfigUpdate must be used within RecipeConfigProvider');
	return context as RecipeConfigUpdate;
};

export const RecipeConfigProvider: React.FC = ({ children }) => {
	const [recipeIds, setRecipeIds] = useState<number[]>([]);
	const [loadingRecipeConfigs, setLoadingRecipeConfigs] = useState<boolean>(true);
	const [recipeConfigs, setRecipeConfigs] = useState<{ [id: number]: RecipeConfig }>({});
	const { fetchedRecipesComponentsIds } = useFetchRecipesComponentsIds();

	useEffect(() => {
		setLoadingRecipeConfigs(fetchedRecipesComponentsIds.loading);

		if (!fetchedRecipesComponentsIds.loading && fetchedRecipesComponentsIds.data.length) {
			setRecipeIds(fetchedRecipesComponentsIds.data);
			const initialConfigs = fetchedRecipesComponentsIds.data.reduce((acc, recipeId) => {
				acc[recipeId] = { learned: false, excluded: false };
				return acc;
			}, {} as { [id: number]: RecipeConfig });
			setRecipeConfigs(initialConfigs);
		}

		if (fetchedRecipesComponentsIds.error) {
			console.error('Error fetching recipe configs:', fetchedRecipesComponentsIds.error);
		}

	}, [fetchedRecipesComponentsIds.loading, fetchedRecipesComponentsIds.data, fetchedRecipesComponentsIds.error]);

	// Stable update functions, isolated in their own context
	const updateRecipesLearned = useCallback((id: number) => {
		setRecipeConfigs((prevConfigs) => ({
			...prevConfigs,
			[id]: {
				...prevConfigs[id],
				learned: !prevConfigs[id]?.learned,
			},
		}));
	}, []);

	const updateRecipesExcluded = useCallback((id: number) => {
		setRecipeConfigs((prevConfigs) => ({
			...prevConfigs,
			[id]: {
				...prevConfigs[id],
				excluded: !prevConfigs[id]?.excluded,
			},
		}));
	}, []);

	// Memoize context values
	const memoizedState = useMemo(() => ({
		recipeIds,
		loadingRecipeConfigs,
		recipeConfigs,
	}), [recipeIds, loadingRecipeConfigs, recipeConfigs]);

	const memoizedUpdateFunctions = useMemo(() => ({
		updateRecipesLearned,
		updateRecipesExcluded,
	}), [updateRecipesLearned, updateRecipesExcluded]);

	return (
		<RecipeConfigStateContext.Provider value={memoizedState}>
			<RecipeConfigUpdateContext.Provider value={memoizedUpdateFunctions}>
				{children}
			</RecipeConfigUpdateContext.Provider>
		</RecipeConfigStateContext.Provider>
	);
};
