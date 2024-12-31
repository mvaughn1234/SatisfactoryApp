import {ExpandLess, ExpandMore} from "@mui/icons-material";
import Collapse from "@mui/material/Collapse";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import React, {useState} from "react";
import {RecipeDetail} from "../types/Recipe.ts";


import RecipeCard from "./RecipeCard.tsx";

interface ActiveRecipeWrapperProps {
	selectedRecipe: RecipeDetail;
	remainingRecipes: (RecipeDetail | undefined)[];
	recipeGroupName: string;
	throughputGauge: number;
	totalThroughput: number;
	// outputThroughput: number;
	outputGauge: number;
	// onUpdate: (recipeId: number, statusType: string) => void;
}

const ActiveRecipeWrapper: React.FC<ActiveRecipeWrapperProps> = ({
																																	 selectedRecipe,
																																	 remainingRecipes,
																																	 recipeGroupName,
																																	 throughputGauge,
																																	 totalThroughput,
																																	 // outputThroughput,
																																	 outputGauge
																																 }) => {
	const [expanded, setExpanded] = useState<boolean>(false);

	const handleChange = () => {
		setExpanded(!expanded);
	};


	return (
		(remainingRecipes && remainingRecipes?.length > 0) ?
			<React.Fragment>
				<ListItemButton onClick={handleChange} sx={{width: '100%', pl: 0}}>
					<RecipeCard
						root_component={recipeGroupName}
						id={selectedRecipe?.id}
						display_name={selectedRecipe.display_name}
						class_name={selectedRecipe.class_name}
						ingredients={selectedRecipe.ingredients}
						products={selectedRecipe.products}
						manufactoring_duration={selectedRecipe.manufactoring_duration}
						throughputGauge={throughputGauge}
						totalThroughput={totalThroughput}
						outputGauge={outputGauge}
						// outputThroughput={outputThroughput}
					/>
					{expanded ? <ExpandLess/> : <ExpandMore/>}
				</ListItemButton>
				<Collapse in={expanded} orientation="vertical" unmountOnExit sx={{width: '100%'}}>
					<List sx={{width: '100%'}}>
						{
							remainingRecipes?.map((recipe, index) => ( recipe &&
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
										manufactoring_duration={selectedRecipe.manufactoring_duration}
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
            manufactoring_duration={selectedRecipe.manufactoring_duration}
            throughputGauge={throughputGauge}
            totalThroughput={totalThroughput}
            // outputThroughput={outputThroughput}
            outputGauge={outputGauge}
        />
	)
		;
}

export default ActiveRecipeWrapper;