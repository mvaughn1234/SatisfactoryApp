import {ExpandLess, ExpandMore} from "@mui/icons-material";
import Collapse from "@mui/material/Collapse";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import React, {useState} from "react";
import {RecipeDetail} from "../types/Recipe.ts";


import RecipeCard from "./RecipeCard.tsx";

interface ActiveRecipeWrapperProps {
	selectedRecipe: RecipeDetail;
	remainingRecipes: RecipeDetail[];
	recipeGroupName: string;
	onUpdate: (recipeId: number, statusType: string) => void;
}

const ActiveRecipeWrapper: React.FC<ActiveRecipeWrapperProps> = ({
																																	 selectedRecipe,
																																	 remainingRecipes,
																																	 recipeGroupName,
																																	 onUpdate
																																 }) => {
	// const [selectedRecipe, setSelectedRecipe] = useState<RecipeDetail>(standard);
	// const [remainingRecipes, setRemainingRecipes] = useState<RecipeDetail[] | []>([]);
	const [expanded, setExpanded] = useState<boolean>(false);

	// useEffect(() => {
	// 	if (standard && standard.id) {
	// 		setSelectedRecipe(standard)
	// 		setRemainingRecipes(alternate ? alternate : [])
	// 	} else {
	// 		if (alternate && (alternate.length > 0)) {
	// 			setSelectedRecipe(alternate[0])
	// 		}
	// 		if (alternate && (alternate.length > 1)) {
	// 			setRemainingRecipes(alternate.slice(1))
	// 		} else {
	// 			setRemainingRecipes([])
	// 		}
	// 	}
	// }, [alternate, standard]);

	const handleChange = () => {
		setExpanded(!expanded);
	};


	return (
		remainingRecipes?.length > 0 ?
			<React.Fragment>
				<ListItemButton onClick={handleChange} sx={{width: '100%', pl: 0}}>
					<RecipeCard
						root_component={recipeGroupName}
						id={selectedRecipe?.id}
						display_name={selectedRecipe.display_name}
						class_name={selectedRecipe.class_name}
						ingredients={selectedRecipe.ingredients}
						products={selectedRecipe.products}
					/>
					{expanded ? <ExpandLess/> : <ExpandMore/>}
				</ListItemButton>
				<Collapse in={expanded} orientation="vertical" unmountOnExit sx={{width: '100%'}}>
					<List sx={{width: '100%'}}>
						{
							remainingRecipes.map((recipe, index) => (
								<ListItemButton
									key={index}
									sx={{pl: 4, width: '100%'}}
								>
									<RecipeCard
										root_component={recipeGroupName}
										id={recipe.id}
										display_name={recipe.display_name}
										class_name={recipe.class_name}
										ingredients={recipe.ingredients}
										products={recipe.products}
									/>
								</ListItemButton>
							))
						}
					</List>
				</Collapse>
			</React.Fragment>

			:
			selectedRecipe &&
        <RecipeCard
            root_component={recipeGroupName}
            id={selectedRecipe?.id}
            display_name={selectedRecipe.display_name}
            class_name={selectedRecipe.class_name}
            ingredients={selectedRecipe.ingredients}
            products={selectedRecipe.products}
						single={true}
        />
	)
		;
}

export default ActiveRecipeWrapper;