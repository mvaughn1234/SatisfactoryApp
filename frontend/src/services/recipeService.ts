import {RECIPE_API_URL} from '../constants/constants';

export const fetchRecipesComponentsDetail = async () => {
	try {
		const response = await fetch(`${RECIPE_API_URL}/components/detail/`);
		return await response.json();
	} catch (error) {
		console.error('Error fetching detailed component recipes:', error);
	}
};

export const fetchRecipesComponentsIds = async () => {
	try {
		const response = await fetch(`${RECIPE_API_URL}/components/ids/`);
		return await response.json();
	} catch (error) {
		console.error('Error fetching component recipes ids:', error);
	}
};

export const fetchRecipesGroupedDetail = async () => {
	try {
		const response = await fetch(`${RECIPE_API_URL}/components/grouped/detail/`);
		return await response.json();
	} catch (error) {
		console.error('Error fetching detailed grouped recipes:', error);
	}
};

