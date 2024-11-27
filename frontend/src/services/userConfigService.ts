// /src/services/userConfigService.ts

import {getUserKey} from "./userKeyUtility.ts";
import {CALCULATOR_API_URL} from '../constants/constants';


export const saveRecipe = async (recipeConfig: any) => {
	const userKey = getUserKey();

	const response = await fetch(`${CALCULATOR_API_URL}/`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ userKey, recipeConfig }),
	});

	if (!response.ok) {
		throw new Error(`Failed to save recipe: ${response.statusText}`);
	}

	return response.json();
};

export const getRecipes = async () => {
	const userKey = getUserKey();

	const response = await fetch(`${CALCULATOR_API_URL}/recipes`, {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${userKey}`, // Use Authorization header for security
		},
	});

	if (!response.ok) {
		throw new Error(`Failed to fetch recipes: ${response.statusText}`);
	}

	return response.json();
};