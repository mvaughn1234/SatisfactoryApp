// ./src/components/RecipeListItem
import {Box, Checkbox, ListItem, Tooltip, Typography} from '@mui/material';
import Grid from '@mui/material/Grid2';
import React, {useCallback, useState} from 'react';
import {usePreferredRecipe} from "../hooks/usePreferredRecipe.ts";
import {useRecipeConfigUpdate} from '../store/RecipeConfigStore.tsx';
import {RecipeDetail} from "../types/Recipe.ts";

interface RecipeListItemProps {
	recipe: RecipeDetail;
	conf_known: boolean;
	conf_excluded: boolean;
}

const RecipeListItem: React.FC<RecipeListItemProps> = ({recipe, conf_known, conf_excluded}) => {
	const {updateRecipesKnown, updateRecipesExcluded} = useRecipeConfigUpdate();
	const [known, setKnown] = useState<boolean>(conf_known);
	const [excluded, setExcluded] = useState<boolean>(conf_excluded);
	const {isPreferred, setPreferred, single} = usePreferredRecipe(recipe.id);


	const handleLearnRecipe = useCallback(() => {
		updateRecipesKnown(recipe.id);
		setKnown((prev) => !prev);
	}, [updateRecipesKnown, recipe.id]);

	const handleExcludeRecipe = useCallback(() => {
		updateRecipesExcluded(recipe.id);
		setExcluded((prev) => !prev);
	}, [updateRecipesExcluded, recipe.id]);

	const handlePreferredRecipe = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
		setPreferred(event.target.checked);
	}, [setPreferred]);

	return (
		<ListItem disablePadding>
			<Box sx={{flexGrow: 1}}>
				<Grid container spacing={0} columns={{xs: 14}}>
					<Grid size={2}>
						<Tooltip title="Learned" placement="top" arrow>
							{recipe.display_name.startsWith("Alternate") ?
								<Checkbox checked={known} onChange={handleLearnRecipe} size="small"/>
								:
								<Checkbox checked={true} disabled onChange={handleLearnRecipe} size="small"/>
							}
						</Tooltip>
					</Grid>
					<Grid size={8} sx={{display: 'flex', alignItems: 'center'}}>
						<Typography sx={{textAlign: 'left'}}>{recipe.display_name}</Typography>
					</Grid>
					<Grid size={2}>
						<Tooltip title="Excluded" placement="top" arrow>
							<Checkbox checked={excluded} onChange={handleExcludeRecipe} size="small"/>
						</Tooltip>
					</Grid>
					<Grid size={2}>
						<Tooltip title="Preferred" placement="top" arrow>
							<Checkbox disabled={single} checked={isPreferred} onChange={handlePreferredRecipe} size="small"/>
						</Tooltip>
					</Grid>
				</Grid>
			</Box>
		</ListItem>
	);
};

export default RecipeListItem;