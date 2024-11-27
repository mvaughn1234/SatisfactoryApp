import {Box, Tab, Tabs} from "@mui/material";
import Stack from "@mui/material/Stack";
import {useTheme} from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import React, {useState} from 'react';
import ActiveRecipeList from "../components/ActiveRecipeList.tsx";
import GlobalRecipeDrawer from "../components/GlobalRecipeDrawer.tsx";
import ProductionTargetsGroup from "../components/ProductionTargetsGroup.tsx";
import {useAppContext} from "../store/AppContext.tsx";

// Define drawer width here for consistency
const globalRecipeDrawerWidth = 240;
const activeRecipeDrawerWidth = 300;
const totalDrawerWidth = globalRecipeDrawerWidth + activeRecipeDrawerWidth;


const CalculatorLayout: React.FC = () => {
	const {productionLines, activeTabId, setActiveTabId, addProductionLine} = useAppContext();
	const [drawerOpen, setDrawerOpen] = useState(false);
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

	const handleDrawerOpen = () => {
		setDrawerOpen(true);
	}

	const handleDrawerClose = () => {
		setDrawerOpen(false);
	}

	const handleTabChange = (_: React.SyntheticEvent, newValue: string) => {
		setActiveTabId(newValue);  // Update active tab in global state
	};

	const handleAddTab = () => {
		addProductionLine(`Production Line ${productionLines.length}`);
	};

	return (
		<Box sx={{
			flex: 1,
			display: 'flex',
			overflow: 'hidden',
			// backgroundColor: 'yellow'
		}}>
			{/*Drawer to configure global recipe knowledge */}

			<ActiveRecipeList
				isRecipeDrawerOpen={drawerOpen}
				openRecipeDrawer={handleDrawerOpen}
				activeRecipeDrawerWidth={activeRecipeDrawerWidth}
			/>
			<GlobalRecipeDrawer
				open={drawerOpen}
				drawerClose={handleDrawerClose}
				globalRecipeDrawerWidth={globalRecipeDrawerWidth}
			/>

			<Box
				sx={{
					flex: 1,
					display: 'flex',
					flexDirection: 'column',
					// ml: !isMobile && drawerOpen ? `${drawerWidth}px` : '300px',
					overflowY: 'auto',
					// transition: theme.transitions.create('margin', {
					// 	easing: theme.transitions.easing.sharp,
					// 	duration: theme.transitions.duration.standard,
					// }),
					// pt: theme.mixins.toolbar.minHeight,
				}}
			>

				{/*	/!* Tabs for production lines *!/*/}
				<Tabs
					value={activeTabId}
					onChange={handleTabChange}
					sx={{borderBottom: 1, borderColor: 'divider'}}
				>
					{productionLines.map((line) => (
						<Tab key={line.id} label={line.name} value={line.id}/>
					))}
					<Tab label={'+'} value={false} onClick={handleAddTab}/>
				</Tabs>

				<Box
					sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}`, overflow: 'auto' }}
				>
					<ProductionTargetsGroup/>
				</Box>

				<Box sx={{ flex: 1, p: 2, overflowY: 'auto' }}>
					{/* Example of Dynamic Graphs */}
					{Array.from({length: 8}).map((_, index) => (
						<Box
							key={index}
							sx={{
								border: `1px solid ${theme.palette.divider}`,
								height: 200,
								mb: 2,
							}}
						>
							Graph {index + 1}
						</Box>
					))}
				</Box>

			</Box>
		</Box>
	);
}

export default CalculatorLayout;