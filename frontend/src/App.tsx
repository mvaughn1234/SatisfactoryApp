import {Box, CssBaseline} from '@mui/material';
import React from 'react';
import {BrowserRouter as Router, Route, Routes} from "react-router-dom";
import AppTheme from "./theme/AppTheme.tsx";
import CalculatorLayout from "./layouts/CalculatorLayout.tsx";
import MainLayout from "./layouts/MainLayout.tsx";

// Props interface for the App component
interface AppProps {
	disableCustomTheme?: boolean;
}

const App: React.FC<AppProps> = ({disableCustomTheme = false}) => {
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
