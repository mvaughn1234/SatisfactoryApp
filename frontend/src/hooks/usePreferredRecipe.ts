import {useDispatch, useSelector} from "react-redux";
import {useAppStaticData} from "../store/AppStaticDataStore.tsx";
import {useProductionLineState, useProductionLineUpdate} from "../store/ProductionLineContext.tsx";
import {recipeConfigsSelectors, toggleRecipePropertyThunk} from "../store/recipeSlice.ts";
import {AppDispatch, RootState} from "../store/recipeConfigsStore.ts";

export const usePreferredRecipe = (recipe_id: number) => {
	const {loading, recipesGroupedDetail} = useAppStaticData();
	const {queueRecalculation} = useProductionLineUpdate();
	const {activeTabId} = useProductionLineState();
	const dispatch = useDispatch<AppDispatch>();
	const loadingRecipeConfigs = useSelector((state: RootState) => state.recipes.loading);
	const recipeConfigs = useSelector((state: RootState) =>
		recipeConfigsSelectors.selectAll(state)
	);
	const thisRecipeConfig = useSelector((state: RootState) =>
		recipeConfigsSelectors.selectById(state, recipe_id)
	)

	if (loading || loadingRecipeConfigs) {
		return {
			isPreferred: false,
			setPreferred: () => {
			}
		}
	}

	// Identify the recipe group for the given recipe_id
	const recipeGroupStandardFirst = recipesGroupedDetail.find((group) =>
		group.standard?.id === recipe_id
	);
	const recipeGroup = recipeGroupStandardFirst || recipesGroupedDetail.find((group) =>
		group.alternate?.some((alt) => alt.id === recipe_id)
	);

	if (!recipeGroup) {
		console.warn(`No recipe group found for recipe ID: ${recipe_id}`);
		return {
			isPreferred: false,
			setPreferred: () => {
			}
		};
	}

	const allRecipes = recipeGroup.standard ? [recipeGroup.standard, ...(recipeGroup.alternate || [])] : [...(recipeGroup.alternate || [])];

	// Determine if this particular recipe is the currently preferred one.
	// You might have a structure in recipeConfigs that tells you which recipe is preferred.
	// Let's assume `recipeConfigs[recipe_id].preferred` holds the currently preferred recipe_id for that group.
	// If there's a group-level preferred property, you might look that up instead.
	const currentPreferredId = thisRecipeConfig.preferred || null;
	const groupHasPreference = allRecipes.reduce((count, recipe) => {
		if (recipe) {
			const currRecipeConfig = useSelector((state: RootState) =>
				recipeConfigsSelectors.selectById(state, recipe.id)
			)
			return count + (currRecipeConfig.preferred === recipe?.id ? 1 : 0);
		} else {
			return count;
		}
	}, 0);
	const isPreferred = currentPreferredId === recipe_id && (groupHasPreference === 1);
	const single = allRecipes.length === 1;

	const setPreferred = (preferred: boolean) => {
		// If preferred is true, set this recipe as the preferred one for all recipes in the group
		if (preferred) {
			allRecipes.forEach((r) => r && dispatch(toggleRecipePropertyThunk({ id: r.id, property: 'preferred', newValue: recipe_id })));
		} else {
			// If not preferred, you might reset the preferred state, or set it to null
			// This depends on how your store expects to handle "no preferred recipe"
			allRecipes.forEach((r) => r && dispatch(toggleRecipePropertyThunk({ id: r.id, property: 'preferred', newValue: r.id })));
		}
		if (activeTabId) {
			queueRecalculation(activeTabId);
		}
	};

	return {
		isPreferred,
		setPreferred,
		single
	};
};