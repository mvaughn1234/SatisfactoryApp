import React from 'react';
import { Recipe } from '../../types/Recipe.ts';
import { Card, CardContent, Typography } from '@mui/material';

type RecipeItemProps = {
	recipe: Recipe;
};

const RecipeItem: React.FC<RecipeItemProps> = ({ recipe }) => {
	return (
		<Card>
			<CardContent>
				<Typography variant="h5" component="div">
					{recipe.display_name}
				</Typography>
				<Typography variant="body2" color="text.secondary">
					Produced in: {recipe.produced_in.map(building => building.building_display_name).join(', ')}
				</Typography>
				<Typography variant="body2">
					Ingredients: {recipe.ingredients.map(ingredient => `${ingredient.amount} x ${ingredient.item_display_name}`).join(', ')}
				</Typography>
				<Typography variant="body2">
					Products: {recipe.products.map(product => `${product.amount} x ${product.item_display_name}`).join(', ')}
				</Typography>
			</CardContent>
		</Card>
	);
};

export default RecipeItem;
