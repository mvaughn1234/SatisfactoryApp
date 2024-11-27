import MenuIcon from "@mui/icons-material/Menu";
import {Box, Drawer, IconButton} from "@mui/material";
import Divider from "@mui/material/Divider";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import Skeleton from "@mui/material/Skeleton";
import {styled} from "@mui/material/styles";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import React from 'react';
import {useAppContext} from "../store/AppContext";
import theme from "../theme/theme.ts";
import ActiveRecipeWrapper from "./ActiveRecipeWrapper.tsx";

// Memoize ActiveRecipeWrapper to prevent unnecessary re-renders
const MemoizedActiveRecipeWrapper = React.memo(ActiveRecipeWrapper, (prevProps, nextProps) => {
	// Return true if the props haven't changed to avoid re-rendering
	return (
		prevProps.standard_product_display_name === nextProps.standard_product_display_name &&
		prevProps.standard === nextProps.standard &&
		prevProps.alternate === nextProps.alternate
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
	const {recipesGroupedDetail, loadingRecipesGroupedDetail} = useAppContext();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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
			< Toolbar / >
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
						!loadingRecipesGroupedDetail ? recipesGroupedDetail.map((recipe) => (
								<ListItem disablePadding sx={{
									display: 'flex',
									flexDirection: 'column',
									justifyContent: 'flex-start',
									alignItems: 'flex-start'
								}}>
									<MemoizedActiveRecipeWrapper
										key={`${recipe.standard_product_display_name}`}
										standard_product_display_name={recipe.standard_product_display_name}
										standard={recipe.standard}
										alternate={recipe.alternate}
									/>
								</ListItem>
							))
							:
							Array.from({length: 12}).map((_, index) => (
								<ListItem>
									<Skeleton
										key={index}
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
)
;
};

export default ActiveRecipeList;
