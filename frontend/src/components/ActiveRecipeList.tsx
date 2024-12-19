import MenuIcon from "@mui/icons-material/Menu";
import {Drawer, IconButton} from "@mui/material";
import Divider from "@mui/material/Divider";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import Skeleton from "@mui/material/Skeleton";
import {useTheme , styled} from "@mui/material/styles";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import React, {useMemo} from 'react';
import {useAppStaticData} from "../store/AppStaticDataStore.tsx";
import {useProductionLineState} from "../store/ProductionLineContext.tsx";
import {useRecipeConfigUpdate} from "../store/RecipeConfigStore.tsx";
import ActiveRecipeWrapper from "./ActiveRecipeWrapper.tsx";

// Memoize ActiveRecipeWrapper to prevent unnecessary re-renders
const MemoizedActiveRecipeWrapper = React.memo(ActiveRecipeWrapper, (prevProps, nextProps) => {
	// Return true if the props haven't changed to avoid re-rendering
	return (
		prevProps.selectedRecipe === nextProps.selectedRecipe &&
		prevProps.remainingRecipes === nextProps.remainingRecipes &&
		prevProps.recipeGroupName === nextProps.recipeGroupName &&
		prevProps.onUpdate === nextProps.onUpdate
	);
});

interface ActiveRecipeListProps {
	isRecipeDrawerOpen: boolean,
	openRecipeDrawer: () => void,
	activeRecipeDrawerWidth: number,
}

const DrawerHeader = styled('div')(({theme}) => ({
	display: 'flex',
	alignItems: 'center',
	padding: theme.spacing(0, 1),
	// necessary for content to be below app bar
	...theme.mixins.toolbar,
	justifyContent: 'center',
}));


const ActiveRecipeList: React.FC<ActiveRecipeListProps> = ({
																														 isRecipeDrawerOpen,
																														 openRecipeDrawer,
																														 activeRecipeDrawerWidth
																													 }) => {
	const {recipesGroupedDetail, loading} = useAppStaticData();
	const {optimizedLineData, loadingOptimization} = useProductionLineState()
	const { updateRecipesKnown, updateRecipesExcluded, updateRecipesPreferred } = useRecipeConfigUpdate();
	// const {activeRecipes, setActiveRecipes} = useState<ActiveRecipeGroup>([])
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

	const activeRecipes = useMemo(() => {
		if (loading || loadingOptimization || !optimizedLineData || !recipesGroupedDetail) return [];

		// const p_line_objects = Object.values(graph.production_line)
		return Object.entries(optimizedLineData.production_line).map(([recipe_id, {recipe_data, scale}]) => {
			const recipeGroupStandardFirst = recipesGroupedDetail.find((group) => group.standard?.id === recipe_data.id);
			const recipeGroup = recipeGroupStandardFirst || recipesGroupedDetail.find((group) =>
				group.alternate?.some((alt) => alt.id === recipe_data.id)
			);

			if (!recipeGroup) {
				console.warn(`No recipe group found for recipe ID: ${recipe_id}`);
				return null; // Handle unmatched recipe IDs gracefully
			}

			const selectedRecipe =
				recipeGroup.standard?.id === recipe_data.id
					? recipeGroup.standard
					: recipeGroup.alternate?.find((alt) => alt.id === recipe_data.id);

			if (!selectedRecipe) {
				console.error(`No selected recipe found for recipe ID: ${recipe_data.id}`);
				return null;
			}

			const remainingRecipes = recipeGroup.standard !== null ? [
				...(recipeGroup.standard?.id !== recipe_data.id ? [recipeGroup.standard] : []),
				...recipeGroup.alternate?.filter((alt) => alt.id !== recipe_data.id) ?? [],
			].filter(Boolean) : [];

			return {
				selectedRecipe,
				remainingRecipes,
				recipeGroupName: recipeGroup.standard_product_display_name,
			};
		}).filter(Boolean); // Remove null entries
	}, [optimizedLineData, recipesGroupedDetail]);

	const handleUpdate = (recipeId: number, statusType: string) => {
		switch (statusType) {
			case 'known':
				updateRecipesKnown(recipeId);
				break;
			case 'excluded':
				updateRecipesExcluded(recipeId);
				break;
			case 'preferred':
				updateRecipesPreferred(recipeId);
				break;
			default:
				throw new Error('Invalid status type');
		}
	};

	return (
		<Drawer
			variant="permanent"
			anchor="left"
			sx={{
				width: isMobile ? '100%' : activeRecipeDrawerWidth,
				// backgroundColor: 'red',
				height: isMobile ? '100vh' : '100%',
				overflowY: 'auto',
				flexShrink: 0,
				pt: theme.mixins.toolbar.minHeight,
				[`& .MuiDrawer-paper`]: {
					width: activeRecipeDrawerWidth,
					boxSizing: 'border-box',
				},
			}}
		>
			<Toolbar/>
			< DrawerHeader>
				{!isRecipeDrawerOpen && <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={openRecipeDrawer}
            edge="start"
            sx={{
							position: 'fixed',
							left: '10px',
						}}
        >
            <MenuIcon/>
        </IconButton>
				}
				<Typography sx={{pr: 7}}>Active Recipes</Typography>
			</DrawerHeader>
			<Divider/>

			<List
				sx
					={
					{
						overflow: 'auto',
						// width: '100%',
						// backgroundColor: 'pink',
						'::-webkit-scrollbar':
							{
								width: '4px',
							}
						,
						'::-webkit-scrollbar-track':
							{}
						,
						'::-webkit-scrollbar-thumb':
							{
								backgroundColor: '#939393', // Indicator color
								borderRadius: '10px',
							}
						,
					}
				}
			>

				{
					!(loading && loadingOptimization) ? activeRecipes.map(({ selectedRecipe, remainingRecipes, recipeGroupName }) => (
							<ListItem
								key={selectedRecipe.id}
								disablePadding
								sx={{
									display: 'flex',
									flexDirection: 'column',
									justifyContent: 'flex-start',
									alignItems: 'flex-start'
								}}>
								<MemoizedActiveRecipeWrapper
									selectedRecipe={selectedRecipe}
									remainingRecipes={remainingRecipes}
									recipeGroupName={recipeGroupName}
									onUpdate={(recipe_id, statusType) => handleUpdate(recipe_id, statusType)}
								/>
							</ListItem>
						))
						:
						Array.from({length: 12}).map((_, index) => (
							<ListItem
								key={index}
							>
								<Skeleton
									variant="rectangular"
									width="618px"
									height={88}
									animation="wave"
								/>
							</ListItem>
						))
				}
			</List>
		</Drawer>
	);
};

export default ActiveRecipeList;
