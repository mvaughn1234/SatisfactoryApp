// GlobalRecipeDrawer.tsx
import {ChevronLeft as ChevronLeftIcon, ExpandLess, StarBorder} from '@mui/icons-material';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import TuneIcon from '@mui/icons-material/Tune';
import {Divider, Drawer, IconButton, List, ListItemButton, ListItemIcon, ListItemText, TextField} from '@mui/material';
import Collapse from "@mui/material/Collapse";
import Skeleton from '@mui/material/Skeleton';
import Stack from "@mui/material/Stack";
import {styled} from "@mui/material/styles";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import React, {useState} from 'react';
import {useAppContext} from "../store/AppContext.tsx";
import {useRecipeConfigState, useRecipeConfigUpdate} from "../store/RecipeConfigStore.tsx";
import theme from "../theme/theme.ts";
import RecipeListItem from "./RecipeListItem.tsx";

// Memoize recipe item to prevent unnecessary re-renders
const MemoizedRecipeListItem = React.memo(RecipeListItem, (prevProps, nextProps) => {
	// Return true if the props haven't changed to avoid re-rendering
	return (
		prevProps.recipe === nextProps.recipe,
		prevProps.conf_known === nextProps.conf_known,
		prevProps.conf_excluded === nextProps.conf_excluded,
		prevProps.conf_preferred === nextProps.conf_preferred
	);
});


const DrawerHeader = styled('div')(({theme}) => ({
	display: 'flex',
	alignItems: 'center',
	padding: theme.spacing(0, 1),
	...theme.mixins.toolbar,
	justifyContent: 'flex-end',
}));

const GlobalRecipeDrawer: React.FC<{ open: boolean; drawerClose: () => void, globalRecipeDrawerWidth: number }> = ({open, drawerClose, globalRecipeDrawerWidth}) => {
	const [configOpen, setConfigOpen] = useState(false);
	const {loadingRecipeConfigs, recipeConfigs} = useRecipeConfigState();
	const {loadingRecipesComponentsDetail, recipesComponentsDetail} = useAppContext();
	// const {syncUpdatesToDatabase} = useRecipeConfigUpdate();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

	const handleClick = () => {
		setConfigOpen(!configOpen);
	}
	return (
		<Drawer
			open={open}
			anchor="left"
			// variant={isMobile ? 'temporary' : 'persistent'}
			variant='temporary'
			sx={{
				flexShrink: 0,
				width: globalRecipeDrawerWidth,
				[`& .MuiDrawer-paper`]: {
					width: globalRecipeDrawerWidth,
					boxSizing: 'border-box',
					...(isMobile && { position: 'fixed', zIndex: 1300 }),
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
				<List
					sx={{width: '100%', bgcolor: 'background.paper'}}
					component="nav"

				>
					<Stack direction="row">
						<TextField placeholder="search..."></TextField>
						<IconButton>
							<FilterAltIcon/>
						</IconButton>
					</Stack>
					<ListItemButton onClick={handleClick}>
						<ListItemIcon>
							{!configOpen ? <TuneIcon/> : <ExpandLess/>}
						</ListItemIcon>
						<ListItemText primary="Config"/>
						{/*{configOpen ? <ExpandLess /> : <ExpandMore />}*/}
					</ListItemButton>
					<Collapse in={configOpen} timeout="auto" unmountOnExit>
						<List component="div" disablePadding>
							<ListItemButton sx={{pl: 4}}>
								<ListItemIcon>
									<StarBorder/>
								</ListItemIcon>
								<ListItemText primary="Starred"/>
							</ListItemButton>
						</List>
					</Collapse>
				</List>
				<Divider/>
				<List
					sx={{
						display: 'flex',
						flexDirection: 'column',
						overflow: 'auto'
					}}
				>
					{!(loadingRecipeConfigs && loadingRecipesComponentsDetail) ? recipesComponentsDetail.map((recipe) => (
							<MemoizedRecipeListItem
								key={recipe.id}
								recipe={recipe}
								conf_known={recipeConfigs[recipe.id].known || false}
								conf_excluded={recipeConfigs[recipe.id].excluded || false}
								conf_preferred={recipeConfigs[recipe.id].preferred || false}
							/>
						))
						:
						<Stack spacing={1}>
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
					}
				</List>
		</Drawer>
	);
};

export default GlobalRecipeDrawer;
