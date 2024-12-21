import {CardHeader} from "@mui/material";
import Avatar from "@mui/material/Avatar";
import Card from "@mui/material/Card";
import React from 'react';
import {orange} from "../../theme/themePrimitives.ts";

interface RecipeNodeProps {
	name: string;
	rate: number;
	representative_item_name: string;
	building_name: string | null;
}

const RecipeNode: React.FC<RecipeNodeProps> = ({name, rate, representative_item_name, building_name=''}) => {
	const img_src = `src/assets/images/items/${representative_item_name?.split(" ").join("-").toLowerCase() || 'Iron-Plate'}_64.png`

	return (
		<Card sx={{ width: 250, bgcolor: orange[300] }}>
			<CardHeader
				avatar={
					<Avatar sx={{ bgcolor: orange[500] }} aria-label="recipe">
						<img
							src={img_src}
							alt={name}
							width="32"
							height="32"
						/>
					</Avatar>
				}
				title={name}
				subheader={`${rate} x ${building_name || ''}`}
			/>
		</Card>
	);
}

export default RecipeNode