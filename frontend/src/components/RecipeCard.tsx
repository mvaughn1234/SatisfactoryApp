import {Box, Checkbox, Divider, Theme, Tooltip} from "@mui/material";
import {useTheme} from "@mui/material/styles";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import React, {useState} from "react";
import {usePreferredRecipe} from "../hooks/usePreferredRecipe.ts";
import {RecipeSummary, RecipeItem} from "../types/Recipe.ts";

interface RecipeCardProps extends RecipeSummary {
	root_component: string;
	ingredients?: RecipeItem[];
	products?: RecipeItem[];
	throughputGauge?: number;
	totalThroughput?: number;
	// outputThroughput?: number;
	outputGauge?: number;
}

const formatNumber = (value: number): string => {
	if (value + .5 >= 1_000_000) {
		return `${(value / 1_000_000).toFixed(1)}m`; // Format for millions
	} else if (value + .5 >= 1_000) {
		return `${(value / 1_000).toFixed(1)}k`; // Format for thousands
	} else {
		return `${value.toFixed(1)}`; // Format for numbers less than 1k
	}
}

const drawBackgroundBar = (throughputGauge: number, outputGauge: number, theme: Theme) => {
	const outputBox =	outputGauge > 0 && <Box
		sx={{
			position: "absolute", // Position the fill behind the content
			top: "2.5%",
			height: "95%",
			left: 0,
			width: `${Math.min(Math.max(outputGauge, 0), 1) * 100}%`, // Proportional fill
			backgroundColor: "primary.main", // Fill color
			transition: "width 0.3s ease", // Smooth transition for width change
			zIndex: -1, // Ensure it is behind all other content
			opacity: theme.palette.mode === "dark" ? 0.25 : 0.50,
			border: 1,
			borderRadius: 0,
		}}
	/>

	const throughputBox = throughputGauge > 0 && <Box
		sx={{
			position: "absolute", // Position the fill behind the content
			top: "2.5%",
			height: "95%",
			left: `${outputGauge ? Math.min(Math.max(outputGauge, 0), 1) * 100 : 0}`,
			width: `${Math.min(Math.max(throughputGauge, 0), 1) * 100}%`, // Proportional fill
			backgroundColor: "secondary.main", // Fill color
			transition: "width 0.3s ease", // Smooth transition for width change
			zIndex: -1, // Ensure it is behind all other content
			opacity: theme.palette.mode === "dark" ? 0.125 : 0.25,
			border: 1,
			borderRadius: 0,
		}}
	/>
	const Combined = <Box>
		{outputBox}
		{throughputBox}
	</Box>

	if (outputGauge && outputGauge > 0) {
		return (Combined)
	} else if (outputGauge > 0) {
		return outputBox
	} else {
		return throughputBox
	}
}

const RecipeCard: React.FC<RecipeCardProps> = ({
																								 root_component,
																								 id,
																								 display_name,
																								 ingredients,
																								 products,
																								 throughputGauge,
																								 totalThroughput,
																								 // outputThroughput,
																								 outputGauge
																							 }) => {
	const [detailCard, setDetailCard] = useState(false);
	const {isPreferred, setPreferred, single} = usePreferredRecipe(id);
	const theme = useTheme();

	const handleMouseEnter = () => {
		setDetailCard(true);
	}

	const handleMouseLeave = () => {
		setDetailCard(false);
	}

	const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setPreferred(event.target.checked);
	};

	return (
		<Box
			sx={{
				display: "flex",
				// alignItems: "center",
				flexDirection: 'column',
				justifyContent: "start",
				padding: `${totalThroughput ? "8px 16px 16px 16px" : "8px 16px"}`,
				borderRadius: "8px",
				marginBottom: "8px",
				width: "100%",
			}}
			// onClick={handleClick}
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
		>
			{/*{throughputGauge &&*/}
			{/*	<Box*/}
			{/*		sx={{*/}
			{/*			position: "absolute", // Position the fill behind the content*/}
			{/*			top: "2.5%",*/}
			{/*			height: "95%",*/}
			{/*			left: 0,*/}
			{/*			width: `${Math.min(Math.max(throughputGauge, 0), 1) * 100}%`, // Proportional fill*/}
			{/*			backgroundColor: "secondary.main", // Fill color*/}
			{/*			transition: "width 0.3s ease", // Smooth transition for width change*/}
			{/*			zIndex: -1, // Ensure it is behind all other content*/}
			{/*			opacity: theme.palette.mode === "dark" ? 0.125 : 0.25,*/}
			{/*			border: 1,*/}
			{/*			borderRadius: 0,*/}
			{/*		}}*/}
			{/*	/>*/}
			{/*}*/}
			{(throughputGauge || outputGauge) ? drawBackgroundBar(throughputGauge || 0, outputGauge || 0, theme) : null}
			<Tooltip
				placement="right"
				arrow
				title={
					detailCard && (
						<>
							<Typography>Ingredients:</Typography>
							{/* Ingredients List */}
							{(ingredients && ingredients?.length > 0) ?
								<Box sx={{display: "flex", borderRadius: 1}}>
									{ingredients?.map((ingredient) => (
										<Box key={ingredient.id} sx={{display: "flex", p: 1}}>
											<img
												width="32"
												height="32"
												src={`/assets/images/items/${ingredient.display_name
													.split(" ").join("-")
													.toLowerCase()}_64.png`}
												alt={ingredient.display_name}
											/>
										</Box>
									))}
								</Box>
								: <></>
							}
							<Divider/>
							{/* Products List */}
							{products && products?.filter((product) => product.display_name != root_component).length > 0 ?
								<Box
									sx={{
										p: 1,
										// backgroundColor: 'grey.100',
										borderRadius: 1,
									}}
								>
									<Typography>By-Product:</Typography>
									{products?.filter((product) => product.display_name != root_component).map((product) => (
										<Box key={product.id} sx={{display: "flex"}}>
											<img
												width="32"
												height="32"
												src={`/assets/images/items/${product.display_name
													.split(" ").join("-")
													.toLowerCase()}_64.png`}
												alt={product.display_name}
											/>
										</Box>
									))}
								</Box>
								:
								<></>
							}
						</>)
				}>
				{/* Root Component Image */}
				<Box
					sx={{
						display: "flex",
						alignItems: "center",
						// paddingRight: "16px",
						// width: "60px", // Fixed width to match alignment
					}}
				>
					<Checkbox
						checked={isPreferred || single}
						onChange={handleCheckboxChange}
						disabled={single}
					/>
					{/*<Badge*/}
					{/*	badgeContent={totalThroughput ? formatNumber(totalThroughput) : 0}*/}
					{/*	color="primary"*/}
					{/*	anchorOrigin={{*/}
					{/*		vertical: 'bottom',*/}
					{/*		horizontal: 'right',*/}
					{/*	}}*/}
					{/*	max={1000}*/}
					{/*>*/}
					<img
						width="48"
						height="48"
						src={`/assets/images/items/${root_component.split(" ").join("-").toLowerCase()}_64.png`}
						alt={root_component}
					/>
					{/*</Badge>*/}

					<Box sx={{px: 2}}>
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
					</Box>
				</Box>
			</Tooltip>

			{totalThroughput && <Box
          sx={{
						position: "absolute", // Position the fill behind the content
						bottom: "4px",
						display: 'flex',
						justifyContent: 'center',
						left: 0,
						width: '100%', // Proportional fill
						zIndex: -1, // Ensure it is behind all other content
					}}
      >
          <Typography
              variant="caption"
          >[ <b>{formatNumber(totalThroughput)}</b> /min ]</Typography>
      </Box>
			}
		</Box>
	);
};

export default RecipeCard;
