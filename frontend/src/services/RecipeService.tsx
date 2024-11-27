const API_URL = 'https://localhost:5000/api'
const RECIPE_API_URL = `${API_URL}/recipes`

// Fetch items from the API
export const fetchItems = async () => {
	// setLoadingItems(true);
	try {
		const response = await fetch(`${API_URL}/items/components/`);
		const data = await response.json();
		return data;
		// setItems(data);
	} catch (error) {
		console.error('Error fetching component items:', error);
	} finally {
		// setLoadingItems(false);
	}
};

// Fetch Recipes from the API
export const fetchRecipes = async () => {
	// setLoadingRecipes(true);
	try {
		const response = await fetch(`${RECIPE_API_URL}/components/detail/`)
		const data = await response.json();
		return data;
		// setRecipes(data);
	} catch (error) {
		console.error('Error fetching detailed component recipes:', error);
	} finally {
		// setLoadingRecipes(false);
	}
};

// Fetch Recipes from the API
export const fetchRecipesGrouped = async () => {
	// setLoadingRecipesGrouped(true);
	try {
		const response = await fetch(`${RECIPE_API_URL}/components/grouped/detail/`)
		const data = await response.json();
		return data;
		// setRecipesGrouped(data);
	} catch (error) {
		console.error('Error fetching detailed grouped recipes:', error);
	} finally {
		// setLoadingRecipesGrouped(false);
	}
};

