// ./src/components/ActiveRecipeList.tsx
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import MenuIcon from "@mui/icons-material/Menu";
import {Box, Drawer, IconButton} from "@mui/material";
import Divider from "@mui/material/Divider";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import {styled, useTheme} from "@mui/material/styles";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import React, {useMemo, useState} from 'react';
import {useAppStaticData} from "../store/AppStaticDataStore.tsx";
import {useProductionLineState} from "../store/ProductionLineContext.tsx";
import {OptimizationResult} from "../types/ProductionLine.ts";
import {RecipeDetail, RecipeItem} from "../types/Recipe.ts";
import ActiveRecipeWrapper from "./ActiveRecipeWrapper.tsx";

// Memoize ActiveRecipeWrapper to prevent unnecessary re-renders
const MemoizedActiveRecipeWrapper = React.memo(ActiveRecipeWrapper, (prevProps, nextProps) => {
	// Return true if the props haven't changed to avoid re-rendering
	return (
		prevProps.selectedRecipe === nextProps.selectedRecipe &&
		prevProps.remainingRecipes === nextProps.remainingRecipes &&
		prevProps.recipeGroupName === nextProps.recipeGroupName &&
		prevProps.throughputGauge === nextProps.throughputGauge &&
		prevProps.totalThroughput === nextProps.totalThroughput &&
		prevProps.outputThroughput === nextProps.outputThroughput &&
		prevProps.outputGauge === nextProps.outputGauge
		// prevProps.onUpdate === nextProps.onUpdate
	);
});

interface ActiveRecipeListProps {
	isGlobalRecipeDrawerOpen: boolean,
	handleGlobalRecipeDrawerOpen: () => void,
	isActiveRecipeDrawerOpen: boolean,
	handleActiveRecipeDrawerOpen: () => void,
	activeRecipeDrawerWidth: number,
}

interface AppropriateDrawerTypeProps {
	children: React.ReactNode;
	open: boolean;
	activeRecipeDrawerWidth: number;
}

const AppropriateDrawerType: React.FC<AppropriateDrawerTypeProps> = ({children, open,  activeRecipeDrawerWidth}) => {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

	if (isMobile) {
		return (
			<Drawer
				anchor="right"
				open={open}
				sx={{
					// display: 'flex',
					// overflowY: 'auto',
					// flexShrink: 0,
					// pt: theme.mixins.toolbar.minHeight,
					[`& .MuiDrawer-paper`]: {
						width: '100%',
						height: '100vh',
						boxSizing: 'border-box',
					},
				}}
			>
				{children}
			</Drawer>

		)
	} else {
		return (
			<Drawer
				variant="permanent"
				anchor="left"
				sx={{
					width: isMobile ? '100%' : activeRecipeDrawerWidth,
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
				{children}
			</Drawer>
		)
	}
}

const DrawerHeader = styled('div')(({theme}) => ({
	display: 'flex',
	alignItems: 'center',
	padding: theme.spacing(0, 1),
	// necessary for content to be below app bar
	...theme.mixins.toolbar,
	justifyContent: 'center',
}));

const CalculateProductionThroughput = (data: OptimizationResult) => {
	const totalProductThroughput = Object.values(data.production_line).reduce((count: number, productionTarget: {
		recipe_data: RecipeDetail;
		scale: number;
	}) => {
		if (productionTarget) {
			const scale = productionTarget.scale;
			const mD = productionTarget.recipe_data.manufactoring_duration;
			const recipeProductItemVolume = productionTarget.recipe_data.products?.reduce((count: number, recipeProductItem: RecipeItem) => {
				if (recipeProductItem) {
					const mdFloat = parseFloat(mD)
					return count + recipeProductItem.amount * scale * (60 / mdFloat);
				} else {
					return 0;
				}
			}, 0)
			return recipeProductItemVolume ? count + recipeProductItemVolume : count;
		} else {
			return count;
		}
	}, 0);

	const totalRawInput = data.raw_resource_usage.reduce((count: number, rawResource: {
		item_id: number,
		total_quantity: number,
	}) => {
		if (rawResource) {
			return count + rawResource.total_quantity;
		} else {
			return count
		}
	}, 0);

	return totalProductThroughput + totalRawInput
}


const ActiveRecipeList: React.FC<ActiveRecipeListProps> = ({
																														 isGlobalRecipeDrawerOpen,
																														 handleGlobalRecipeDrawerOpen,
																														 activeRecipeDrawerWidth,
																														 isActiveRecipeDrawerOpen,
																														 handleActiveRecipeDrawerOpen
																													 }) => {
	const {recipesGroupedDetail, loading} = useAppStaticData();
	const {activeTabId, optimizationResults, calculatingResult} = useProductionLineState()
	const [fallbackNumberOfRecipesToRender, setFallbackNumberOfRecipesToRender] = useState<number>(10);
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
	// const [maxThrouhgput, setMaxThroughput] = useState<number>(0);

	const activeRecipes = useMemo(() => {
		if (!activeTabId || loading || !optimizationResults[activeTabId] || !recipesGroupedDetail) return [];

		let maxThroughput = 0;

		const totalItemThroughput = CalculateProductionThroughput(optimizationResults[activeTabId]);

		// const p_line_objects = Object.values(graph.production_line)
		const nonNormalizedActiveRecipes = Object.entries(optimizationResults[activeTabId].production_line).map(([recipe_id, {
			recipe_data,
			scale
		}]) => {
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

			const selectedPrimaryItem = selectedRecipe.products?.reduce((selectedProduct: ({
				product: RecipeItem,
				throughput: number
			} | null), product: RecipeItem) => {
				if (product) {
					const currentThroughput = product.amount * 60 * scale / parseFloat(selectedRecipe.manufactoring_duration);
					if (selectedProduct !== null) {
						const selectedThroughput = selectedProduct["throughput"]
						if (currentThroughput > selectedThroughput) {
							return {
								product: product,
								throughput: currentThroughput
							};
						} else {
							return selectedProduct;
						}
					} else {
						return {
							product: product,
							throughput: currentThroughput,
						}
					}
				} else {
					return null
				}
			}, null)


			const outputThroughput = optimizationResults[activeTabId].target_output.find((target_output) => {
				return selectedPrimaryItem?.product.id === target_output.item_id
			})?.amount || 0;

			const selectedOutputGauge = outputThroughput ? outputThroughput / totalItemThroughput : 0;
			const selectedThroughput = selectedPrimaryItem ? (selectedPrimaryItem["throughput"] - outputThroughput) / totalItemThroughput : 0;
			maxThroughput = selectedThroughput > maxThroughput ? selectedThroughput : maxThroughput;
			maxThroughput = selectedOutputGauge > maxThroughput ? selectedOutputGauge : maxThroughput;

			return {
				selectedRecipe,
				remainingRecipes,
				recipeGroupName: recipeGroup.standard_product_display_name,
				throughputGauge: selectedThroughput,
				totalThroughput: selectedPrimaryItem?.throughput || 0,
				outputThroughput: outputThroughput,
				outputGauge: selectedOutputGauge,
			};
		}).filter((item): item is {
			selectedRecipe: RecipeDetail;
			remainingRecipes: (RecipeDetail | undefined)[];
			recipeGroupName: string;
			throughputGauge: number;
			totalThroughput: number;
			outputThroughput: number;
			outputGauge: number
		} => item !== null); // Remove null entries

		setFallbackNumberOfRecipesToRender(nonNormalizedActiveRecipes.length)

		return nonNormalizedActiveRecipes.map((nonNormalizedActiveRecipe) => {
			return {
				...nonNormalizedActiveRecipe,
				throughputGauge: nonNormalizedActiveRecipe.throughputGauge / maxThroughput,
				outputGauge: nonNormalizedActiveRecipe.outputGauge / maxThroughput
			}
		}).sort((a, b) => b.totalThroughput - a.totalThroughput)
	}, [optimizationResults, recipesGroupedDetail, activeTabId]);

	return (
		<AppropriateDrawerType open={isActiveRecipeDrawerOpen} activeRecipeDrawerWidth={activeRecipeDrawerWidth}
		>
			<Toolbar/>
			<DrawerHeader>
				<Stack direction="row" sx={{width: '100%', display: 'flex', justifyContent: "space-between", alignItems: 'center'}}>
					{!isGlobalRecipeDrawerOpen && <IconButton
              color="inherit"
              aria-label="open drawer"
              onClick={handleGlobalRecipeDrawerOpen}
              // edge="start"
              // sx={{
							// 	position: 'fixed',
							// 	left: '10px',
							// }}
          >
              <MenuIcon/>
          </IconButton>
					}
					<Typography >Active Recipes</Typography>
					{isMobile ?
              <IconButton onClick={handleActiveRecipeDrawerOpen}>
                  <KeyboardArrowRightIcon/>
              </IconButton>
						:
						<Box sx={{width: "32px"}}></Box>
					}
				</Stack>
			</DrawerHeader>
			<Divider/>

			<List sx={{
				overflow: 'auto',
				'::-webkit-scrollbar': {width: '4px'},
				'::-webkit-scrollbar-track': {},
				'::-webkit-scrollbar-thumb': {
					backgroundColor: '#939393', // Indicator color
					borderRadius: '10px'
				},
			}}
			>

				{!(loading || calculatingResult || (!activeRecipes || activeRecipes?.length === 0)) ? activeRecipes.map(({
																																																											selectedRecipe,
																																																											remainingRecipes,
																																																											recipeGroupName,
																																																											throughputGauge,
																																																											totalThroughput,
																																																											outputThroughput,
																																																											outputGauge
																																																										}) => (
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
									throughputGauge={throughputGauge}
									totalThroughput={totalThroughput}
									outputThroughput={outputThroughput}
									outputGauge={outputGauge}
								/>
							</ListItem>
						))
						: calculatingResult ?
						Array.from({length: fallbackNumberOfRecipesToRender}).map((_, index) => (
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

						)) : <></>
				}
			</List>
		</AppropriateDrawerType>
	);
};

export default ActiveRecipeList;
