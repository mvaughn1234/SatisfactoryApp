import {Box} from "@mui/material";
import React from 'react';
import Header from "../components/Header.tsx";

const MainLayout: React.FC = ({children}) => {
	return (
		<Box sx={{display: 'flex', flexDirection: 'column', height: '100vh'}}>
			<Header/>
			{children}
		</Box>
	);
};

export default MainLayout;