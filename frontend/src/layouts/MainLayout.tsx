import React
import {Box, CssBaseline, Tab, Tabs} from "@mui/material";
import AppTheme from "../../shared-theme/AppTheme.tsx";
import Header from "../components/Header.tsx";
import Nothing from "../components/Nothing.tsx";
import ProductionTargetsGroup from "../components/ProductionTargetsGroup.tsx";
import RecipeDrawer from "../components/RecipeDrawer.tsx";
import {useAppContext} from "../store/AppContext.tsx"; form 'react';

const MainLayout = React.FC = () => {
	const {productionLines, activeTabId, setActiveTabId, addProductionLine} = useAppContext();

	const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
		setActiveTabId(newValue);  // Update active tab in global state
	};

	const handleAddTab = () => {
		addProductionLine(`Production Line ${productionLines.length}`);
	};

	return (
		<AppTheme disableCustomTheme={disableCustomTheme}>
			<>
				<CssBaseline/>
				<Box
					component="main"
					sx={(theme) => ({
						display: 'flex',
						flexDirection: 'column',
						height: '100vh',
						// backgroundColor: theme.vars
						// 	? `rgba(${theme.vars.palette.background.defaultChannel} / 1)`
						// 	: alpha(theme.palette.background.default, 1),
						overflow: 'auto',
					})}
				>
					<Header/>

					{/* Tabs for production lines */}
					<Tabs value={activeTabId} onChange={handleTabChange} sx={{
						borderBottom: 1,
						borderColor: 'divider',
						display: 'flex',
						justifyContent: 'flex-start',
						flexDirection: 'row'
					}}
					>
						{productionLines.map((line) => (
							<Tab key={line.id} label={line.name} value={line.id}/>
						))}
						<Tab label={'+'} value={false} onClick={handleAddTab}/>
					</Tabs>

					{/* Main content section */}
					<Box sx={{display: 'flex', flexGrow: 1, overflow: 'hidden'}}>
						<Nothing />
						<RecipeDrawer/>

						<Box sx={{flex: '0 0 300px', padding: 2}}>
							<ProductionTargetsGroup/>
						</Box>
					</Box>
				</Box>
			</>
		</AppTheme>
	);
}

export default MainLayout