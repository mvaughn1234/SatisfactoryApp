// /src/services/userConfigService.ts

import {getUserKey} from "./userKeyUtility.ts";
import {USER_CONFIG_API_URL} from '../constants/constants';


export const updateUserRecipeConfig = async (config: any) => {
	const userKey = getUserKey();

	const response = await fetch(`${USER_CONFIG_API_URL}/config/recipes`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${userKey}`, // Use Authorization header for security
		},
		body: JSON.stringify({ config }),
	});

	if (!response.ok) {
		throw new Error(`Failed to save recipe: ${response.statusText}`);
	}

	return response.json();
};

export const fetchUserRecipeConfig = async () => {
	const userKey = getUserKey();

	const response = await fetch(`${USER_CONFIG_API_URL}/config/recipes`, {
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