import {useAppStaticData} from "../store/AppStaticDataStore.tsx";
import {useProductionLineUpdate} from "../store/ProductionLineContext.tsx";
import {useRecipeConfigState, useRecipeConfigUpdate} from "../store/RecipeConfigStore.tsx";

export const usePreferredRecipe = (recipe_id: number) => {
	const { loading, recipesGroupedDetail } = useAppStaticData();
	const { updateRecipesPreferred } = useRecipeConfigUpdate();
	const { loadingRecipeConfigs, recipeConfigs } = useRecipeConfigState();
	const { queueCalculation } = useProductionLineUpdate()

	if (loading || loadingRecipeConfigs) {
		return {
			isPreferred: false,
			setPreferred: () => {}
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
			setPreferred: () => {}
		};
	}

	const allRecipes = [recipeGroup.standard, ...(recipeGroup.alternate || [])];

	// Determine if this particular recipe is the currently preferred one.
	// You might have a structure in recipeConfigs that tells you which recipe is preferred.
	// Let's assume `recipeConfigs[recipe_id].preferred` holds the currently preferred recipe_id for that group.
	// If there's a group-level preferred property, you might look that up instead.
	const currentPreferredId = recipeConfigs[recipe_id]?.preferred || null;
	const groupHasPreference = allRecipes.reduce((count, recipe) => {
		return count + (recipeConfigs[recipe?.id]?.preferred === recipe?.id ? 1 : 0);
	}, 0);
	const isPreferred = currentPreferredId === recipe_id && (groupHasPreference === 1);

	const setPreferred = (preferred: boolean) => {
		// If preferred is true, set this recipe as the preferred one for all recipes in the group
		if (preferred) {
			console.log('allRecipes: ', allRecipes)
			console.log('recipeGroup: ', recipeGroup)
			allRecipes.forEach((r) => updateRecipesPreferred(r.id, recipe_id));
		} else {
			// If not preferred, you might reset the preferred state, or set it to null
			// This depends on how your store expects to handle "no preferred recipe"
			allRecipes.forEach((r) => updateRecipesPreferred(r.id, r.id));
		}
		queueCalculation()
	};

	return {
		isPreferred,
		setPreferred
	};
};