import {Box, Checkbox, ListItem, Paper, Typography} from '@mui/material';
import Grid from '@mui/material/Grid2';
import {styled} from '@mui/material/styles';
import React, {useCallback, useState} from 'react';
import {useRecipeConfigUpdate} from '../store/RecipeConfigStore.tsx';
import {RecipeDetail} from "../types/Recipe.ts";

interface RecipeListItemProps {
	recipe: RecipeDetail;
	conf_known: boolean;
	conf_excluded: boolean;
	conf_preferred: number;
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


const RecipeListItem: React.FC<RecipeListItemProps> = ({recipe, conf_known, conf_excluded}) => {
	const {updateRecipesKnown, updateRecipesExcluded} = useRecipeConfigUpdate();
	const [known, setKnown] = useState<boolean>(conf_known);
	const [excluded, setExcluded] = useState<boolean>(conf_excluded);
	// const [preferred, setPreferred] = useState<number>(conf_preferred);

	const handleLearnRecipe = useCallback(() => {
		updateRecipesKnown(recipe.id);
		setKnown((prev) => !prev);
	}, [updateRecipesKnown, recipe.id]);

	const handleExcludeRecipe = useCallback(() => {
		updateRecipesExcluded(recipe.id);
		setExcluded((prev) => !prev);
	}, [updateRecipesExcluded, recipe.id]);

	// const handlePreferredRecipe = useCallback(() => {
	// 	updateRecipesPreferred(recipe.id);
	// 	// setPreferred((prev) => !prev);
	// }, [updateRecipesPreferred, recipe.id]);

	return (
		<ListItem disablePadding>
			<Box sx={{flexGrow: 1}}>
				<Grid container spacing={0}>
					<Grid size={2}>
						<Item>
							{recipe.display_name.startsWith("Alternate") ?
                  <Checkbox checked={known} onChange={handleLearnRecipe} size="small"/>
								:
                  <Checkbox checked={true} disabled onChange={handleLearnRecipe} size="small"/>
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
};

export default RecipeListItem;