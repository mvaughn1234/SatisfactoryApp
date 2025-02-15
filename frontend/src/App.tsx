import {Box, CssBaseline, useTheme} from '@mui/material';
import React, {useEffect} from 'react';
import {useDispatch} from "react-redux";
import {BrowserRouter as Router, Route, Routes} from "react-router-dom";
import CalculatorLayout from "./layouts/CalculatorLayout.tsx";
import MainLayout from "./layouts/MainLayout.tsx";
import {fetchRecipes} from "./store/recipeSlice.ts";
import {AppDispatch} from "./store/recipeConfigsStore.ts";
import AppTheme from "./theme/AppTheme.tsx";

// Props interface for the App component
interface AppProps {
	disableCustomTheme?: boolean;
}

const App: React.FC<AppProps> = ({disableCustomTheme = false}) => {
	const theme = useTheme();
	const dispatch = useDispatch<AppDispatch>();

	useEffect(() => {
		dispatch(fetchRecipes());
	}, [dispatch]);

	return (
		<AppTheme disableCustomTheme={disableCustomTheme}>
			<>
				<CssBaseline/>
				<Box
					component="main"
					sx={
					// (theme) => (
							{
						display: 'flex',
						flexDirection: 'column',
						height: '100vh',
						// backgroundColor: theme.vars
						// 	? `rgba(${theme.vars.palette.background.defaultChannel} / 1)`
						// 	: alpha(theme.palette.background.default, 1),
						overflow: 'hidden',
					}
					// )
				}
				>
					<Router>
						<MainLayout>
							<Routes>
								<Route path="/" element={<CalculatorLayout/>}/>
							</Routes>
						</MainLayout>
					</Router>
				</Box>
			</>
		 </AppTheme>
	);
};

export default App;
