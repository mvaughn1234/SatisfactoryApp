import React, {useCallback, useState} from 'react';
import {ListItem, Stack, Checkbox, Typography, Box, Paper} from '@mui/material';
import {styled} from '@mui/material/styles';
import Grid from '@mui/material/Grid2';
import {useRecipeConfigState, useRecipeConfigUpdate} from '../store/RecipeConfigStore.tsx';
import {RecipeDetail} from "../types/Recipe.ts";

interface RecipeListItemProps {
	recipe: RecipeDetail;
}

const Item = styled(Paper)(({theme}) => ({
	backgroundColor: '#fff',
	...theme.typography.body2,
	padding: theme.spacing(1),
	textAlign: 'center',
	color: theme.palette.text.secondary,
	...theme.applyStyles('dark', {
		backgroundColor: '#1A2027',
	}),
}));


const RecipeListItem: React.FC<RecipeListItemProps> = ({recipe}) => {
	const {updateRecipesLearned, updateRecipesExcluded} = useRecipeConfigUpdate();
	const [learned, setLearned] = useState(false);
	const [excluded, setExcluded] = useState(false);

	const handleLearnRecipe = useCallback(() => {
		updateRecipesLearned(recipe.id);
		setLearned((prev) => !prev);
	}, [updateRecipesLearned, recipe.id]);

	const handleExcludeRecipe = useCallback(() => {
		updateRecipesExcluded(recipe.id);
		setExcluded((prev) => !prev);
	}, [updateRecipesExcluded, recipe.id]);

	return (
		<ListItem disablePadding>
			<Box sx={{flexGrow: 1}}>
				<Grid container spacing={0}>
					<Grid size={2}>
						<Item>
							{recipe.display_name.startsWith("Alternate") &&
                  <Checkbox checked={learned} onChange={handleLearnRecipe} size="small"/>
							}
						</Item>
					</Grid>
					<Grid size={8} sx={{display: 'flex'}}>
						<Item>
							<Typography sx={{textAlign: 'left'}}>{recipe.display_name}</Typography>
						</Item>
					</Grid>
					<Grid size={2}>
						<Item>
							<Checkbox checked={excluded} onChange={handleExcludeRecipe} size="small"/>
						</Item>
					</Grid>
				</Grid>
			</Box>
		</ListItem>
	);
	// return (
	// 	<ListItem disablePadding>
	// 		<Stack direction="row">
	// 			{recipe.display_name.startsWith("Alternate") ? <Checkbox checked={learned} onChange={handleLearnRecipe} size="small"/>
	// 				:
	// 				<Box sx={{width: '33px'}}/>
	// 			}
	// 			<Typography>{recipe.display_name}</Typography>
	// 			<Checkbox checked={excluded} onChange={handleExcludeRecipe} size="small"/>
	// 		</Stack>
	// 	</ListItem>
	// );
};

export default RecipeListItem;