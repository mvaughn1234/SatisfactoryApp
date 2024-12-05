// /src/services/userConfigService.ts

import {ProductionLine} from "../types/ProductionLine.ts";
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
		throw new Error(`Failed to save recipe config: ${response.statusText}`);
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
		throw new Error(`Failed to fetch recipe configs: ${response.statusText}`);
	}

	return response.json();
};

export const fetchProductionLines = async () => {
	const userKey = getUserKey();

	const response = await fetch(`${USER_CONFIG_API_URL}/config/lines/load`, {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${userKey}`,
		},
	});

	if (!response.ok) {
		throw new Error(`Failed to fetch production lines: ${response.statusText}`);
	}

	return response.json();
}

export const updateUserProductionLine = async (id: string, updates: Partial<ProductionLine>) => {
	const userKey = getUserKey();

	const response = await fetch(`${USER_CONFIG_API_URL}/config/lines/update`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${userKey}`, // Use Authorization header for security
		},
		body: JSON.stringify({
			id: id,
			updates: updates,
		}),
	});

	if (!response.ok) {
		throw new Error(`Failed to save recipe config: ${response.statusText}`);
	}

	return response.json();
};

