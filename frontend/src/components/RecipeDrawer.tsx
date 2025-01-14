// ./src/components/RecipeDrawer.tsx
import {ChevronLeft as ChevronLeftIcon, ExpandLess, StarBorder} from '@mui/icons-material';
import TuneIcon from '@mui/icons-material/Tune';
import {Divider, Drawer, IconButton, List, ListItemButton, ListItemIcon, ListItemText} from '@mui/material';
import Collapse from "@mui/material/Collapse";
import Skeleton from '@mui/material/Skeleton';
import Stack from "@mui/material/Stack";
import {styled, useTheme} from "@mui/material/styles";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import {debounce} from "lodash";
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {useSelector} from 'react-redux';
import {useDebounce} from "../hooks/useDebounce.ts";
import {usePreferredRecipe} from "../hooks/usePreferredRecipe.ts";
import {useAppStaticData} from "../store/AppStaticDataStore.tsx";
import {useProductionLineState} from "../store/ProductionLineContext.tsx";
import {RootState} from "../store/recipeConfigsStore.ts";
import {recipeConfigsSelectors} from "../store/recipeSlice.ts";
import LoadingCalculationBar from "./LoadingCalculationBar.tsx";
import RecipeListVirtualized from "./RecipeListVirtualized.tsx";
import RecipeSearchBar from "./RecipeSearchBar.tsx";
import { createSelector } from '@reduxjs/toolkit';



const DrawerHeader = styled('div')(({theme}) => ({
	display: 'flex',
	alignItems: 'center',
	padding: theme.spacing(0, 1),
	...theme.mixins.toolbar,
	justifyContent: 'flex-end',
}));

const RecipeDrawer: React.FC<{ open: boolean; drawerClose: () => void, globalRecipeDrawerWidth: number }> = ({
																																																							 open,
																																																							 drawerClose,
																																																							 globalRecipeDrawerWidth
																																																						 }) => {
	const [configOpen, setConfigOpen] = useState(false);
	const [searchValue, setSearchValue] = useState('');
	const [debouncedSearchValue, setDebouncedSearchValue] = useState('');
	// const [searchFilters, setSearchFilters] = useState<{
	// 	known: boolean;
	// 	knownIndeterminate: boolean;
	// 	excluded: boolean;
	// 	excludedIndeterminate: boolean;
	// 	preferred: boolean;
	// 	preferredIndeterminate: boolean;
	// }>({
	// 	known: false,
	// 	knownIndeterminate: true,
	// 	excluded: false,
	// 	excludedIndeterminate: true,
	// 	preferred: false,
	// 	preferredIndeterminate: true
	// })

	const {loading, recipesComponentsDetail} = useAppStaticData();
	const loadingRecipeConfigs = useSelector((state: RootState) => state.recipes.loading);
	const {calculatingResult} = useProductionLineState()
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
	const [listHeight, setListHeight] = useState(window.innerHeight);

	useEffect(() => {
		const handleResize = () => {
			// Calculate the available height for the FixedSizeList
			const drawerPadding = 32; // Adjust based on your Drawer padding/margin
			const availableHeight = window.innerHeight - drawerPadding;
			setListHeight(availableHeight);
		};

		// Initialize height
		handleResize();

		// Listen for window resize
		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, []);

	// Create a debounced version of the search value updater
	const debouncedUpdate = useCallback(
		debounce((value) => {
			setDebouncedSearchValue(value);
		}, 300), // Adjust the debounce delay as needed
		[]
	);

	// Update the debounced value whenever the search value changes
	useEffect(() => {
		debouncedUpdate(searchValue);
		return debouncedUpdate.cancel; // Cleanup debounce on unmount
	}, [searchValue, debouncedUpdate]);



	// const onFilterSearch = (filters: {
	// 	known: boolean;
	// 	knownIndeterminate: boolean;
	// 	excluded: boolean;
	// 	excludedIndeterminate: boolean;
	// 	preferred: boolean;
	// 	preferredIndeterminate: boolean;
	// }) => {
	// 	setSearchFilters({
	// 		known: filters.known,
	// 		knownIndeterminate: filters.knownIndeterminate,
	// 		excluded: filters.excluded,
	// 		excludedIndeterminate: filters.excludedIndeterminate,
	// 		preferred: filters.preferred,
	// 		preferredIndeterminate: filters.preferredIndeterminate
	// 	})
	// }

	const filteredRecipes = useMemo(() => {
		if (!recipesComponentsDetail) return [];

		return recipesComponentsDetail.filter((recipe) => {
			if (!debouncedSearchValue) return true;
			return recipe.display_name.toLowerCase().includes(debouncedSearchValue.toLowerCase());
		});
	}, [recipesComponentsDetail, debouncedSearchValue]);

	const handleClick = () => {
		setConfigOpen(!configOpen);
	}
	return (
		<Drawer
			open={open}
			anchor="left"
			variant='temporary'
			sx={{
				flexShrink: 0,
				width: globalRecipeDrawerWidth,
				[`& .MuiDrawer-paper`]: {
					width: globalRecipeDrawerWidth,
					boxSizing: 'border-box',
					...(isMobile && {position: 'fixed', zIndex: 1300}),
				},
			}}
		>
			<Toolbar/>
			<DrawerHeader>
				<Typography sx={{pr: 7}}>All Recipes</Typography>
				<IconButton onClick={() => {
					// syncUpdatesToDatabase();
					drawerClose();
				}}>
					<ChevronLeftIcon/>
				</IconButton>
			</DrawerHeader>

			<Divider/>

			{/* 1) Search Bar */}
			<RecipeSearchBar
				searchValue={searchValue}
				onSearchChange={setSearchValue}
				// onFilterSearch={onFilterSearch}
				// If you had grouping toggles, you'd pass them as well.
			/>

			{/*/!* 2) Config Section *!/*/}
			{/*<List sx={{ width: '100%', bgcolor: 'background.paper' }} component="nav">*/}
			{/*	<ListItemButton onClick={handleClick}>*/}
			{/*		<ListItemIcon>*/}
			{/*			{!configOpen ? <TuneIcon /> : <ExpandLess />}*/}
			{/*		</ListItemIcon>*/}
			{/*		<ListItemText primary="Config" />*/}
			{/*	</ListItemButton>*/}
			{/*	<Collapse in={configOpen} timeout="auto" unmountOnExit>*/}
			{/*		<List component="div" disablePadding>*/}
			{/*			<ListItemButton sx={{ pl: 4 }}>*/}
			{/*				<ListItemIcon>*/}
			{/*					<StarBorder />*/}
			{/*				</ListItemIcon>*/}
			{/*				<ListItemText primary="Starred" />*/}
			{/*			</ListItemButton>*/}
			{/*		</List>*/}
			{/*	</Collapse>*/}
			{/*</List>*/}

			<Divider/>
			{calculatingResult && <LoadingCalculationBar/>}
			{/* 3) Virtualized Recipe List or Skeleton */}
			{!loading && !loadingRecipeConfigs ? (
				<RecipeListVirtualized
					recipes={filteredRecipes}
					height={listHeight}           // Adjust based on your layout
					width={globalRecipeDrawerWidth - 10} // small offset for scrollbar
				/>
			) : (
				<Stack spacing={1} sx={{p: 1}}>
					{Array.from({length: 30}).map((_, index) => (
						<Skeleton
							key={index}
							variant="rectangular"
							width="222px"
							height={35}
							animation="wave"
						/>
					))}
				</Stack>
			)}
		</Drawer>
	);
};

export default RecipeDrawer;
