import {Box} from "@mui/material";
import Grid from "@mui/material/Grid2";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import React, {useState} from "react";
import {RecipeDetail} from "../types/Recipe.ts";

interface RecipeCardProps extends RecipeDetail {
	root_component: string;
}

const RecipeCard: React.FC<RecipeCardProps> = ({
																								 root_component,
																								 id,
																								 display_name,
																								 class_name,
																								 ingredients,
																								 products,
																							 }) => {
	const [hoveredCard, setHoveredCard] = useState(false);

	const handleMouseEnter = () => {
		setHoveredCard(true);
	}

	const handleMouseLeave = () => {
		setHoveredCard(false);
	}

	return (
		<Box
			sx={{
				display: "flex",
				alignItems: "center",
				padding: "8px 16px",
				borderRadius: "8px",
				marginBottom: "8px",
				width: "100%",
			}}
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
		>
			{/* Root Component Image */}
			<Box
				sx={{
					display: "flex",
					alignItems: "center",
					paddingRight: "16px",
					width: "60px", // Fixed width to match alignment
				}}
			>
				<img
					width="48"
					height="48"
					src={`src/assets/images/items/${root_component.replaceAll(
						" ",
						"-"
					).toLowerCase()}_64.png`}
					alt={root_component}
				/>
			</Box>

			{/* Main Content Grid */}
			<Grid container spacing={2} alignItems="center">
				{/* Root Component and Display Name */}
				<Grid xs={3}> {/* Fixed size for consistent alignment */}
					{root_component === display_name ? (
						<Typography variant="body1">{root_component}</Typography>
					) : (
						<Stack>
							<Typography variant="body1">{root_component}</Typography>
							<Typography variant="caption" color="textSecondary">
								{display_name.startsWith('Alternate: ') ? display_name.substring(11) : display_name}
							</Typography>
						</Stack>
					)}
				</Grid>

				{hoveredCard && (
					<>
						{/* Ingredients List */}
						<Grid
							xs={5} // Fixed width for ingredients
							sx={{
								display: "flex",
								gap: "8px",
								alignItems: "center",
								flexWrap: "wrap", // Ensures wrapping if necessary
							}}
						>
							{ingredients?.length > 0 ?
								<Box sx={{display: "flex", backgroundColor: 'grey.100', borderRadius: 1}}>
									{ingredients?.map((ingredient) => (
										<Box key={ingredient.id} sx={{display: "flex", p: 1}}>
											<img
												width="32"
												height="32"
												src={`src/assets/images/items/${ingredient.display_name
													.replaceAll(" ", "-")
													.toLowerCase()}_64.png`}
												alt={ingredient.display_name}
											/>
										</Box>
									))}
								</Box>
								: <></>
							}
						</Grid>

						{/* Products List */}
						<Grid
							xs={4} // Fixed width for products
							sx={{
								display: "flex",
								gap: "8px",
								alignItems: "center",
								justifyContent: "flex-end", // Align products to the right
							}}
						>
							{products?.filter((product) => product.display_name != root_component).length > 0 ?
								<Box
									sx={{
										p: 1,
										backgroundColor: 'grey.100',
										borderRadius: 1,
									}}
								>
									{products?.filter((product) => product.display_name != root_component).map((product) => (
										<Box key={product.id} sx={{display: "flex"}}>
											<img
												width="32"
												height="32"
												src={`src/assets/images/items/${product.display_name
													.replaceAll(" ", "-")
													.toLowerCase()}_64.png`}
												alt={product.display_name}
											/>
										</Box>
									))}
								</Box>
								:
								<></>
							}
						</Grid>
					</>)}
			</Grid>
		</Box>
	);
};

export default RecipeCard;
