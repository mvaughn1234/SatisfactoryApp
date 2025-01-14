// ./src/theme/theme.ts
import {createTheme, type ThemeOptions} from '@mui/material/styles';
import {colorSchemes, shadows, shape, typography} from "./customThemePrimitives.ts";


const theme = (themeComponents?: ThemeOptions['components']) => createTheme({
	colorSchemes, // Recently added in v6 for building light & dark mode app, see https://mui.com/material-ui/customization/palette/#color-schemes
	typography,
	shadows,
	shape,
	components: {
		...themeComponents,
	},
});

export default theme;