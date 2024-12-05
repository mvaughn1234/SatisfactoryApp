import { Recipe } from '../types/Recipe.ts';

export const mockRecipes: Recipe[] = [
	{
		id: 1,
		name: "Electrode Aluminum Scrap",
		building: "Refinery",
		time: 4, // 4 seconds per cycle
		inputs: [
			{ resource: "Alumina Solution", quantity: 180 }, // Quantity per minute
			{ resource: "Petroleum Coke", quantity: 60 }
		],
		outputs: [
			{ resource: "Aluminum Scrap", quantity: 300 },
			{ resource: "Water", quantity: 105 }
		],
		isAlternate: true,
	},
	{
		id: 2,
		name: "Regular Aluminum Scrap",
		building: "Refinery",
		time: 5,
		inputs: [
			{ resource: "Bauxite", quantity: 120 },
			{ resource: "Coal", quantity: 60 }
		],
		outputs: [
			{ resource: "Aluminum Scrap", quantity: 240 },
			{ resource: "Silica", quantity: 50 }
		],
		isAlternate: false,
	},
	// Add more recipes as needed
];
