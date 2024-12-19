import {Box} from "@mui/material";
import React from 'react';
import Header from "../components/Header.tsx";

type MainLayoutProps = {
	children: React.ReactNode;
};

const MainLayout: React.FC<MainLayoutProps> = ({children}) => {
	return (
		<Box sx={{display: 'flex', flexDirection: 'column', height: '100vh'}}>
			<Header/>
			{children}
		</Box>
	);
};

export default MainLayout;