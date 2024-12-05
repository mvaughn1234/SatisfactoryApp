import React, { createContext, useCallback, useContext, useEffect, useState, useMemo } from 'react';
import {useFetchUserRecipeConfig, useUpdateUserRecipeConfig} from "../hooks/userHooks.ts";
import {updateUserProductionLine, updateUserRecipeConfig} from "../services/userConfigService.ts";
import {RecipeConfigs, RecipeConfigState, RecipeConfigUpdate} from "../types/UserConfigs.ts";

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
	const [recipeConfigs, setRecipeConfigs] = useState<RecipeConfigs>({});
	const { fetchedRecipeConfigs } = useFetchUserRecipeConfig();

	useEffect(() => {
		setLoadingRecipeConfigs(fetchedRecipeConfigs.loading);

		if (!fetchedRecipeConfigs.loading && Object.keys(fetchedRecipeConfigs.data).length) {
			setRecipeIds(Object.keys(fetchedRecipeConfigs.data).map(key => parseInt(key, 10)));
			setRecipeConfigs(fetchedRecipeConfigs.data);
		}

		if (fetchedRecipeConfigs.error) {
			console.error('Error fetching recipe configs:', fetchedRecipeConfigs.error);
		}

	}, [fetchedRecipeConfigs.loading, fetchedRecipeConfigs.data, fetchedRecipeConfigs.error]);

	// Update local state and stage changes
	const updateRecipesKnown = useCallback((id: number) => {
		const newValue = !recipeConfigs[id]?.known;
		setRecipeConfigs((prevConfigs) => ({
			...prevConfigs,
			[id]: {
				...prevConfigs[id],
				known: newValue,
			},
		}));
		(async () => {
			try {
				await updateUserRecipeConfig({[id]: {'known': newValue}});
			} catch (err) {
				console.error("Error syncing updates to database:", err);
			}
		})();
	}, [recipeConfigs]);

	const updateRecipesExcluded = useCallback((id: number) => {
		const newValue = !recipeConfigs[id]?.excluded;
		setRecipeConfigs((prevConfigs) => ({
			...prevConfigs,
			[id]: {
				...prevConfigs[id],
				excluded: newValue,
			},
		}));
		(async () => {
			try {
				await updateUserRecipeConfig({[id]: {'excluded': newValue}});
			} catch (err) {
				console.error("Error syncing updates to database:", err);
			}
		})();
	}, [recipeConfigs]);

	const updateRecipesPreferred = useCallback((id: number) => {
		const newValue = !recipeConfigs[id]?.preferred;
		setRecipeConfigs((prevConfigs) => ({
			...prevConfigs,
			[id]: {
				...prevConfigs[id],
				preferred: newValue,
			},
		}));
		(async () => {
			try {
				await updateUserRecipeConfig({[id]: {'preferred': newValue}});
			} catch (err) {
				console.error("Error syncing updates to database:", err);
			}
		})();
	}, [recipeConfigs]);

	// Memoize context values
	const memoizedState = useMemo(() => ({
		recipeIds,
		loadingRecipeConfigs,
		recipeConfigs,
	}), [recipeIds, loadingRecipeConfigs, recipeConfigs]);

	const memoizedUpdateFunctions = useMemo(() => ({
		updateRecipesKnown,
		updateRecipesExcluded,
		updateRecipesPreferred,
		// syncUpdatesToDatabase, // Expose sync function for drawer close event
	}), [updateRecipesKnown, updateRecipesExcluded, updateRecipesPreferred]);

	return (
		<RecipeConfigStateContext.Provider value={memoizedState}>
			<RecipeConfigUpdateContext.Provider value={memoizedUpdateFunctions}>
				{children}
			</RecipeConfigUpdateContext.Provider>
		</RecipeConfigStateContext.Provider>
	);
};
