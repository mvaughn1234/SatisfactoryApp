// ./src/components/RecipeListItem
import {Box, Checkbox, ListItem, Tooltip, Typography} from '@mui/material';
import Grid from '@mui/material/Grid2';
import React, {useCallback} from 'react';
import {useDispatch, useSelector} from "react-redux";
import {usePreferredRecipe} from "../hooks/usePreferredRecipe.ts";
import {useProductionLineUpdate} from "../store/ProductionLineContext.tsx";
import {recipeConfigsSelectors, toggleRecipePropertyThunk} from "../store/recipeSlice.ts";
import {AppDispatch, RootState} from "../store/recipeConfigsStore.ts";
import {RecipeDetail} from "../types/Recipe.ts";

interface RecipeListItemProps {
	recipe: RecipeDetail;
	conf_known?: boolean;
	conf_excluded?: boolean;
}

const RecipeListItem: React.FC<RecipeListItemProps> = ({recipe, conf_known = true, conf_excluded = false}) => {
	const {isPreferred, setPreferred, single} = usePreferredRecipe(recipe.id);
	const dispatch = useDispatch<AppDispatch>();
	const recipeConfig = useSelector((state: RootState) =>
		recipeConfigsSelectors.selectById(state, recipe.id)
	);
	const {queueRecalculation} = useProductionLineUpdate()


	const handleLearnRecipe = () => {
		const newValue = !recipeConfig.known;
		dispatch(toggleRecipePropertyThunk({ id: recipe.id, property: 'known', newValue }));
		queueRecalculation()
	};

	const handleExcludeRecipe = () => {
		const newValue = !recipeConfig.excluded;
		dispatch(toggleRecipePropertyThunk({ id: recipe.id, property: 'excluded', newValue}));
		queueRecalculation()
	};

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
								<Checkbox checked={conf_known} onChange={handleLearnRecipe} size="small"/>
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
							<Checkbox checked={conf_excluded} onChange={handleExcludeRecipe} size="small"/>
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