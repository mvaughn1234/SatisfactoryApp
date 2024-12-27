import {Box, Typography} from "@mui/material";
import Grid from "@mui/material/Grid2";
import * as d3 from "d3";
import React, {useEffect, useMemo, useRef} from "react";
import raw_resource_lookup from "../../data/rawResourceLookup.ts";
import {OptimizationResult} from "../../types/ProductionLine.ts";
import "./NewD3ResourceUseGraph.css";

interface D3ResourceUseGraphProps {
	data: OptimizationResult;
	maxHeight: number;
}

// 1. Define the interface for your data (the "datum").
interface ArcData {
	id: number;
	name: string;
	quantity: number;
	limit: number;
	gradient: string[];
	backgroundColor: string;
	startAngle?: number;
	endAngle: number;

	// Extra fields to store old angles for transitions
	_oldStartAngle?: number;
	_oldEndAngle?: number;
}

/** Component props */
interface CircularResourceGraphProps {
	width: number;
	data: ArcData;  // or ArcData[] if you handle multiple arcs
}

const CircularResourceGraph: React.FC<CircularResourceGraphProps> = ({ width, data }) => {
	const ringWidth = 10;
	// Example: the radius is half the width minus half the ring thickness
	const radius = width / 2 - ringWidth / 2;
	const svgRef = useRef<SVGSVGElement | null>(null);
	// useEffect(() => { console.log('Mounted'); return () => console.log('Unmounted') }, [])
	useEffect(() => {
		if (!svgRef.current) return;

		const svg = d3.select<SVGSVGElement, ArcData>(svgRef.current);

		// -------------------------------------------------------------------
		// 1. Setup ARC GENERATORS
		// -------------------------------------------------------------------
		const isOverLimit = data.quantity > data.limit;
		const innerRadiusNominal = radius - ringWidth;
		const innerRadius = isOverLimit ? innerRadiusNominal - 2 : innerRadiusNominal;
		const outerRadius = isOverLimit ? radius - 2 : radius;

		// Foreground (usage) arc
		const fgArcGen = d3
			.arc<ArcData>()
			.innerRadius(innerRadius)
			.outerRadius(outerRadius);

		// Background arc (full circle)
		const bgArcGen = d3
			.arc<ArcData>()
			.innerRadius(innerRadiusNominal)
			.outerRadius(radius);

		// Warning arc (if quantity > limit)
		const warningArcGen = d3
			.arc<ArcData>()
			.innerRadius(innerRadiusNominal - 2)
			.outerRadius(radius);

		// -------------------------------------------------------------------
		// 2. Create or update <defs> for gradient
		//    (If you have a gradient per arc, do it once per `id`.)
		// -------------------------------------------------------------------
		let defs = svg.select<SVGDefsElement>("defs");
		if (defs.empty()) {
			defs = svg.append<SVGDefsElement>("defs");
		}

		const gradientId = `gradient-${data.id}`;
		let gradientSel = defs.select<SVGLinearGradientElement>(`#${gradientId}`);
		if (gradientSel.empty()) {
			// Create a new <linearGradient> if it doesn’t exist yet
			gradientSel = defs
				.append("linearGradient")
				.attr("id", gradientId)
				.attr("x1", "0%")
				.attr("y1", "0%")
				.attr("x2", "100%")
				.attr("y2", "0%");

			data.gradient.forEach((color, i) => {
				gradientSel
					.append("stop")
					.attr("offset", `${(i / (data.gradient.length - 1)) * 100}%`)
					.attr("stop-color", color);
			});
		}

		// -------------------------------------------------------------------
		// 3. Wrap the data in an array (if you only have one arc)
		//    so we can use .data(...) with a stable key
		// -------------------------------------------------------------------
		const arcsData = [data];

		// -------------------------------------------------------------------
		// 4. BACKGROUND ARC using .join()
		// -------------------------------------------------------------------
		svg
			.selectAll<SVGPathElement, ArcData>(".background-arc")
			.data(arcsData, (d) => d.id) // key by id
			.join(
				(enter) =>
					enter
						.append("path")
						.attr("class", "background-arc")
						.attr("transform", `translate(${radius},${radius})`)
						.attr("fill", (d) => d.backgroundColor)
						// No transition if you don’t want the background to animate:
						.attr("d", (d) =>
							bgArcGen({
								...d,
								startAngle: 0.5 * 2 * Math.PI,
								endAngle: 0.5 * 2 * Math.PI + 2 * Math.PI,
							}) ?? ""
						),
				// update selection
				(update) =>
					update
						.attr("transform", `translate(${radius},${radius})`)
						.attr("fill", (d) => d.backgroundColor)
						.attr("d", (d) =>
							bgArcGen({
								...d,
								startAngle: 0.5 * 2 * Math.PI,
								endAngle: 0.5 * 2 * Math.PI + 2 * Math.PI,
							}) ?? ""
						),
				// exit selection
				(exit) => exit.remove()
			);

		// -------------------------------------------------------------------
		// 6. FOREGROUND ARC (usage) with smooth transitions
		// -------------------------------------------------------------------
		svg
			.selectAll<SVGPathElement, ArcData>(".foreground-arc")
			.data(arcsData, (d) => d.id)
			.join(
				// ENTER:
				enter =>
					enter
						.append("path")
						.attr("class", "foreground-arc")
						.attr("transform", `translate(${radius},${radius})`)
						.attr("fill", (d) =>
							// d.quantity <= d.limit ? `url(#${gradientId})` : "#ff8c8c"
							d.quantity <= d.limit ? d.gradient[1] : "#ff8c8c"
						)
						// Give it some initial angles (maybe zero-length)
						.attr("d", (d) => fgArcGen({ ...d, startAngle: 0.5 * 2 * Math.PI, endAngle: 0.5 * 2 * Math.PI }) ?? "")
						.each(function () {
							this._oldStartAngle = 0.5 * 2 * Math.PI;
						})
						.transition()
						.duration(750)
						.attrTween("d", function (d) {
							// Now tween from startAngle → endAngle
							const i = d3.interpolate(0.5 * 2 * Math.PI, d.endAngle);
							return (t) => fgArcGen({ ...d, startAngle: 0.5 * 2 * Math.PI, endAngle: i(t) }) ?? "";
						}).on("end", function (d) {
						// When the transition is done, store the new angles
						this._oldEndAngle = d.endAngle;
					}),

				// UPDATE:
				update => {
					update
						.attr("transform", `translate(${radius},${radius})`)
						.transition()
						.duration(750)
						.attrTween("d", function (d) {
							// 1) Get old angles from the existing DOM-bound data
							const oldEnd = this._oldEndAngle ?? (0.5 * 2 * Math.PI);
							const iEnd = d3.interpolate(oldEnd, d.endAngle);

							// console.log("UPDATE arc", d.id, {
							// 	oldStart,
							// 	oldEnd,
							// 	newEnd: d.endAngle,
							// });

							return (t) => fgArcGen({
								...d,
								startAngle: 0.5 * 2 * Math.PI,  // or oldStart, if you prefer
								endAngle: iEnd(t),
							}) ?? "";
						})
						.on("end", function (d) {
							this._oldEndAngle = d.endAngle;
						});
				},

				// EXIT
				exit => exit.remove()
			);

		// -------------------------------------------------------------------
		// 5. WARNING ARC using .join()
		//    only if quantity > limit
		// -------------------------------------------------------------------
		const showWarning = data.quantity > data.limit+1;
		svg
			.selectAll<SVGPathElement, ArcData>(".warning-arc")
			// If showWarning is false, supply an empty array → they all exit
			.data(showWarning ? arcsData : [], (d) => d.id)
			.join(
				(enter) =>
					enter
						.append("path")
						.attr("class", "warning-arc")
						.attr("transform", `translate(${radius},${radius})`)
						.attr("fill", "#ff2525")
						.attr("d", (d) =>
							warningArcGen({
								...d,
								startAngle: 0.5 * 2 * Math.PI,
								endAngle: 0.5 * 2 * Math.PI + 2 * Math.PI,
							}) ?? ""
						),
				(update) =>
					update
						.attr("transform", `translate(${radius},${radius})`)
						.attr("fill", "#ff2525")
						.attr("d", (d) =>
							warningArcGen({
								...d,
								startAngle: 0.5 * 2 * Math.PI,
								endAngle: 0.5 * 2 * Math.PI + 2 * Math.PI,
							}) ?? ""
						),
				(exit) => exit.remove()
			);


	}, [data, radius]);
	// useEffect(() => {
	// 	console.log(`[${data.id}] Mounted CircularResourceGraph`);
	// 	return () => {
	// 		console.log(`[${data.id}] Unmounted CircularResourceGraph`);
	// 	};
	// }, []);

	return (
		<div style={{
			position: "relative",
			minWidth: radius * 2,
			height: radius * 2
		}}>
			<svg ref={svgRef} width={radius * 2} height={radius * 2}/>
			<div
				style={{
					position: "absolute",
					top: "50%",
					left: "50%",
					transform: "translate(-50%, -50%)",
					textAlign: "center",
				}}
			>
				{/*<Typography variant="h6" component="div">*/}
				{/*	{`${(100*(data.quantity/data.limit)).toFixed(2).toLocaleString()}%`}*/}
				{/*</Typography>*/}
				{/*<Divider style={{margin: "2px 0"}}/>*/}
				{/*<Typography variant="body2" component="div">*/}
				{/*	{data.limit.toLocaleString('en-US')}*/}
				{/*</Typography>*/}
			</div>
		</div>
	);
};

const MemoizedCircularResourceGraph = React.memo(
	CircularResourceGraph,
	(prevProps, nextProps) => {
		// Return true only if *all* relevant fields are the same.
		return (
			prevProps.width === nextProps.width &&
			prevProps.data.id === nextProps.data.id &&
			prevProps.data.quantity === nextProps.data.quantity &&
			prevProps.data.limit === nextProps.data.limit
			// possibly check gradient array equality, etc.
		);
	}
);


const D3GlobalResourceLimitViz: React.FC<D3ResourceUseGraphProps> = ({data, maxHeight}) => {
	const processedData = useMemo(
		() => {
			const usage = data.raw_resource_usage
			const lookup = raw_resource_lookup
			const no_water = usage.filter((item) => item.item_id !== 157);
			const mapped_data = no_water.map((item) => ({
				id: item.item_id,
				name: lookup[item.item_id]?.display_name || "Unknown",
				quantity: item.total_quantity,
				limit: lookup[item.item_id]?.global_limit || 0,
				gradient: lookup[item.item_id]?.gradient || [
					"#ffffff",
					"#2196F3",
					"#1976D2",
				],
				backgroundColor: "#fff3f3",
				endAngle:
					0.5 * 2 * Math.PI +
					Math.min(item.total_quantity / (lookup[item.item_id]?.global_limit || 0), 1) *
					2 *
					Math.PI,
			}));
			return mapped_data.sort((a, b) => b.quantity - a.quantity);
		},
		[data, raw_resource_lookup]
	);
	// console.log("processedData:", processedData.map(d => d.id));

	return (
		<Box
			// elevation={1}
			style={{
				padding: 8,
				width: "100%",
				maxHeight: maxHeight,
				overflowY: "auto",
			}}
		>
			<Typography variant="h4" gutterBottom>
				Resource Limit Guage
			</Typography>
			<Grid container spacing={2}>
				{processedData.map((item) => (
					<Grid size={{xs: 6, sm: 4, md: 4, lg: 4}} sx={{textAlign: "center"}} key={item.name}>
						<MemoizedCircularResourceGraph width={80} data={item}/>
						<Typography variant="h5">{item.name}</Typography>
						<Typography variant="h6" component="div">
							{`${(100*(item.quantity/item.limit)).toFixed(2).toLocaleString()}%`}
						</Typography>
					</Grid>
				))}
			</Grid>
		</Box>
	);
};

export default D3GlobalResourceLimitViz;