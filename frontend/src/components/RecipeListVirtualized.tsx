// ./src/components/RecipeListVirtualized.tsx
import React, { useMemo } from 'react';
import {shallowEqual, useDispatch, useSelector} from "react-redux";
import { FixedSizeList, ListChildComponentProps } from 'react-window';
// If you’re on older React versions or want more advanced functionality,
// you could also use react-virtualized instead.
import { Box } from '@mui/material';
import {AppDispatch, RootState} from "../store/recipeConfigsStore.ts";
import {recipeConfigsSelectors} from "../store/recipeSlice.ts";
import {RecipeConfigData, RecipeConfigs} from "../types/UserConfigs.ts";
import RecipeListItem from './RecipeListItem';
import {RecipeDetail} from '../types/Recipe.ts';  // or wherever your Recipe type lives

type RecipeListVirtualizedProps = {
	recipes: RecipeDetail[]; // your own type
	height?: number;
	width?: number;
};

// Memoize recipe item to prevent unnecessary re-renders
const MemoizedRecipeListItem = React.memo(RecipeListItem, (prevProps, nextProps) => {
	// Return true if the props haven't changed to avoid re-rendering
	return (
		prevProps.recipe === nextProps.recipe &&
		prevProps.conf_known === nextProps.conf_known &&
		prevProps.conf_excluded === nextProps.conf_excluded
	);
});

/**
 * A virtualized list of recipes.
 * Adjust itemSize, height, and width to fit your layout needs.
 */
const RecipeListVirtualized: React.FC<RecipeListVirtualizedProps> = ({
																																			 recipes,
																																			 height = 600,
																																			 width = 300,
																																		 }) => {

	// Optional: you could do sorting/grouping logic here before rendering:
	// Example: group or sort recipes based on props
	// const processedRecipes = useMemo(() => groupRecipes(recipes), [recipes]);

	const Row = React.memo(function Row({ index, style }: ListChildComponentProps) {
		const recipe = recipes[index];

		// Only pull the 3 fields we need for *this* recipe
		const config = useSelector((state: RootState) =>
			recipeConfigsSelectors.selectById(state, recipe.id)
		);

		return (
			<Box style={style}>
				<MemoizedRecipeListItem
					recipe={recipe}
					conf_known={config?.known}
					conf_excluded={config?.excluded}
					// possibly pass preferred if you need it
				/>
			</Box>
		);
	}, (prevProps, nextProps) => {
		// Compare prevProps.index, prevProps.style, etc.
		return prevProps.index === nextProps.index
			&& shallowEqual(prevProps.style, nextProps.style);
	});

	return (
		<FixedSizeList
			height={height}
			itemCount={recipes.length}
			itemSize={48} // px height for each row; adjust as needed
			width={width}
		>
			{Row}
		</FixedSizeList>
	);
};

export default RecipeListVirtualized;
