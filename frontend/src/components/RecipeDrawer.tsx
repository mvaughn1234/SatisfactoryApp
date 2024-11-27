import Stack from "@mui/material/Stack";
import React from "react";
import ActiveRecipeList from "./ActiveRecipeList.tsx";
import AllRecipesList from "./AllRecipesList.tsx";

const RecipeDrawer: React.FC = () => {
	return (
		<Stack spacing={2} sx={{
			display: 'flex',
			justifyContent: 'space-between',
		}}>
			<ActiveRecipeList/>
			<AllRecipesList/>
		</Stack>
	);
}

export default RecipeDrawer;