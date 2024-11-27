import {Accordion, AccordionDetails, AccordionSummary} from "@mui/material";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Stack from "@mui/material/Stack";
import React, {useEffect, useState} from "react";
import {RecipeDetail, RecipeGroupDetail} from "../types/Recipe.ts";
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';

import RecipeCard from "./RecipeCard.tsx";

const ActiveRecipeWrapperMulti: React.FC<RecipeGroupDetail> = ({standard_product_display_name, standard, alternate}) => {
	const [selectedRecipe, setSelectedRecipe] = useState<RecipeDetail>(standard);
	const [remainingRecipes, setRemainingRecipes] = useState<RecipeDetail[] | []>();
	const [expanded, setExpanded] = useState<boolean>(false);

	useEffect(() => {
		if (standard && standard.id) {
			setSelectedRecipe(standard)
			setRemainingRecipes(alternate ? alternate : [])
		} else {
			if (alternate && (alternate.length > 0)) {
				setSelectedRecipe(alternate[0])
			}
			if (alternate && (alternate.length > 1)) {
				setRemainingRecipes(alternate.slice(1))
			} else {
				setRemainingRecipes([])
			}
		}
	}, []);

	const handleChange = (expand: boolean) => (event, isExpanded) => {
		setExpanded(expand);
	};


	return (
		{remainingRecipes?.length > 0 ? <ListItemButton></ListItemButton>
			:
			<ListItemText></ListItemText>
}
	<ListItemText
		slotProps={{transition: {unmountOnExit: true}}}
		onChange={handleChange(!expanded)}
		expanded={expanded}
	>
		<ListItemText>
			{selectedRecipe &&
          <RecipeCard
              root_component={standard_product_display_name}
              id={selectedRecipe?.id}
              display_name={selectedRecipe.display_name}
              class_name={selectedRecipe.class_name}
              ingredients={selectedRecipe.ingredients}
              products={selectedRecipe.products}
          />
			}
		</ListItemText>
		{(expanded && remainingRecipes?.length > 0) && (
			<AccordionDetails>
				<Stack>
					{
						remainingRecipes.map((recipe) => (
							<RecipeCard
								key={`${standard_product_display_name}.${recipe.id}`}
								root_component={standard_product_display_name}
								id={recipe.id}
								display_name={recipe.display_name}
								class_name={recipe.class_name}
								ingredients={recipe.ingredients}
								products={recipe.products}
							/>
						))
					}
				</Stack>
			</AccordionDetails>
		)}

	</ListItemText>
)
	;
}

export default ActiveRecipeWrapperMulti;