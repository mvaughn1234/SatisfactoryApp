import {Box, Typography} from "@mui/material";
import {useTheme} from "@mui/material/styles";
import useResizeObserver from "@react-hook/resize-observer";
import * as d3 from "d3";
import React, {useEffect, useRef, useState} from "react";
import raw_resource_lookup from "../../data/rawResourceLookup.ts";
import {raw_resource_lookup_props} from "../../types/Other.ts";
import {OptimizationResult} from "../../types/ProductionLine.ts";

interface D3RawPieChartContainer {
	data: OptimizationResult;
	maxHeight: number;
}

interface D3RawPieChart {
	data: OptimizationResult;
	width: number;
	maxHeight: number;
}

interface ProcessedDataResultPie {
	id: number;
	name: string;
	quantity: number;
	color: string;
}

interface PiePathElement extends SVGPathElement {
	_current: d3.PieArcDatum<ProcessedDataResultPie>
}

const processData = (usage: OptimizationResult['raw_resource_usage'], lookup: raw_resource_lookup_props): ProcessedDataResultPie[] => {
	const no_water = usage.filter((item) => item.item_id != 157)
	const mapped_data = no_water.map((item) => ({
		id: item.item_id,
		name: lookup[item.item_id]?.display_name || "Unknown",
		quantity: item.total_quantity,
		// limit: lookup[item.item_id]?.global_limit || 0,
		color: lookup[item.item_id]?.gradient[1] || "#2196F3",
		// gradient: lookup[item.item_id]?.gradient || ["#2196F3", "#1976D2"],
		// gradientId: ''
	}));

	// return mapped_data.sort((a, b) => rawResourceSet.indexOf(b.name) - rawResourceSet.indexOf(a.name));
	return mapped_data;
};

const D3RawPieChart: React.FC<D3RawPieChart> = ({data, width, maxHeight}) => {
	const svgRef = useRef<SVGSVGElement | null>(null);
	const theme = useTheme();
	// const rawResourceSet = ["Iron Ore", "Coal", "Nitrogen Gas", "Sulfur", "Sam Ore", "Bauxite", "Caterium Ore", "Copper Ore", "Raw Quartz", "Limestone", "Uranium", "Cure Oil"] // Excluded water to bring raw total to 12
	const processedData = processData(data.raw_resource_usage, raw_resource_lookup)

	// Create a persistent color scale
	// const colorScale = useMemo(() => {
	// 	return d3.scaleOrdinal(d3.schemePaired).domain(rawResourceSet);
	// }, []);

	useEffect(() => {
		if (!svgRef.current) return;

		const height = Math.min(maxHeight, width / 2);
		// const margin = {top: 20, right: 10, bottom: 20, left: 10};

		const svg = d3.select<SVGSVGElement, ProcessedDataResultPie>(svgRef.current)
			.attr("width", width)
			.attr("height", height)
			.attr("viewBox", [-width / 2, -height / 2, width, height]);

		const outerRadius = height / 2 - 10;
		const innerRadius = outerRadius * 0.75;
		// const tau = 2 * Math.PI;

		const arc = d3.arc<d3.PieArcDatum<ProcessedDataResultPie>>()
			.innerRadius(innerRadius)
			.outerRadius(outerRadius);

		const pie = d3.pie<ProcessedDataResultPie>().sort(null).sortValues(null).value((d) => d.quantity).padAngle(0.02);

		svg
			.datum(processedData)
			.selectAll<PiePathElement, d3.PieArcDatum<ProcessedDataResultPie>>("path")
			.data(pie(processedData))
			.join(
				enter => enter
					.append("path")
					.attr("stroke", theme.palette.text.primary)
					.attr("fill", (d) => d.data.color)
					.each(function (d) {
						const pie = this as PiePathElement;
						pie._current = d;
					})
					.attr("d", arc)
					.on("end", function (d) {
						const pie = this as PiePathElement;
						pie._current = d;
					})
				,
				update => update
					.transition()
					.duration(750)
					.attr("fill", (d) => d.data.color)
					.attr("stroke", theme.palette.text.primary)
					.attrTween("d", function (d) {
						const pie = this as PiePathElement;
						// Now tween from startAngle → endAngle
						const i = d3.interpolate(pie._current, d);
						return (t) => arc(i(t)) ?? "";
					}).on("end", function (d) {
						const pie = this as PiePathElement;
						pie._current = d;
					}),
				exit => exit
					.remove()
			)// store the initial angles

		// Return the svg node to be displayed.
		// return Object.assign(svg.node(), {change});
	}, [data, width, maxHeight, theme])

	return <svg ref={svgRef}/>;
}

const D3RawPieChartContainer: React.FC<D3RawPieChartContainer> = ({data, maxHeight}) => {
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
				// maxHeight: maxHeight,
				overflowY: "auto",
				// backgroundColor:
			}}
		>
			<Typography variant="h4" gutterBottom>
				Raw Resource Usage
			</Typography>

			<div ref={containerRef}>
				<D3RawPieChart data={data} width={width} maxHeight={maxHeight}/>
			</div>
		</Box>
	);

}

export default D3RawPieChartContainer;