import {RECIPE_API_URL} from "../constants/constants.ts";

export const fetchRecipesComponentsDetail = async () => {
	try {
		const response = await fetch(`${RECIPE_API_URL}/components/detail/`);
		return await response.json();
	} catch (error) {
		console.error('Error fetching detailed component recipes:', error);
	}
};
