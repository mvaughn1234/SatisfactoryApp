import {AppBar, Toolbar, Typography} from '@mui/material';
import React from 'react';
import ColorModeIconDropdown from "../theme/ColorModeIconDropdown.tsx";

const Header: React.FC = () => {
	return (
		<AppBar position="static" sx={{zIndex: (theme) => theme.zIndex.drawer + 1}}>
			<Toolbar>
				<Typography variant="h6" sx={{flexGrow: 1}}>
					Calculator
				</Typography>
				{/*<IconButton color="inherit">*/}
					<ColorModeIconDropdown/>
				{/*</IconButton>*/}
			</Toolbar>
		</AppBar>
	);
};

export default Header;
