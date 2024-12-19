import * as React from 'react';
import {ThemeProvider, createTheme} from '@mui/material/styles';
import type {ThemeOptions} from '@mui/material/styles';
import theme from "./theme.ts";

interface AppThemeProps {
	children: React.ReactNode;
	/**
	 * This is for the docs site. You can ignore it or remove it.
	 */
	disableCustomTheme?: boolean;
	themeComponents?: ThemeOptions['components'];
}

export default function AppTheme({
																	 children,
																	 disableCustomTheme,
																	 themeComponents,
																 }: AppThemeProps) {
	const theme2 = React.useMemo(() => {
		return disableCustomTheme
			? createTheme()
			:
			theme(themeComponents)
	}, [disableCustomTheme, themeComponents]);
	// if (disableCustomTheme) {
	// 	return <React.Fragment>{children}</React.Fragment>;
	// }
	return (
		<ThemeProvider theme={theme2} disableTransitionOnChange>
			{children}
		</ThemeProvider>
	);
}
