import React, {useRef, useEffect, useState} from "react";
import * as d3 from "d3";
import { Paper, Typography } from "@mui/material";
import raw_resource_lookup from "../../data/rawResourceLookup.ts";
import {raw_resource_lookup_props} from "../../types/Other.ts";
import {OptimizationResult} from "../../types/ProductionLine.ts";
import "./D3ResourceUseGraph.css";

const processData = (usage: OptimizationResult['raw_resource_usage'], lookup: raw_resource_lookup_props) => {
	const no_water = usage.filter((item) => item.item_id != 157)
	const mapped_data = no_water.map((item) => ({
		id: item.item_id,
		name: lookup[item.item_id]?.display_name || "Unknown",
		quantity: item.total_quantity,
		limit: lookup[item.item_id]?.global_limit || 0,
		// color: lookup[item.item_id]?.color || "#2196F3"
		gradient: lookup[item.item_id]?.gradient || ["#2196F3", "#1976D2"],
		gradientId: ''
	}));
	return mapped_data.sort((a, b) => b.quantity - a.quantity);
};

interface D3ResourceUseGraphProps {
	data: OptimizationResult;
	maxHeight: number;
}

const D3ResourceUseGraph: React.FC<D3ResourceUseGraphProps> = ({data, maxHeight}) => {
	const containerRef = useRef<HTMLDivElement>(null);
	const [width, setWidth] = useState<number>(0);
	const [height, setHeight] = useState<number>(0);

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

		const processedData = processData(data.raw_resource_usage, raw_resource_lookup)

		const height = processedData.length * 50;
		setHeight(height);
		const margin = { top: 20, right: 10, bottom: 20, left: 90 };

		d3.select(containerRef.current).select("svg").remove();

		const svg = d3
			.select(containerRef.current)
			.append("svg")
			.attr("width", width)
			.attr("height", height)
			// .style("background", "#f9f9f9")

		// Define gradients
		const defs = svg.append("defs");

		const shimmerGradient = defs.append("linearGradient")
			.attr("id", "shimmer-gradient")
			.attr("gradientUnits", "userSpaceOnUse")
			.attr("x1", "0%").attr("y1", "0%").attr("x2", "100%").attr("y2", "0%");

		// Add shimmering stops
		shimmerGradient.append("stop")
			.attr("offset", "0%")
			.attr("stop-color", "#ffffff") // Bright white for shimmer
			.attr("stop-opacity", "0");

		shimmerGradient.append("stop")
			.attr("offset", "50%")
			.attr("stop-color", "#ffffff")
			.attr("stop-opacity", "0.8"); // Bright sparkle in the center

		shimmerGradient.append("stop")
			.attr("offset", "100%")
			.attr("stop-color", "#ffffff")
			.attr("stop-opacity", "0");

		// Add glow effect filter
		const glow = defs.append("filter")
			.attr("id", "glow-effect");

		glow.append("feGaussianBlur")
			.attr("stdDeviation", 3) // Soft glow radius
			.attr("result", "coloredBlur");

		glow.append("feMerge")
			.selectAll("feMergeNode")
			.data(["coloredBlur", "SourceGraphic"]) // Merge the blur and original bar
			.enter()
			.append("feMergeNode")
			.attr("in", (d) => d);

		processedData.forEach((d) => {

			const gradientId = `gradient-${d.id}`;
			const colors = d.gradient || ["#2196F3", "#1976D2", "#ffffff"]; // Default blue gradient

			const gradient = defs.append("linearGradient")
				.attr("id", gradientId)
				.attr("x1", "0%")
				.attr("y1", "0%")
				.attr("x2", "100%")
				.attr("y2", "0%");

			gradient.append("stop")
				.attr("offset", "0%")
				.attr("stop-color", colors[0]);

			gradient.append("stop")
				.attr("offset", "50%")
				.attr("stop-color", colors[1]);

			gradient.append("stop")
				.attr("offset", "100%")
				.attr("stop-color", colors[2]);

			// Attach gradient ID to each data item
			d.gradientId = gradientId;
		});

		// const maxQuantity = d3.max(processedData, (d) => d.quantity) || 0;

		const xScale = d3
			.scaleLinear()
			.domain([0, d3.max(processedData, (d) => d.quantity) || 0])
			.range([margin.left, width-margin.right])

		const yScale = d3
			.scaleBand()
			.domain(processedData.map((d) => d.name))
			.range([margin.top, height-margin.bottom])
			// .padding(processedData.length > 1 ? Math.max((5/(processedData.length))*0.1,0.1) : 0)
			.padding(0.1)

		svg.append("g")
			.attr("transform", `translate(0, ${margin.top})`)
			// .call(d3.axisLeft(yScale));

		// Add drop shadow filter
		const filter = defs.append("filter")
			.attr("id", "drop-shadow")
			.attr("height", "130%"); // Ensure the shadow doesn't get clipped

		filter.append("feDropShadow")
			.attr("dx", 2)       // Horizontal shadow offset
			.attr("dy", 2)       // Vertical shadow offset
			.attr("stdDeviation", 3) // Blur radius
			.attr("flood-color", "#000000") // Shadow color
			.attr("flood-opacity", 0.7);   // Shadow transparency

		// Draw bars with gradient and shadow
		svg.selectAll(".bar")
			.data(processedData)
			.enter()
			.append("rect")
			.attr("class", "bar")
			.attr("x", margin.left)
			.attr("y", (d) => {
				const yVal = yScale(d.name);
				return yVal !== undefined ? yVal : 0;
			})
			.attr("width", (d) => xScale(d.quantity) - margin.left)
			.attr("height", yScale.bandwidth())
			.attr("rx", 4) // Rounds the horizontal corners
			.attr("ry", 4) // Rounds the vertical corners
			.attr("fill", (d) => `url(#${d.gradientId})`)
			.attr("filter", (d) => d.name === "Sam Ore" ? "url(#glow-effect)" : "url(#drop-shadow)");


		// Add bar names to the left of each bar
		svg.selectAll(".bar-name")
			.data(processedData)
			.enter()
			.append("text")
			.attr("class", "bar-name")
			.attr("x", margin.left - 10) // Position text before the bar
			.attr("y", (d) => {
				const yVal = yScale(d.name);
				// console.log("yVal: ", yVal)
				// console.log("yVal Check: ", yVal !== undefined ? + yScale.bandwidth() / 2 : 0)
				return yVal !== undefined ? yVal + yScale.bandwidth() / 2 : 0;
			})
			.attr("dy", "0.35em")
			.attr("text-anchor", "end") // Align text to the right
			.text((d) => d.name)
			.attr("fill", "#555");

		// // Add shimmering overlay for Sam Ore
		// const samOre = processedData.find((d) => d.name === "Sam Ore");
		// if (samOre) {
		// 	svg.append("rect")
		// 		// .attr("class", "shimmer-overlay")
		// 		.attr("x", margin.left)
		// 		.attr("y", yScale(samOre.name))
		// 		.attr("width", (xScale(samOre.quantity) - margin.left)/4)
		// 		.attr("height", yScale.bandwidth())
		// 		.attr("rx", 8)
		// 		.attr("ry", 8)
		// 		.attr("fill", "url(#shimmer-gradient)");
		// }

		// Add sparkles specifically for Sam Ore
		const sparkleCount = 20; // Number of sparkles you want

		processedData.filter((d) => d.name === "Sam Ore").forEach((d) => {
			for (let i = 0; i < sparkleCount; i++) {
				svg.append("circle")
					.attr("class", "sparkle") // Attach the animation class
					.attr("cx", () => Math.random() * (xScale(d.quantity) - margin.left) + margin.left) // Random x within bar width
					.attr("cy", () => {
						const yVal = yScale(d.name);
						return yVal !== undefined ? yVal + Math.random() * yScale.bandwidth() : 0;
					})
					.attr("r", () => Math.random() * 0.5 + 1) // Random small radius between 1.5 and 3
					.attr("fill", "white")
					.attr("opacity", () => Math.random() * 0.5 + 0.5); // Random opacity between 0.5 and 1
			}
		});

// Add labels with quantities to dynamically position based on bar width
		svg.selectAll(".bar-label")
			.data(processedData)
			.enter()
			.append("text")
			.attr("class", "bar-label")
			.attr("x", (d) => {
				const barWidth = xScale(d.quantity) - margin.left; // Calculate bar width
				const textWidth = ( d.quantity.toFixed(2).length + 4.5 ) * 7.5; // Approximate text width (7.5px per character): + 4 for '/ min'
				return barWidth > textWidth ? xScale(d.quantity) - textWidth + 3 : xScale(d.quantity) + 5; // Inside if wide enough, outside otherwise
			})
			.attr("y", (d) => {
				const yVal = yScale(d.name);
				return yVal !== undefined ? yVal + yScale.bandwidth() / 2 : 0;
			})
			.attr("dy", "0.35em") // Fine-tune vertical alignment
			.attr("fill", (d) => {
				const barWidth = xScale(d.quantity) - margin.left;
				const textWidth = ( d.quantity.toFixed(2).length + 4.5 )* 7.5; // + 4 for ' / min', 7.5 corresponding to 14px font size
				return barWidth > textWidth ? "white" : "#555"; // White for inside, dark for outside
			})
			.attr("font-size", "14px")
			.attr("font-weight", "bold") // Optional: Make it bold for better visibility
			.attr("text-anchor", "start")
			.text((d) => `${d.quantity.toFixed(2).toLocaleString()} / min`);


	}, [data, width]);

	return (
		<Paper
			elevation={1}
			style={{
				padding: 8,
				width: "100%",
				maxHeight: maxHeight,
				overflowY: height > maxHeight-30 ? "auto" : "visible",
				// backgroundColor:
			}}
		>
			<Typography variant="h6" gutterBottom>
				Raw Resource Usage
			</Typography>
			<div
				ref={containerRef}
				style={{
					width: "100%",
					height: "100%",
				}}
			/>
		</Paper>
	);
};

export default D3ResourceUseGraph;

