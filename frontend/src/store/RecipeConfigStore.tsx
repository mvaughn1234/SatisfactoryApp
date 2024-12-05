import React, { createContext, useCallback, useContext, useEffect, useState, useMemo } from 'react';
import {useFetchUserRecipeConfig, useUpdateUserRecipeConfig} from "../hooks/userHooks.ts";
import {updateUserRecipeConfig} from "../services/userConfigService.ts";
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
	const [stagedUpdates, setStagedUpdates] = useState<Partial<RecipeConfigs>>({});
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

	// Record staged changes
	const stageUpdate = useCallback((id: number, field: string, value: boolean) => {
		setStagedUpdates((prevUpdates) => ({
			...prevUpdates,
			[id]: {
				...prevUpdates[id],
				[field]: value,
			},
		}));
	}, []);

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
		stageUpdate(id, 'known', newValue);
	}, [recipeConfigs, stageUpdate]);

	const updateRecipesExcluded = useCallback((id: number) => {
		const newValue = !recipeConfigs[id]?.excluded;
		setRecipeConfigs((prevConfigs) => ({
			...prevConfigs,
			[id]: {
				...prevConfigs[id],
				excluded: newValue,
			},
		}));
		stageUpdate(id, 'excluded', newValue);
	}, [recipeConfigs, stageUpdate]);

	const updateRecipesPreferred = useCallback((id: number) => {
		const newValue = !recipeConfigs[id]?.preferred;
		setRecipeConfigs((prevConfigs) => ({
			...prevConfigs,
			[id]: {
				...prevConfigs[id],
				preferred: newValue,
			},
		}));
		stageUpdate(id, 'preferred', newValue);
	}, [recipeConfigs, stageUpdate]);

	// Sync updates to database
	const syncUpdatesToDatabase = useCallback(async () => {
		try {
			if (Object.keys(stagedUpdates).length === 0) return; // No updates to sync

			await updateUserRecipeConfig(stagedUpdates);
			setStagedUpdates({}); // Clear staged updates on success
		} catch (err) {
			console.error('Error syncing updates to database:', err);
		}
	}, [stagedUpdates]);

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
		syncUpdatesToDatabase, // Expose sync function for drawer close event
	}), [updateRecipesKnown, updateRecipesExcluded, updateRecipesPreferred, syncUpdatesToDatabase]);

	return (
		<RecipeConfigStateContext.Provider value={memoizedState}>
			<RecipeConfigUpdateContext.Provider value={memoizedUpdateFunctions}>
				{children}
			</RecipeConfigUpdateContext.Provider>
		</RecipeConfigStateContext.Provider>
	);
};
