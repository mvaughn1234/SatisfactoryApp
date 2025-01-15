import {Box, Typography} from "@mui/material";
import {useTheme} from "@mui/material/styles";
import useResizeObserver from '@react-hook/resize-observer';
import * as d3 from 'd3';
import React, {useEffect, useRef, useState} from "react";
import raw_resource_lookup from "../../data/rawResourceLookup.ts";
import {raw_resource_lookup_props} from "../../types/Other.ts";
import {OptimizationResult} from "../../types/ProductionLine.ts";

interface D3NewResourceGraphContainerProps {
	data: OptimizationResult;
	maxHeight: number;
}

interface D3NewResourceGraphProps {
	data: OptimizationResult;
	width: number;
	maxHeight: number;
}

interface ProcessedDataResult {
	id: number;
	name: string;
	quantity: number;
	limit: number;
	gradient: string[];
	gradientId: string;
}

const processData = (usage: OptimizationResult['raw_resource_usage'], lookup: raw_resource_lookup_props): ProcessedDataResult[] => {
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

const D3NewResourceUseGraph: React.FC<D3NewResourceGraphProps> = ({data, width, maxHeight}) => {
	const svgRef = useRef<SVGSVGElement | null>(null);
	const theme = useTheme();

	useEffect(() => {
		if (!svgRef.current) return;

		const processedData = processData(data.raw_resource_usage, raw_resource_lookup)
		const height = processedData.length * 35 + 20 + 20;
		const margin = {top: 20, right: 10, bottom: 20, left: 105};

		const svg = d3.select<SVGSVGElement, ProcessedDataResult>(svgRef.current)
			.attr('width', width)
			.attr("height", height)
		// .style("background", "#000")

		const xScale = d3
			.scaleLinear()
			.domain([0, d3.max(processedData, (d) => d.quantity) || 0])
			.range([margin.left, width - margin.right])

		const yScale = d3
			.scaleBand()
			.domain(processedData.map((d) => d.name))
			.range([margin.top, height - margin.bottom])
			.padding(0.15)

		svg.append("g")
			.attr("transform", `translate(0, ${margin.top})`)

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


		svg.selectAll<SVGRectElement, ProcessedDataResult>(".bar")
			.data(processedData, (d) => d.name)
			.join(
				enter => enter
					.append("rect")
					.attr("class", "bar")
					.attr("x", margin.left)
					.attr("y", (d) => {
						const yVal = yScale(d.name);
						return yVal !== undefined ? yVal : 0;
					})
					.attr("width", 0)
					.attr("height", yScale.bandwidth())
					.attr("stroke", (d) => theme.palette.text.primary)
					.attr("stroke-width", 1)
					// .attr("rx", 4)
					// .attr("ry", 4)
					.attr("borderColor", "black")
					// .attr("fill", (d) => `url(#${d.gradientId})`)
					.attr("fill", (d) => d.gradient[1])
					.attr("filter", (d) => d.name === "Sam Ore" ? "url(#glow-effect)" : "url(#drop-shadow)")
					.transition()
					.duration(750)
					.attr("width", (d) => xScale(d.quantity) - margin.left),
				update => update
					.transition()
					.duration(750)
					.attr("rx", 0)
					.attr("ry", 0)
					.attr("stroke", (d) => theme.palette.text.primary)
					.attr("stroke-width", 1)

					.attr("y", (d) => {
						const yVal = yScale(d.name);
						return yVal !== undefined ? yVal : 0;
					})
					.attr("height", yScale.bandwidth())
					.attr("width", (d) => xScale(d.quantity) - margin.left),
				exit => exit
					.remove()
			)

		svg.selectAll<SVGTextElement, ProcessedDataResult>(".bar-name")
			.data(processedData, (d) => d.name)
			.join(
				enter => enter
					.append("text")
					.attr("class", "bar-name")
					.attr("x", margin.left - 10)
					.attr("y", (d) => {
						const yVal = yScale(d.name);
						return yVal !== undefined ? yVal + yScale.bandwidth() / 2 : 0;
					})
					.attr("dy", "0.35em")
					.attr("text-anchor", "end")
					.attr("fill", theme.palette.text.primary)
					.attr("font-size", "16px")
					.text((d) => d.name),
				update => update
					.transition()
					.duration(750)
					.attr("fill", theme.palette.text.primary)
					.attr("y", (d) => {
						const yVal = yScale(d.name);
						return yVal !== undefined ? yVal + yScale.bandwidth() / 2 : 0;
					}),
				exit => exit
					.remove()
			)
		const darkLabels = ["Nitrogen Gas", "Sulfur"]

		svg.selectAll<SVGTextElement, ProcessedDataResult>(".bar-label")
			.data(processedData, (d) => d.name)
			.join(
				enter => enter
					.append("text")
					.attr("class", "bar-label")
					.attr("x", (d) => {
						const barWidth = xScale(d.quantity) - margin.left; // Calculate bar width
						const textWidth = (d.quantity.toFixed(2).length + 4.5) * 7.5; // Approximate text width (7.5px per character): + 4 for '/ min'
						return barWidth > textWidth ? xScale(d.quantity) - textWidth + 3 : xScale(d.quantity) + 5; // Inside if wide enough, outside otherwise
					})
					.attr("y", (d) => {
						const yVal = yScale(d.name);
						return yVal !== undefined ? yVal + yScale.bandwidth() / 2 : 0;
					})
					.attr("dy", "0.35em") // Fine-tune vertical alignment
					.attr("fill", (d) => {
						const barWidth = xScale(d.quantity) - margin.left;
						const textWidth = (d.quantity.toFixed(2).length + 4.5) * 7.5; // + 4 for ' / min', 7.5 corresponding to 14px font size
						return barWidth > textWidth ? (darkLabels.find((label) => d.name === label) ? theme.palette.grey[800] : "white") : theme.palette.text.primary; // White for inside, dark for outside
					})
					.attr("font-size", "14px")
					.attr("text-anchor", "start")
					.text((d) => `${d.quantity.toFixed(2).toLocaleString()} / min`),
				update => update
					.transition()
					.duration(750)
					.attr("x", (d) => {
						const barWidth = xScale(d.quantity) - margin.left; // Calculate bar width
						const textWidth = (d.quantity.toFixed(2).length + 4.5) * 7.5; // Approximate text width (7.5px per character): + 4 for '/ min'
						return barWidth > textWidth ? xScale(d.quantity) - textWidth : xScale(d.quantity) + 5; // Inside if wide enough, outside otherwise
					})
					.attr("y", (d) => {
						const yVal = yScale(d.name);
						return yVal !== undefined ? yVal + yScale.bandwidth() / 2 : 0;
					})
					.attr("fill", (d) => {
						const barWidth = xScale(d.quantity) - margin.left;
						const textWidth = (d.quantity.toFixed(2).length + 4.5) * 7.5; // + 4 for ' / min', 7.5 corresponding to 14px font size
						return barWidth > textWidth ? (darkLabels.find((label) => d.name === label) ? theme.palette.grey[800] : "white") : theme.palette.text.primary; // White for inside, dark for outside
					})
					.text((d) => `${d.quantity.toFixed(2).toLocaleString()} / min`),
				exit => exit
					.remove()
			)


	}, [data, width, maxHeight, theme]);

	return <svg ref={svgRef}/>;
}

const D3NewResourceUseGraphContainer: React.FC<D3NewResourceGraphContainerProps> = ({data, maxHeight}) => {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const [width, setWidth] = useState(300);

	useResizeObserver(containerRef, (entry) => {
		if (entry.contentBoxSize) {
			// contentBoxSize can vary by browser; fallback to getBoundingClientRect()
			setWidth(entry.contentRect.width);
		}
	});

	return (
		<Box
			// elevation={1}
			style={{
				padding: 8,
				width: "100%",
				maxHeight: maxHeight,
				overflowY: "auto",
				// backgroundColor:
			}}
		>
			<Typography variant="h4" gutterBottom>
				Raw Resource Usage
			</Typography>

			<div ref={containerRef} style={{maxHeight: 400}}>
			<D3NewResourceUseGraph data={data} width={width} maxHeight={maxHeight}/>
		</div>
		</Box>
	);
};

export default D3NewResourceUseGraphContainer;