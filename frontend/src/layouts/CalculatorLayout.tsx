// ./src/layouts/CalculatorLayout
import ListAltIcon from '@mui/icons-material/ListAlt';
import {Box, Fab, Tab, Tabs} from "@mui/material";
import Grid from "@mui/material/Grid2";
import Skeleton from "@mui/material/Skeleton";
import {styled, useTheme} from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
// import useMediaQuery from "@mui/material/useMediaQuery";
import React, {useEffect, useState} from 'react';
import ActiveRecipeList from "../components/ActiveRecipeList.tsx";
import D3GlobalResourceLimitViz from "../components/graphs/D3GlobalResourceLimitViz.tsx";
import D3RawPieChartContainer from "../components/graphs/D3RawPieChart.tsx";
import D3SnakeyGraphContainer from "../components/graphs/D3SankeyGraph.tsx";
import D3NewResourceUseGraphContainer from "../components/graphs/NewD3ResourceUseGraph.tsx";
import LoadingCalculationBar from "../components/LoadingCalculationBar.tsx";
import ProductionTargetsGroup from "../components/ProductionTargetsGroup.tsx";
import RecipeDrawer from "../components/RecipeDrawer.tsx";
import {useProductionLineState, useProductionLineUpdate} from "../store/ProductionLineContext.tsx";


// Define drawer width here for consistency
const globalRecipeDrawerWidth = 300;
const activeRecipeDrawerWidth = 300;
// const totalDrawerWidth = globalRecipeDrawerWidth + activeRecipeDrawerWidth;

const Item = styled(Box)(({theme}) => ({
	// backgroundColor: '#fff',
	// ...theme.typography.body2,
	borderRadius: 8,
	border: '1px solid',
	borderColor: theme.palette.grey[200],
	padding: theme.spacing(1),
	margin: theme.spacing(2),
	textAlign: 'center',
	// backgroundColor: theme.palette.background.paper,
	...theme.applyStyles('dark', {
		borderColor: theme.palette.grey[700],
	}),
}));
const CalculatorLayout: React.FC = () => {
	const {productionLines, activeTabId, loadingState, calculatingResult, optimizationResults} = useProductionLineState();
	const {handleTabChange, addProductionLine} = useProductionLineUpdate();
	const [drawerOpen, setDrawerOpen] = useState(false);
	const [activeRecipeListOpen, setActiveRecipeListOpen] = useState<boolean>(false);
	const [graphHeight, setGraphHeight] = useState<number>(500);
	const [displayLoading, setDisplayLoading] = useState<boolean>(true);
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

	useEffect(() => {
		if (isMobile) {
			setGraphHeight(300)
		} else {
			setGraphHeight(500)
		}
	}, [isMobile])

	useEffect(() => {
		setDisplayLoading(true)
	}, [])

	useEffect(() => {
		if (!calculatingResult) {
			setDisplayLoading(false)
		}
	}, [calculatingResult])
	// const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

	const handleDrawerOpen = () => {
		setDrawerOpen(true);
	}

	const handleDrawerClose = () => {
		setDrawerOpen(false);
	}

	const handleActiveRecipeListToggle = () => {
		setActiveRecipeListOpen(!activeRecipeListOpen);
	}

	const handleChangeTab = (_: React.SyntheticEvent, newValue: number) => {
		handleTabChange(`${newValue}`);  // Update active tab in global state
	};

	const handleAddTab = () => {
		addProductionLine(`Production Line ${productionLines.length}`);
	};

	return (
		<Box sx={{
			flex: 1,
			display: 'flex',
			overflow: 'hidden',
			// display: 'flex',
			// flexDirection: 'column',
			// width: '100%',
			// height: '100vh',
			// overflow: 'hidden', // Prevent unintended overflow

		}}>
			{isMobile &&
					<Fab sx={{position: 'absolute', bottom: '10px', right: '10px', backgroundColor: theme.palette.primary.main}} onClick={handleActiveRecipeListToggle}>
							<ListAltIcon/>
					</Fab>
			}
			{/*Drawer to configure global recipe knowledge */}

			<ActiveRecipeList
				isGlobalRecipeDrawerOpen={drawerOpen}
				handleGlobalRecipeDrawerOpen={handleDrawerOpen}
				activeRecipeDrawerWidth={activeRecipeDrawerWidth}
				isActiveRecipeDrawerOpen={activeRecipeListOpen}
				handleActiveRecipeDrawerOpen={handleActiveRecipeListToggle}
			/>
			<RecipeDrawer
				open={drawerOpen}
				drawerClose={handleDrawerClose}
				globalRecipeDrawerWidth={globalRecipeDrawerWidth}
			/>

			<Box
				sx={{
					flex: 1,
					display: 'flex',
					flexDirection: 'column',
					// width: isMobile ? '100%' : 'auto',
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
				{(!loadingState && activeTabId) &&
                <Tabs
                    value={parseInt(activeTabId, 10)}
                    onChange={handleChangeTab}
                    sx={{borderBottom: 1, borderColor: 'divider'}}
                    variant="scrollable"
                    scrollButtons
                >
									{Object.values(productionLines).map((line) => (
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
					sx={{px: 2, pt: 2}}
				>
					<ProductionTargetsGroup/>
				</Box>
				{calculatingResult && <LoadingCalculationBar />}

				<Box sx={{
					flexGrow: 1
				}}>
					<Grid container spacing={1} columns={{xs: 12}}>
						{/*/!* Main Graph - Takes 9/12 of the Grid *!/*/}
						<Grid size={{xs: 12, sm: 12, md: 12, lg: 12, xl: 8}}>
							<Item>
								{/*<Box sx={{width: "100%", height: "100%"}}>*/}

								{!displayLoading ? (activeTabId && optimizationResults[activeTabId]?.production_line ? (
									<D3SnakeyGraphContainer data={optimizationResults[activeTabId]} maxHeight={graphHeight}/>
								) : (
									<Skeleton
										variant="rectangular"
										width="auto"
										height={graphHeight}
										animation={false}
									/>
								)) : (
									<Skeleton
										variant="rectangular"
										width="auto"
										height={graphHeight}
										animation="wave"
									/>
								)}
								{/*</Box>*/}
							</Item>
						</Grid>

						{/* Resource Use Graph - Takes 3/12 of the Grid */}
						<Grid size={{xs: 12, sm: 12, md: 6, lg: 4, xl: 4}}>
							<Item>
								{/*<Box sx={{width: "100%", height: "100%"}}>*/}
								{!displayLoading ? (activeTabId && optimizationResults[activeTabId]?.production_line ? (
									<D3NewResourceUseGraphContainer data={optimizationResults[activeTabId]} maxHeight={graphHeight}/>
								) : (
									<Skeleton
										variant="rectangular"
										width="auto"
										height={graphHeight}
										animation={false}
									/>
								)) : (
									<Skeleton
										variant="rectangular"
										width="auto"
										height={graphHeight}
										animation="wave"
									/>
									)}
								{/*</Box>*/}
							</Item>
						</Grid>

						{/* Resource Use Graph - Takes 3/12 of the Grid */}
						<Grid size={{xs: 12, sm: 12, md: 6, lg: 4, xl: 4}}>
							<Item>
								{/*<Box sx={{width: "100%", height: "100%"}}>*/}
								{!displayLoading ? (activeTabId && optimizationResults[activeTabId]?.production_line ? (
									<D3RawPieChartContainer data={optimizationResults[activeTabId]} maxHeight={graphHeight}/>
								) : (
									<Skeleton
										variant="rectangular"
										width="auto"
										height={graphHeight}
										animation={false}
									/>
								)) : (
									<Skeleton
										variant="rectangular"
										width="auto"
										height={graphHeight}
										animation="wave"
									/>
								)}
								{/*</Box>*/}
							</Item>
						</Grid>

						{/* Resource Use Graph - Takes 3/12 of the Grid */}
						<Grid size={{xs: 12, sm: 12, md: 6, lg: 4, xl: 4}}>
							<Item>
								{/*<Box sx={{width: "100%", height: "100%"}}>*/}
								{!displayLoading ? (activeTabId && optimizationResults[activeTabId]?.production_line ? (
									<D3GlobalResourceLimitViz data={optimizationResults[activeTabId]} maxHeight={graphHeight}/>
								) : (
									<Skeleton
										variant="rectangular"
										width="auto"
										height={graphHeight}
										animation={false}
									/>
								)) : (
									<Skeleton
										variant="rectangular"
										width="auto"
										height={graphHeight}
										animation="wave"
									/>
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