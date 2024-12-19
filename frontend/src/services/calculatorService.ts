import {CALCULATOR_API_URL} from "../constants/constants.ts";
import {getUserKey} from "./userKeyUtility.ts";

export const fetchLineOptimizationCalculation = async (activeTabId: string) => {
	const userKey = getUserKey();

	const response = await fetch(`${CALCULATOR_API_URL}/`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${userKey}`, // Use Authorization header for security
		},
		body: JSON.stringify({ "line": activeTabId }),
	});

	if (!response.ok) {
		throw new Error(`Failed to save recipe config: ${response.statusText}`);
	}

	return response.json();
};
