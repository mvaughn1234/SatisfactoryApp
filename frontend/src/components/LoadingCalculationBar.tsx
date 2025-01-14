import {Box, CircularProgress, circularProgressClasses, LinearProgress} from "@mui/material";
import React from 'react';

const LoadingCalculationBar: React.FC = () => {
	return (
		<Box>
			<LinearProgress
				variant="indeterminate"
				sx={{
					backgroundColor: 'transparent', // Custom height
					"& .MuiLinearProgress-bar": {
						background: `linear-gradient(to right, #e01cd5, #FC6F03FF)`, // Apply gradient
						// backgroundClip: "text",
						// textFillColor: "transparent",
					},
				}}
			/>
		</Box>
	)
}

export default LoadingCalculationBar