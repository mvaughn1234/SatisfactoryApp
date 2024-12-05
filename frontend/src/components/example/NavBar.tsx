import React from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import MenuIcon from '@mui/icons-material/Menu';
import { Drawer, List, ListItem, ListItemText } from '@mui/material';

const NavBar = () => {
	const [drawerOpen, setDrawerOpen] = React.useState(false);

	const toggleDrawer = () => {
		setDrawerOpen(!drawerOpen);
	};

	return (
		<>
			<AppBar position="static">
				<Toolbar>
					<IconButton
						edge="start"
						color="inherit"
						aria-label="menu"
						onClick={toggleDrawer}
					>
						<MenuIcon />
					</IconButton>
					<Typography variant="h6">
						Satisfactory Production Planner
					</Typography>
				</Toolbar>
			</AppBar>
			<Drawer open={drawerOpen} onClose={toggleDrawer}>
				<List>
					<ListItem button onClick={toggleDrawer}>
						<ListItemText primary="Recipes" />
					</ListItem>
					<ListItem button onClick={toggleDrawer}>
						<ListItemText primary="Dashboard" />
					</ListItem>
				</List>
			</Drawer>
		</>
	);
};

export default NavBar;
