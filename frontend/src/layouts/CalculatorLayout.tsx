import {Box, Tab, Tabs} from "@mui/material";
import Grid from "@mui/material/Grid2";
import {styled, useTheme} from "@mui/material/styles";
// import useMediaQuery from "@mui/material/useMediaQuery";
import React, {useState} from 'react';
import ActiveRecipeList from "../components/ActiveRecipeList.tsx";
import GlobalRecipeDrawer from "../components/GlobalRecipeDrawer.tsx";
import D3GlobalResourceLimitViz from "../components/graphs/D3GlobalResourceLimitViz.tsx";
import D3Graph from "../components/graphs/D3Graph.tsx";
import D3ResourceUseGraph from "../components/graphs/D3ResourceUseGraph.tsx";
import ProductionTargetsGroup from "../components/ProductionTargetsGroup.tsx";
import {useProductionLineState, useProductionLineUpdate} from "../store/ProductionLineContext.tsx";


// Define drawer width here for consistency
const globalRecipeDrawerWidth = 240;
const activeRecipeDrawerWidth = 300;
const graphHeight = 400;
// const totalDrawerWidth = globalRecipeDrawerWidth + activeRecipeDrawerWidth;

const Item = styled(Box)(({theme}) => ({
	// backgroundColor: '#fff',
	// ...theme.typography.body2,
	padding: theme.spacing(1),
	textAlign: 'center',
	color: theme.palette.text.secondary,
	...theme.applyStyles('dark', {
		backgroundColor: theme.palette.background.paper,
	}),
}));


const CalculatorLayout: React.FC = () => {
	const {productionLines, activeTabId, loadingProductionLines, optimizedLineData} = useProductionLineState();
	const {setActiveTabId, addProductionLine} = useProductionLineUpdate();
	const [drawerOpen, setDrawerOpen] = useState(false);
	const theme = useTheme();

	// const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

	const handleDrawerOpen = () => {
		setDrawerOpen(true);
	}

	const handleDrawerClose = () => {
		setDrawerOpen(false);
	}

	const handleTabChange = (_: React.SyntheticEvent, newValue: string) => {
		setActiveTabId(`${newValue}`);  // Update active tab in global state
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
				{!loadingProductionLines &&
            <Tabs
                value={parseInt(activeTabId, 10)}
                onChange={handleTabChange}
                sx={{borderBottom: 1, borderColor: 'divider'}}
            >
							{productionLines.map((line) => (
								<Tab key={line.id} label={line.name} value={parseInt(line.id, 10)}/>
							))}
                <Tab
                    label="+"
                    onClick={handleAddTab}
									// disabled // Prevent it from being selectable
                    sx={{cursor: 'pointer'}}
                />
            </Tabs>
				}

				<Box
					sx={{p: 2, borderBottom: `1px solid ${theme.palette.divider}`, overflow: 'auto'}}
				>
					<ProductionTargetsGroup/>
				</Box>

				<Box sx={{flexGrow: 1}}>
					<Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 4, sm: 8, md: 12, lg: 16, xl: 20 }}>
						{/* Main Graph - Takes 9/12 of the Grid */}
						<Grid size={{ xs: 4, sm: 8, md: 12, lg: 12, xl: 12 }}>
							<Item>
								{/*<Box sx={{width: "100%", height: "100%"}}>*/}

									{optimizedLineData ? (
										<D3Graph data={optimizedLineData} height={graphHeight}/>
									) : (
										"No data available"
									)}
								{/*</Box>*/}
							</Item>
						</Grid>

						{/* Resource Use Graph - Takes 3/12 of the Grid */}
						<Grid size={{ xs: 4, sm: 6, md: 6, lg: 4, xl: 8 }}>
							<Item>
								{/*<Box sx={{width: "100%", height: "100%"}}>*/}
									{optimizedLineData ? (
										<D3ResourceUseGraph data={optimizedLineData} maxHeight={graphHeight}/>
									) : (
										"No data available"
									)}
								{/*</Box>*/}
							</Item>
						</Grid>

						{/* Resource Use Graph - Takes 3/12 of the Grid */}
						<Grid size={{ xs: 4, sm: 6, md: 6, lg: 4, xl: 8 }}>
							<Item>
								{/*<Box sx={{width: "100%", height: "100%"}}>*/}
									{optimizedLineData ? (
										<D3GlobalResourceLimitViz data={optimizedLineData} maxHeight={graphHeight}/>
									) : (
										"No data available"
									)}
								{/*</Box>*/}
							</Item>
						</Grid>
					</Grid>
				</Box>
			</Box>
		</Box>
	);
}

export default CalculatorLayout;