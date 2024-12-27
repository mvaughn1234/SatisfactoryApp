import {Box, Typography} from "@mui/material";
import {useTheme} from "@mui/material/styles";
import useResizeObserver from "@react-hook/resize-observer";
import * as d3 from "d3";
import React, {useEffect, useMemo, useRef, useState} from "react";
import raw_resource_lookup from "../../data/rawResourceLookup.ts";
import ProcessNodesAndLinks from "../../hooks/useProcessedNodesAndLinks.ts";
import {NodesAndLinksData, node_props, sankey_link_props, SankeyNodesAndLinksData} from "../../types/Other.ts";
import {OptimizationResult} from "../../types/ProductionLine.ts";
import { sankey, SankeyGraph, sankeyCenter, sankeyJustify, sankeyLeft, sankeyRight, SankeyNode, SankeyLink, sankeyLinkHorizontal} from "d3-sankey";
import { sankeyCircular } from "d3-sankey-circular";

interface D3SnakeyGraphContainerProps {
	data: OptimizationResult;
	maxHeight: number;
}

interface D3SnakeyGraphProps {
	data: OptimizationResult;
	width: number;
	maxHeight: number;
}


const D3SnakeyGraph: React.FC<D3SnakeyGraphProps> = ({data, width, maxHeight}) => {
	const svgRef = useRef<SVGSVGElement | null>(null);
	const theme = useTheme();
	const linkColor = "source-target";
	const processedData: NodesAndLinksData = ProcessNodesAndLinks(data)
	const categorySet = [
		"Quantum Encoder",
		"Particle Accelerator",
		"Packager",
		"Other",
		"Blender",
		"Foundry",
		"Assembler",
		"Constructor",
		"Converter",
		"Refinery",
		"Manufacturer",
		"Smelter",
	]

	// Create a persistent color scale
	const colorScale = useMemo(() => {
		return d3.scaleOrdinal(d3.schemePaired).domain(categorySet);
	}, []);

	useEffect(() => {
		if (!svgRef.current || processedData.processing) return;

		const height = maxHeight;
		const margin = {top: 20, right: 10, bottom: 20, left: 105};

		// Create a SVG container.
		const svg = d3.select<SVGSVGElement, SankeyNodesAndLinksData>(svgRef.current)
			.attr('width', width)
			.attr("height", height)
			.attr("viewBox", [0, 0, width, height])
			.attr("style", "max-width: 100%; height: auto; font: 10px sans-serif;");
		// .style("background", "#000")

		const format = d3.format(",.3f");

		// Constructs and configures a Sankey generator.
		const sankeyGenerator = sankeyCircular<node_props, sankey_link_props>()
			.nodeId(d => d.id)
			.nodeAlign(sankeyJustify) // sankeyLeft, etc.
			.nodeWidth(15)
			// .nodePadding(5)
			.nodePaddingRatio(0.7)
			.extent([[1, 5], [width - 1, height - 5]])
			.circularLinkGap(5) // Customize the gap for circular links

		// Applies it to the data. We make a copy of the nodes and links objects
		// so as to avoid mutating the original.
		// const {nodes, links} = sankeyGraph({
		// 	nodes: processedData.nodes.map(d => Object.assign({}, d)),
		// 	links: processedData.links.map(d => Object.assign({}, d))
		// });
		const mappedLinks: sankey_link_props[] = processedData.links.map((link) => {
			return {
				source: link.source.id,
				target: link.target.id,
				value: link.quantity,
				item_id: link.item_id,
				item_name: link.item_name
			}
		})
		// console.log("Nodes and Links into Sankey: ", processedData.nodes, mappedLinks)
		const graph: SankeyGraph<node_props, sankey_link_props> = {
			// nodes: processedData.nodes.map(d => Object.assign({}, d)),
			// links: mappedLinks.map(d => Object.assign({}, d))
			nodes: processedData.nodes.map(d => ({...d})),
			links: mappedLinks.map(d => ({...d}))
		};

		// console.log("Graph: ", graph)
		const {nodes: layoutNodes, links: layoutLinks} = sankeyGenerator(graph);

		const getNodeText = (node: node_props, type: string) => {
			if (type === "category") {
				if (node.type === "recipe") {
					// return node.building_name || "no building"
					return node.building_name || "Other"
				} else {
					return "Other"
				}
			} else {
				if (node.type === "recipe") {
					// return node.recipeName || "no recipe name"
					return node.recipeName || "Other"
				} else {
					return node.item_name || "Other"
					// return node.item_name || "no item name"
				}
			}
		}

		// Check if the group with class 'links' exists, if not, append it
		if (svg.select(".links").empty()) {
			svg.append("g").attr("class", "links");
		}

		// Check if the group with class 'nodes' exists, if not, append it
		if (svg.select(".nodes").empty()) {
			svg.append("g").attr("class", "nodes");
		}

		// Check if the group with class 'labels' exists, if not, append it
		if (svg.select(".labels").empty()) {
			svg.append("g").attr("class", "labels");
		}

		svg.call(
			d3.zoom<SVGSVGElement, SankeyNodesAndLinksData>()
				.scaleExtent([0.1, 5])
				.on("zoom", (event: d3.D3ZoomEvent<SVGSVGElement, SankeyNodesAndLinksData>) => {
					svg.select(".links").attr("transform", event.transform.toString());
					svg.select(".nodes").attr("transform", event.transform.toString());
					svg.select(".labels").attr("transform", event.transform.toString());
				})
		);

		// Define the domain of the color scale dynamically based on data
		const categories = Array.from(
			new Set(processedData.nodes.map((node) => getNodeText(node, "category")))
		);
		// colorScale.domain(categories);

		let defs = svg.select("defs");
		if (defs.empty()) {
			defs = svg.append("defs");
		}

		layoutLinks.forEach((d) => {
			if (d.gradientId === undefined || d.gradientId === "") {
				const gradientId = `gradient-${d.source.type === "recipe" ? "recipe" : "item"}:${d.source.id}-${d.target.type === "recipe" ? "recipe" : "item"}:${d.target.id}`;

				const gradient = defs.append("linearGradient")
					.attr("id", gradientId)
					.attr("x1", d.source.x1)
					.attr("x2", d.target.x0)
					.attr("gradientUnits", "userSpaceOnUse")

				gradient.append("stop")
					.attr("offset", "0%")
					.attr("stop-color", colorScale(getNodeText(d.source, "category")));

				gradient.append("stop")
					.attr("offset", "100%")
					.attr("stop-color", colorScale(getNodeText(d.target, "category")));

				// Attach gradient ID to each data item
				d.gradientId = gradientId;
			}
		});


		svg.select(".nodes")
			.selectAll("rect")
			.data(layoutNodes, d => d.id)
			.join(
				enter => enter.append("rect")
					.attr("stroke", "#000")
					.attr("fill", d => colorScale(getNodeText(d, "category")))
					.attr("x", d => {
						if (!d.x0) {
							console.log("no d.x0: ", d)
						}
						return d.x0
					})
					.attr("y", d => d.y0)
					.attr("width", d => d.x1 - d.x0)
					.attr("height", d => d.y1 - d.y0)
					.call(enter => enter.append("title").text(d => `${getNodeText(d, "name")}\n${format(d.value)} /min\n${format(d.rate)} x ${d.building_name}`)),
				update => update
					.transition().duration(750)
					.attr("x", d => d.x0)
					.attr("y", d => d.y0)
					.attr("width", d => d.x1 - d.x0)
					.attr("height", d => d.y1 - d.y0)
					.attr("fill", d => colorScale(getNodeText(d, "category")))
					.select("title").text(d => `${getNodeText(d, "name")}\n${format(d.value)} /min\n${format(d.rate)} x ${d.building_name}`),
				exit => exit.transition().duration(750).style("opacity", 0).remove()
			);

		// Update the links
		svg.select(".links")
			.selectAll("path")
			.data(layoutLinks, d => `${d.source.id}-${d.target.id}`)
			.join(
				enter => enter.append("path")
					.attr("fill", "none")
					.attr("stroke-opacity", 0.5)
					.attr("stroke", d => {
						if (linkColor === "source-target") {
							if (!d.gradientId) {
								console.log("D no gradient id: ", d, d.gradientId);
							}
							return `url(#${d.gradientId})`
						};
						if (linkColor === "source") return colorScale(getNodeText(d.source, "category"));
						if (linkColor === "target") return colorScale(getNodeText(d.target, "category"));
						return linkColor;
					})
					.attr("stroke-width", d => Math.max(1, d.width))
					.attr("d", sankeyLinkHorizontal())
					.call(enter => enter.append("title").text(d => `${getNodeText(d.source, "name")} → ${getNodeText(d.target, "name")}\n${format(d.value)} /min`)),
				update => update
					.transition().duration(750)
					.attr("stroke-width", d => Math.max(1, d.width))
					.attr("d", sankeyLinkHorizontal())
					// .attr("stroke", d => {
					// 	if (linkColor === "source-target") return `url(#${d.gradientId})`;
					// 	if (linkColor === "source") return colorScale(getNodeText(d.source, "category"));
					// 	if (linkColor === "target") return colorScale(getNodeText(d.target, "category"));
					// 	return linkColor;
					// })
					.select("title").text(d => `${getNodeText(d.source, "name")} → ${getNodeText(d.target, "name")}\n${format(d.value)} /min`),
				exit => exit.transition().duration(750).style("opacity", 0).remove()
			);

		// Update the labels
		svg.select(".labels")
			.selectAll("text")
			.data(layoutNodes, d => d.id)
			.join(
				enter => enter.append("text")
					.attr("dy", "0.35em")
					.attr("text-anchor", d => d.x0 < width / 2 ? "start" : "end")
					.attr("x", d => d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6)
					.attr("y", d => (d.y1 + d.y0) / 2)
					.attr("fill", theme.palette.text.primary)
					// .text(d => d.type === "recipe" ? getNodeText(d, "category") : getNodeText(d, "name")),
					.text(d => d.type === "recipe" ? "" : getNodeText(d, "name")),
				update => update
					.transition().duration(750)
					.attr("x", d => d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6)
					.attr("y", d => (d.y1 + d.y0) / 2)
					.attr("fill", theme.palette.text.primary)
					.text(d => d.type === "recipe" ? "" : getNodeText(d, "name")),
					// .text(d => d.type === "recipe" ? getNodeText(d, "category") : getNodeText(d, "name")),
				exit => exit.transition().duration(750).style("opacity", 0).remove()
			)
	}, [processedData, width, maxHeight]);

	return <svg ref={svgRef}/>;
}

const D3SnakeyGraphContainer: React.FC<D3SnakeyGraphContainerProps> = ({data, maxHeight}) => {
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
				Sankey Graph
			</Typography>

			<div ref={containerRef}>
				<D3SnakeyGraph data={data} width={width} maxHeight={maxHeight}/>
			</div>
		</Box>
	);
}

export default D3SnakeyGraphContainer;