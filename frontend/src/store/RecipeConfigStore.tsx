import React, {createContext, useCallback, useContext, useEffect, useState, useMemo, ReactNode} from 'react';
import {useFetchUserRecipeConfig} from "../hooks/userHooks.ts";
import {updateUserRecipeConfig} from "../services/userConfigService.ts";
import {RecipeConfigState, RecipeConfigUpdate} from "../types/ContextStoreInterfaces.ts";
import {RecipeConfigs} from "../types/UserConfigs.ts";

// Create state and update contexts
const RecipeConfigStateContext = createContext<RecipeConfigState>({
	recipeIds: [],
	loadingRecipeConfigs: false,
	recipeConfigs: {},
});

const RecipeConfigUpdateContext = createContext<RecipeConfigUpdate>({
	updateRecipesKnown : () => {},
	updateRecipesExcluded : () => {},
	updateRecipesPreferred : () => {},
});

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

interface RecipeConfigProviderProps {
	children: ReactNode; // Explicitly define the type for children
}

export const RecipeConfigProvider: React.FC<RecipeConfigProviderProps> = ({ children }) => {
	const [recipeIds, setRecipeIds] = useState<number[]>([]);
	const [loadingRecipeConfigs, setLoadingRecipeConfigs] = useState<boolean>(true);
	const [recipeConfigs, setRecipeConfigs] = useState<RecipeConfigs>({});
	const { fetchedRecipeConfigs } = useFetchUserRecipeConfig();

	useEffect(() => {
		setLoadingRecipeConfigs(true);

		if (!fetchedRecipeConfigs.loading && Object.keys(fetchedRecipeConfigs.data).length) {
			setRecipeIds(Object.keys(fetchedRecipeConfigs.data).map(key => parseInt(key, 10)));
			setRecipeConfigs(fetchedRecipeConfigs.data);
			setLoadingRecipeConfigs(false);
		}

		if (fetchedRecipeConfigs.error) {
			console.error('Error fetching recipe configs:', fetchedRecipeConfigs.error);
		}
	}, [fetchedRecipeConfigs.loading, fetchedRecipeConfigs.data, fetchedRecipeConfigs.error]);

	// Update local state and stage changes
	const toggleRecipeProperty = useCallback(
		(id: number, property: 'known' | 'excluded' | 'preferred', preferred_id?: number | null) => {
			setRecipeConfigs((prevConfigs) => {
				const newValue = (property==='preferred') ? preferred_id || id : !prevConfigs[id]?.[property]; // Calculate new value based on the latest state
				const updatedConfigs = {
					...prevConfigs,
					[id]: {
						...prevConfigs[id],
						[property]: newValue,
					},
				};

				// Trigger backend update with the new value
				(async () => {
					try {
						await updateUserRecipeConfig({ [id]: { [property]: newValue } });
					} catch (err) {
						console.error(`Error updating ${property} for recipe ${id}:`, err);

						// Rollback state in case of an error
						setRecipeConfigs((rollbackConfigs) => ({
							...rollbackConfigs,
							[id]: {
								...rollbackConfigs[id],
								[property]: !newValue, // Revert the value
							},
						}));
					}
				})();

				return updatedConfigs; // Return updated state for `setRecipeConfigs`
			});
		},
		[]
	);

	const memoizedUpdateFunctions = useMemo(() => ({
		updateRecipesKnown: (id: number) => toggleRecipeProperty(id, 'known'),
		updateRecipesExcluded: (id: number) => toggleRecipeProperty(id, 'excluded'),
		updateRecipesPreferred: (id: number, preferred_id: number) => toggleRecipeProperty(id, 'preferred', preferred_id),
	}), [toggleRecipeProperty]);

	// Memoize context values
	const memoizedState = useMemo(() => ({
		recipeIds,
		loadingRecipeConfigs,
		recipeConfigs,
	}), [recipeIds, loadingRecipeConfigs, recipeConfigs]);

	return (
		<RecipeConfigStateContext.Provider value={memoizedState}>
			<RecipeConfigUpdateContext.Provider value={memoizedUpdateFunctions}>
				{children}
			</RecipeConfigUpdateContext.Provider>
		</RecipeConfigStateContext.Provider>
	);
};
