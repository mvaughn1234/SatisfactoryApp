import Grid from "@mui/material/Grid2";
import React, {useRef, useEffect} from "react";
import * as d3 from "d3";
import {Divider, Paper, Typography} from "@mui/material";
import raw_resource_lookup from "../../data/rawResourceLookup.ts";
import {raw_resource_lookup_props} from "../../types/Other.ts";
import {OptimizationResult} from "../../types/ProductionLine.ts";
import "./D3ResourceUseGraph.css";

interface circleGraphDataProps {
	width: number,
	data: {
		id: number;
		name: string;
		quantity: number;
		limit: number;
		gradient: string[];
		backgroundColor: string;
	}
}

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

interface D3ResourceUseGraphProps {
	data: OptimizationResult;
	maxHeight: number;
}

const CircularResourceGraph: React.FC<circleGraphDataProps> = ({width, data}) => {
	const ringWidth = 15;
	const radius = width / 2 - ringWidth / 2; // Adjust for 20px thickness
	const arcRef = useRef<SVGSVGElement | null>(null);

	useEffect(() => {
		if (!data || !arcRef.current) return;

		const {quantity, limit, gradient, backgroundColor} = data;
		const percentage = Math.min(quantity / limit, 1);

		const svg = d3.select(arcRef.current);
		svg.selectAll("*").remove(); // Clear previous renders

		const defs = svg.append("defs");

		// Gradient definition
		const gradientId = `gradient-${data.id}`;
		const gradientFill = defs
			.append("linearGradient")
			.attr("id", gradientId)
			.attr("x1", "0%")
			.attr("y1", "0%")
			.attr("x2", "100%")
			.attr("y2", "0%");

		gradient.forEach((color, i) => {
			gradientFill
				.append("stop")
				.attr("offset", `${(i / (gradient.length - 1)) * 100}%`)
				.attr("stop-color", color);
		});

		const innerRadiusNominal = radius - ringWidth;
		const innerRadius = data.quantity > data.limit ? innerRadiusNominal - 2 : innerRadiusNominal
		const outerRadius = data.quantity > data.limit ? radius - 2 : radius
		const arc = d3.arc<{ startAngle: number; endAngle: number }>()
			.innerRadius(innerRadius)
			.outerRadius(outerRadius);

		const warningArc = d3.arc<{ startAngle: number; endAngle: number }>()
			.innerRadius(innerRadius - 2)
			.outerRadius(radius);

		// Background arc
		svg
			.append("path")
			.attr("d", arc({startAngle: 0, endAngle: 2 * Math.PI}))
			.attr("fill", backgroundColor)
			.attr("transform", `translate(${radius},${radius})`);

		// Foreground warning arc for usage > limit
		if (data.quantity > data.limit) {
			svg
				.append("path")
				.attr("d", warningArc({startAngle: .5 * 2 * Math.PI, endAngle: .5 * 2 * Math.PI + percentage * 2 * Math.PI}))
				// .attr("fill", `url(#${gradientId})`)
				.attr("fill", "#ff2525")
				.attr("transform", `translate(${radius},${radius})`);
		}

		// Foreground arc for usage
		svg
			.append("path")
			.attr("d", arc({startAngle: .5 * 2 * Math.PI, endAngle: .5 * 2 * Math.PI + percentage * 2 * Math.PI}))
			// .attr("fill", `url(#${gradientId})`)
			.attr("fill", (data.quantity <= data.limit ? gradient[Math.floor(gradient.length / 2)] : "#ff8c8c"))
			.attr("transform", `translate(${radius},${radius})`);

	}, [data, radius]);

	return (
		<div style={{position: "relative", width: radius * 2, height: radius * 2}}>
			<svg ref={arcRef} width={radius * 2} height={radius * 2}/>
			<div
				style={{
					position: "absolute",
					top: "50%",
					left: "50%",
					transform: "translate(-50%, -50%)",
					textAlign: "center",
				}}
			>
				<Typography variant="body1" component="div">
					{data.quantity}
				</Typography>
				<Divider style={{margin: "4px 0"}}/>
				<Typography variant="caption" component="div">
					/ {data.limit}
				</Typography>
			</div>
		</div>
	);
};


const D3GlobalResourceLimitViz: React.FC<D3ResourceUseGraphProps> = ({data, maxHeight}) => {
	const processedData = processData(data.raw_resource_usage, raw_resource_lookup);

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
				Raw Resource Usage
			</Typography>
			<Grid container spacing={2}>
				{processedData.map((item) => (
					<Grid size={{xs: 4}} sx={{textAlign: "center"}} key={item.id}>
						<CircularResourceGraph width={100} data={item}/>
						<Typography variant="body2">{item.name}</Typography>
					</Grid>
				))}
			</Grid>
		</Paper>
	);
};

export default D3GlobalResourceLimitViz;