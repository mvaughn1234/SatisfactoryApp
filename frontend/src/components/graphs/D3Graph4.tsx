import {Box, Paper, Typography} from "@mui/material";
import React, {useEffect, useRef, useState} from "react";
import raw_resource_lookup from "../../data/rawResourceLookup.ts";
import {raw_resource_lookup_props} from "../../types/Other.ts";
import {OptimizationResult} from "../../types/ProductionLine.ts";
// import * as d3 from "d3";

interface D3Graph4Props {
	data: OptimizationResult;
	maxHeight: number;
}

// interface PracticeGraphProps {
// 	width: number,
// 	data: {
// 		id: number;
// 		name: string;
// 		quantity: number;
// 		limit: number;
// 		gradient: string[];
// 		backgroundColor: string;
// 	}[]
// }

const processData = (usage: OptimizationResult['raw_resource_usage'], lookup: raw_resource_lookup_props) => {
	const no_water = usage.filter((item) => item.item_id != 157)
	const mapped_data = no_water.map((item) => ({
		id: item.item_id,
		name: lookup[item.item_id]?.display_name || "Unknown",
		quantity: item.total_quantity,
		limit: lookup[item.item_id]?.global_limit || 0,
		// color: lookup[item.item_id]?.color || "#2196F3"
		gradient: lookup[item.item_id]?.gradient || ["#ffffff", "#2196F3", "#1976D2"],
		backgroundColor: "#ffffff"
	}));
	return mapped_data.sort((a, b) => b.quantity - a.quantity);
};

// const PracticeGraph: React.FC<PracticeGraphProps> = ({data, width}) => {}

const D3Graph4: React.FC<D3Graph4Props> = ({data, maxHeight}) => {
	const containerRef = useRef<HTMLDivElement>(null);
	const [width, setWidth] = useState<number>(0);
	// const [height, setHeight] = useState<number>(0);

	// Measure container width dynamically
	const updateWidth = () => {
		if (containerRef.current) {
			setWidth(containerRef.current.offsetWidth);
		}
	};

	useEffect(() => {
		updateWidth(); // Initial measurement
		window.addEventListener("resize", updateWidth);
		return () => window.removeEventListener("resize", updateWidth);
	}, []);

	useEffect(() => {
		if (!data || !containerRef.current || !data.raw_resource_usage || width === 0) return;

		const _margin = { top: 20, right: 10, bottom: 20, left: 90 };
		const _processedData = processData(data.raw_resource_usage, raw_resource_lookup);



	}, [data, maxHeight]);

	useEffect(() => {

	}, []);

	return (
		<Paper
			elevation={3}
			style={{
				padding: 8,
				width: "100%",
				maxHeight: maxHeight,
				overflowY: "auto",
			}}
		>
			<Typography variant="h6" gutterBottom>
				Practice Graph
			</Typography>
			<Box
				ref={containerRef}
				sx={{
					width: 1,
					height: 1
				}}
			/>
		</Paper>
	);
}

export default D3Graph4;