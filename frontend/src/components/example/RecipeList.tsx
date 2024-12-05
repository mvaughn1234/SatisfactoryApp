import React, { useEffect, useState } from 'react';
import axios from 'axios';
import RecipeItem from './RecipeItem.tsx';
import Grid from '@mui/material/Grid2';
import { Recipe } from '../../types/Recipe.ts';

const RecipeList: React.FC = () => {
	const [recipes, setRecipes] = useState<Recipe[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchRecipes = async () => {
			setLoading(true);
			try  {
				const response = await axios.get('/api/recipes');
				setRecipes(response.data);
			} catch (err) {
				console.error("Error fetching recipes:", err)
				setError("Failed to load recipes. Please try again later.")
			} finally {
				setLoading(false);
			}
		};

		fetchRecipes();
	}, []);

	if (loading) {
		return <div>Loading ...</div>
	}

	if (error) {
		return <div>{error}</div>
	}

	return (
		<Grid container spacing={2}>
			{recipes.length === 0 ? (
				<Grid size={12}>
					<p>No recipes found.</p>
				</Grid>
			) : (
				recipes.map((recipe) => (
					<Grid key={recipe.id} size={{ xs:12, sm:6, md:4 }}>
						<RecipeItem recipe={recipe} />
					</Grid>
				))
			)}
		</Grid>
	);
};

export default RecipeList;
