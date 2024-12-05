import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Recipe } from '../../types/Recipe.ts';
import { useParams } from 'react-router-dom';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';

const RecipeDetails: React.FC = () => {
	const { recipeId } = useParams<{ recipeId: string }>();
	const [recipe, setRecipe] = useState<Recipe | null>(null);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchRecipe = async () => {
			setLoading(true);
			try {
				const response = await axios.get(`/api/recipes/${recipeId}`);
				setRecipe(response.data);
			} catch (err) {
				console.error("Error fetching recipe:", err);
				setError("Failed to load recipe details. Please try again later.");
			} finally {
				setLoading(false);
			}
		};

		fetchRecipe();
	}, [recipeId]);

	if (loading) return <div>Loading...</div>;
	if (error) return <div>{error}</div>;
	if (!recipe) return <div>Recipe not found.</div>;

	return (
		<Card variant="outlined" sx={{ marginTop: 2 }}>
			<CardContent>
				<Typography variant="h4" component="div">
					{recipe.display_name}
				</Typography>
				<Typography variant="subtitle1" color="text.secondary">
					Manufacturing Duration: {recipe.manufacturing_duration}s
				</Typography>
				<Typography variant="body1">
					Produced In: {recipe.produced_in.map(building => building.building_display_name).join(', ')}
				</Typography>
				<Typography variant="body1">
					Ingredients:
					<ul>
						{recipe.ingredients.map(ingredient => (
							<li key={ingredient.item_id}>
								{ingredient.amount} x {ingredient.item_display_name}
							</li>
						))}
					</ul>
				</Typography>
				<Typography variant="body1">
					Products:
					<ul>
						{recipe.products.map(product => (
							<li key={product.item_id}>
								{product.amount} x {product.item_display_name}
							</li>
						))}
					</ul>
				</Typography>
			</CardContent>
		</Card>
	);
};

export default RecipeDetails;
