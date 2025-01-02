import {
	Box,
	FormControlLabel,
	FormGroup,
	Slider,
	Switch,
	ToggleButton,
	ToggleButtonGroup,
	Typography
} from "@mui/material";
import Stack from "@mui/material/Stack";
import {useTheme} from "@mui/material/styles";
import useResizeObserver from "@react-hook/resize-observer";
import * as d3 from "d3";
import {SankeyGraph} from "d3-sankey";
import {sankeyCircular, sankeyLeft, sankeyRight, sankeyCenter, sankeyJustify} from "d3-sankey-circular";
import React, {useEffect, useMemo, useRef, useState} from "react";
import useProcessedNodesAndLinks from "../../hooks/useProcessedNodesAndLinks.ts";
import {NodesAndLinksData, SankeyNodesAndLinksData} from "../../types/Other.ts";
import {OptimizationResult} from "../../types/ProductionLine.ts";
import FormatAlignJustifyIcon from '@mui/icons-material/FormatAlignJustify';
import FormatAlignRightIcon from '@mui/icons-material/FormatAlignRight';
import FormatAlignLeftIcon from '@mui/icons-material/FormatAlignLeft';
import FormatAlignCenterIcon from '@mui/icons-material/FormatAlignCenter';

interface D3SnakeyGraphContainerProps {
	data: OptimizationResult;
	maxHeight: number;
}

interface D3SnakeyGraphProps {
	data: OptimizationResult;
	width: number;
	maxHeight: number;
	alignment: 'sankeyLeft' | 'sankeyRight' | 'sankeyCenter' | 'sankeyJustify';
	nodePadding: number;
	toggleHighlightEffect: boolean;
}

interface FixedNodeProps extends SankeyEnhancedNode {
	id: string;
	type: string;
	rate: number;
	recipeName: string;
	standard_item_name: string;
	building_name: string;
	item_name: string;
}

interface FixedLinkProps {
	source: FixedNodeProps;
	target: FixedNodeProps;
	item_name: string;
	item_id: number;
	quantity: number;
	value: number;
	optimal: string;
	gradientId: string;
	path: string,
	circular: boolean,
	y0: number,
	y1: number,
	width: number,
	index: number,
	circularLinkType?: "top" | "bottom",
}

interface FixedNodeAndLinkData {
	nodes: FixedNodeProps[];
	links: FixedLinkProps[];
}


const useProcessSankeyData = (processedData: NodesAndLinksData): SankeyNodesAndLinksData => {
	const [processing, setProcessing] = useState<boolean>(true);
	const [nodes, setNodes] = useState<SankeyInputNode[]>([]);
	const [links, setLinks] = useState<SankeyInputLink[]>([])

	useEffect(() => {
		if (processedData.processing) {
			if (!processing) setProcessing(true);
			return;
		} else if (processing) {
			setProcessing(false);
		}
		const newNodes = processedData.nodes.map((node) => {
			return {
				name: `${node.type}:${node.id.toString()}`
			}
		})
		const newLinks = processedData.links.map((link) => {
			return {
				source: `${link.source.type}:${link.source.id.toString()}`,
				target: `${link.target.type}:${link.target.id.toString()}`,
				value: link.quantity,
				optimal: "yes",
			}
		})

		setNodes(newNodes);
		setLinks(newLinks);
		setProcessing(false);
	}, [
		processedData.processing,
		processedData.nodes,
		processedData.links,
	]);

	return {nodes, links, processing}
}

const D3SnakeyGraph: React.FC<D3SnakeyGraphProps> = ({
																											 data,
																											 width,
																											 maxHeight,
																											 alignment,
																											 nodePadding,
																											 toggleHighlightEffect
																										 }) => {
	const svgRef = useRef<SVGSVGElement | null>(null);
	const theme = useTheme();
	const linkColor = "source-target";
	const processedData: NodesAndLinksData = useProcessedNodesAndLinks(data)
	const {nodes, links, processing}: SankeyNodesAndLinksData = useProcessSankeyData(processedData);
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
		if (!svgRef.current || processing || processedData.processing) return;

		const height = maxHeight;
		const margin = {top: 20, right: 10, bottom: 20, left: 10};
		const graphWidth = width - margin.right - margin.left;
		const graphHeight = height - margin.top - margin.bottom;

		// Create a SVG container.
		const svg = d3.select<SVGSVGElement, FixedNodeAndLinkData>(svgRef.current)
			.attr('width', graphWidth)
			.attr("height", graphHeight)
			.attr("viewBox", [0, 0, graphWidth, graphHeight])
			.attr("style", "max-width: 100%; height: auto; font: 10px sans-serif;")
			.style("background-color", theme.palette.background.paper)

		const format = d3.format(",.3f");
		const mappedAlignment = {
			"sankeyLeft": sankeyLeft,
			"sankeyRight": sankeyRight,
			"sankeyCenter": sankeyCenter,
			"sankeyJustify": sankeyJustify
		}
		// Constructs and configures a Sankey generator.
		const sankeyGenerator = sankeyCircular()
			.nodeId(d => d.name)
			.nodeAlign(mappedAlignment[alignment]) // sankeyLeft, etc.
			.nodeWidth(15)
			.nodePaddingRatio(Math.max(nodePadding, 0.05))
			.extent([[1, 5], [graphWidth - 1, graphHeight - 5]])
			.circularLinkGap(5) // Customize the gap for circular links

		const graph: SankeyGraph<SankeyInputNode, SankeyInputLink> = {
			// nodes: processedData.nodes.map(d => Object.assign({}, d)),
			// links: mappedLinks.map(d => Object.assign({}, d))
			nodes,
			links
		};

		const {nodes: layoutNodes, links: layoutLinks}: {
			nodes: SankeyEnhancedNode[];
			links: SankeyEnhancedLink[]
		} = sankeyGenerator(graph);

		// const depthExtent = d3.extent(layoutNodes, function (d) {
		// 	return d.depth;
		// });

		const getNodeText = (node: FixedNodeProps, type: string) => {
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
			svg.append("g").attr("class", "links")
				.attr("transform", `translate(0, ${margin.top})`);
		}

		// Check if the group with class 'nodes' exists, if not, append it
		if (svg.select(".nodes").empty()) {
			svg.append("g").attr("class", "nodes")
				.attr("transform", `translate(0, ${margin.top})`);
		}

		// Check if the group with class 'labels' exists, if not, append it
		if (svg.select(".labels").empty()) {
			svg.append("g").attr("class", "labels")
				.attr("transform", `translate(0, ${margin.top})`);
		}

		svg.call(
			d3.zoom<SVGSVGElement, FixedNodeAndLinkData>()
				.scaleExtent([0.1, 5])
				.on("zoom", (event: d3.D3ZoomEvent<SVGSVGElement, FixedNodeAndLinkData>) => {
					svg.select(".links").attr("transform", event.transform.toString());
					svg.select(".nodes").attr("transform", event.transform.toString());
					svg.select(".labels").attr("transform", event.transform.toString());
					svg.select(".labels").selectAll("text").attr("font-size", 12 / event.transform.k);
				})
		);

		let defs = svg.select<SVGDefsElement>("defs");
		if (defs.empty()) {
			defs = svg.append<SVGDefsElement>("defs");
		}

		const fixedNodes: FixedNodeProps[] = layoutNodes.map((node) => {
			const id = node.name
			const correspondingNode = processedData.nodes.find((pd_node) => pd_node.id === Number(node.name.split(':')[1]) && pd_node.type === node.name.split(':')[0])
			return {
				...node,
				id: id,
				type: correspondingNode?.type || "node not found",
				rate: correspondingNode?.rate || 0,
				recipeName: correspondingNode?.recipeName || "node not found",
				standard_item_name: correspondingNode?.standard_item_name || "node not found",
				item_name: correspondingNode?.item_name || "node not found",
				building_name: correspondingNode?.building_name || "node not found",
			}
		})

		const fixedLinks: FixedLinkProps[] = layoutLinks.map((link) => {
			const source_id = link.source.name
			const target_id = link.target.name
			const numericSourceId = Number(link.source.name.split(':')[1])
			const source_type = link.source.name.split(':')[0]
			const numericTargetId = Number(link.target.name.split(':')[1])
			const target_type = link.target.name.split(':')[0]
			const correspondingLink = processedData.links.find((pd_link) => (pd_link.source.id === numericSourceId && pd_link.source.type === source_type) && (pd_link.target.id === numericTargetId && pd_link.target.type === target_type))
			return {
				...link,
				item_name: correspondingLink?.item_name || "link not found",
				item_id: correspondingLink?.item_id || 0,
				quantity: correspondingLink?.quantity || 0,
				gradientId: "",
				source: fixedNodes.find((node) => node.id === source_id)!,
				target: fixedNodes.find((node) => node.id === target_id)!,
			}
		})

		fixedLinks.forEach((d) => {
			if (d.gradientId === undefined || d.gradientId === "") {
				// const gradientId = `gradient-${d.source.type === "recipe" ? "recipe" : "item"}:${d.source.id}-${d.target.type === "recipe" ? "recipe" : "item"}:${d.target.id}`;
				const gradientId = `gradient-${d.source.id}-${d.target.id}`;

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
			.selectAll<SVGPathElement, FixedNodeProps>("rect")
			.data(fixedNodes, d => d.id)
			.join(
				enter => {
					const e = enter.append("rect");
					e
						.attr("stroke", (d) => (d.y1-d.y0) > 1 ? "#000" : "rgba(0,0,0,0.35)")
						.attr("fill", d => colorScale(getNodeText(d, "category")))
						.attr("x", d => d.x0)
						.attr("y", d => d.y0)
						.attr("width", d => d.x1 - d.x0)
						.attr("height", d => d.y1 - d.y0)
						.on("mouseover", (_event, d) => {
							if (toggleHighlightEffect) {
								const thisId = d.id;

								svg.select(".nodes").selectAll<SVGPathElement, FixedNodeProps>("rect")
									.style("opacity", n => {
										return n.id === thisId ||
										n.sourceLinks.some(link => link.target.name === thisId) ||
										n.targetLinks.some(link => link.source.name === thisId)
											? 1 : 0.3;
									});

								svg.select(".links").selectAll<SVGPathElement, FixedLinkProps>("path")
									.style("opacity", l => (l.source.id === thisId || l.target.id === thisId ? 1 : 0.3));

								svg.select(".labels").selectAll<SVGTextElement, FixedNodeProps>("text")
									.style("opacity", n => {
										return n.id === thisId ||
										n.sourceLinks.some(link => link.target.name === thisId) ||
										n.targetLinks.some(link => link.source.name === thisId)
											? 1 : 0.3;
									});
							}
						})
						.on("mouseout", () => {
							if (toggleHighlightEffect) {
								d3.select(".nodes").selectAll<SVGPathElement, FixedNodeProps>("rect").style("opacity", 1);
								d3.select(".links").selectAll<SVGPathElement, FixedLinkProps>("path").style("opacity", 1);
								d3.select(".labels").selectAll<SVGTextElement, FixedNodeProps>("text").style("opacity", 1);
							}
						})
						.call(enter => enter.append("title").text(d => `${getNodeText(d, "name")}\n${format(d.rate)} x ${d.building_name}`))
					return e;
				},
				update => {
					update
						.attr("fill", d => colorScale(getNodeText(d, "category")))
						// .transition().duration(200)
						.attr("width", d => d.x1 - d.x0)
						.attr("height", d => d.y1 - d.y0)
						.on("mouseover", (_event, d) => {
							if (toggleHighlightEffect) {
								const thisId = d.id;

								svg.select(".nodes").selectAll<SVGPathElement, FixedNodeProps>("rect")
									.style("opacity", n => {
										return n.id === thisId ||
										n.sourceLinks.some(link => link.target.name === thisId) ||
										n.targetLinks.some(link => link.source.name === thisId)
											? 1 : 0.3;
									});

								svg.select(".links").selectAll<SVGPathElement, FixedLinkProps>("path")
									.style("opacity", l => (l.source.id === thisId || l.target.id === thisId ? 1 : 0.3));

								svg.select(".labels").selectAll<SVGTextElement, FixedNodeProps>("text")
									.style("opacity", n => {
										return n.id === thisId ||
										n.sourceLinks.some(link => link.target.name === thisId) ||
										n.targetLinks.some(link => link.source.name === thisId)
											? 1 : 0.3;
									});
							}
						})
						.on("mouseout", () => {
							if (toggleHighlightEffect) {
								d3.select(".nodes").selectAll<SVGPathElement, FixedNodeProps>("rect").style("opacity", 1);
								d3.select(".links").selectAll<SVGPathElement, FixedLinkProps>("path").style("opacity", 1);
								d3.select(".labels").selectAll<SVGTextElement, FixedNodeProps>("text").style("opacity", 1);
							}
						})
						.transition().duration(750)
						.attr("x", d => d.x0)
						.attr("y", d => d.y0)
						.select("title").text(d => `${getNodeText(d, "name")}\n${format(d.rate)} x ${d.building_name}`)
					return update;
				}
				,
				exit => {
					exit
						.transition()
						.duration(750)
						.style("opacity", 0)
						.remove()
					return exit;
				}
			);

		// Update the links
		svg.select(".links")
			.selectAll<SVGPathElement, FixedLinkProps>("path")
			.data(fixedLinks, d => `${d.source.id}-${d.target.id}`)
			.join(
				enter => {
					const e = enter.append("path")
						.attr("fill", "none")
						.call(enterSel => {
							enterSel.append("title")
						})
						.attr("d", d => d.path)
						.attr("stroke-opacity", 0.5)
						.attr("stroke-width", d => Math.max(1, d.width))
						.attr("stroke", d => {
							if (d.circular) {
								return "red"
							} else {
								return `url(#${d.gradientId})`
							}
							// if (linkColor === "source-target") {
							// 	return `url(#${d.gradientId})`
							// }
							// if (linkColor === "source") return colorScale(getNodeText(d.source, "category"));
							// if (linkColor === "target") return colorScale(getNodeText(d.target, "category"));
							// return linkColor;
						})
						.on("mouseover", (_event, l) => {
							if (toggleHighlightEffect) {
								const source = l.source.id;
								const target = l.target.id;

								svg.select(".nodes").selectAll<SVGPathElement, FixedNodeProps>("rect")
									.style("opacity", n => {
										return n.id === source || n.id === target ? 1 : 0.3;
									});

								svg.select(".links").selectAll<SVGPathElement, FixedLinkProps>("path")
									.style("opacity", l => (l.source.id === source && l.target.id === target ? 1 : 0.3));

								svg.select(".labels").selectAll<SVGTextElement, FixedNodeProps>("text")
									.style("opacity", n => {
										return n.id === source || n.id === target ? 1 : 0.3;
									});
							}
						})
						.on("mouseout", () => {
							if (toggleHighlightEffect) {
								d3.select(".nodes").selectAll<SVGPathElement, FixedNodeProps>("rect").style("opacity", 1);
								d3.select(".links").selectAll<SVGPathElement, FixedLinkProps>("path").style("opacity", 1);
								d3.select(".labels").selectAll<SVGTextElement, FixedNodeProps>("text").style("opacity", 1);
							}
						})
						.call(enterSel => enterSel.select("title").text(d => `${getNodeText(d.source, "name")} → ${d.item_name} → ${getNodeText(d.target, "name")}\n${format(d.value)} /min`))
					return e;
				},
				update => {
					update
						.on("mouseover", (_event, l) => {
							if (toggleHighlightEffect) {
								const source = l.source.id;
								const target = l.target.id;

								svg.select(".nodes").selectAll<SVGPathElement, FixedNodeProps>("rect")
									.style("opacity", n => {
										return n.id === source || n.id === target ? 1 : 0.3;
									});

								svg.select(".links").selectAll<SVGPathElement, FixedLinkProps>("path")
									.style("opacity", l => (l.source.id === source && l.target.id === target ? 1 : 0.3));

								svg.select(".labels").selectAll<SVGTextElement, FixedNodeProps>("text")
									.style("opacity", n => {
										return n.id === source || n.id === target ? 1 : 0.3;
									});
							}
						})
						.on("mouseout", () => {
							if (toggleHighlightEffect) {
								d3.select(".nodes").selectAll<SVGPathElement, FixedNodeProps>("rect").style("opacity", 1);
								d3.select(".links").selectAll<SVGPathElement, FixedLinkProps>("path").style("opacity", 1);
								d3.select(".labels").selectAll<SVGTextElement, FixedNodeProps>("text").style("opacity", 1);
							}
						})
						.transition()
						.duration(750)
						.attr("stroke-width", d => Math.max(1, d.width))
						.attr("stroke", d => {
							if (d.circular) {
								return "red"
							} else {
								return `url(#${d.gradientId})`
							}
							// if (linkColor === "source-target") {
							// 	return `url(#${d.gradientId})`
							// }
							// if (linkColor === "source") return colorScale(getNodeText(d.source, "category"));
							// if (linkColor === "target") return colorScale(getNodeText(d.target, "category"));
							// return linkColor;
						})
						.attr("d", d => d.path)
						.select("title").text(d => `${getNodeText(d.source, "name")}  → ${d.item_name} → ${getNodeText(d.target, "name")}\n${format(d.value)} /min`)
					return update
				}
				,
				exit => {
					exit
						.transition()
						.duration(750)
						.style("opacity", 0)
						.remove()
					return exit
				}
			);

		// Update the labels
		svg.select(".labels")
			.selectAll<SVGTextElement, FixedNodeProps>("text")
			.data(fixedNodes, d => d.id)
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
					.attr("dy", "0.35em")
					.attr("x", d => d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6)
					.attr("y", d => (d.y1 + d.y0) / 2)
					.attr("fill", theme.palette.text.primary)
					.text(d => d.type === "recipe" ? "" : getNodeText(d, "name")),
				// .text(d => d.type === "recipe" ? getNodeText(d, "category") : getNodeText(d, "name")),
				exit => exit.transition().duration(750).style("opacity", 0).remove()
			)
	}, [nodes, links, width, maxHeight, processing, alignment, nodePadding, toggleHighlightEffect, theme]);

	return <svg ref={svgRef}/>;
}

const D3SnakeyGraphContainer: React.FC<D3SnakeyGraphContainerProps> = ({data, maxHeight}) => {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const [width, setWidth] = useState(300);
	const [alignment, setAlignment] = React.useState<D3SnakeyGraphProps['alignment']>('sankeyJustify');
	const [nodePadding, setPadding] = React.useState(70)
	const [toggleHighlightEffect, setToggleHighlightEffect] = React.useState(true)

	const handleChangeHighlight = () => {
		setToggleHighlightEffect(!toggleHighlightEffect)
	}
	const handleChange = (event: React.MouseEvent<HTMLElement, MouseEvent>, newAlignment: D3SnakeyGraphProps['alignment']) => {
		setAlignment(newAlignment);
	};

	const handlePaddingChange = (event: Event, newPadding: number) => {
		setPadding(newPadding);
	}

	useResizeObserver(containerRef, (entry) => {
		if (entry.contentBoxSize) {
			// contentBoxSize can vary by browser; fallback to getBoundingClientRect()
			setWidth(entry.contentRect.width);
		}
	});
	const control = {
		value: alignment,
		onChange: handleChange,
		exclusive: true,
	};
	const children = [
		<ToggleButton value="sankeyLeft" key="left">
			<FormatAlignLeftIcon/>
		</ToggleButton>,
		<ToggleButton value="sankeyCenter" key="center">
			<FormatAlignCenterIcon/>
		</ToggleButton>,
		<ToggleButton value="sankeyRight" key="right">
			<FormatAlignRightIcon/>
		</ToggleButton>,
		<ToggleButton value="sankeyJustify" key="justify">
			<FormatAlignJustifyIcon/>
		</ToggleButton>,
	];

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
			<Stack direction="column">
				<Typography variant="h4" gutterBottom>
					Sankey Graph
				</Typography>

				<Stack direction="row" spacing={2} sx={{justifyContent: "space-between"}}>

					<Stack direction="column" sx={{display: 'flex', width: 80, alignItems: 'center'}}>
						<Typography sx={{display: 'inline', width: 200}}>
							Node Padding
						</Typography>
						<Slider aria-label="Node Padding" value={nodePadding as number} onChange={(e, value) => {
							if (typeof value === "number") {
								handlePaddingChange(e, value);
							}
						}}/>
					</Stack>
					<Box>
						<ToggleButtonGroup size="small" color={"primary"} {...control} aria-label="Small sizes">
							{children}
						</ToggleButtonGroup>
					</Box>
					<FormGroup>
						<FormControlLabel control={<Switch checked={toggleHighlightEffect} onChange={handleChangeHighlight}
																							 inputProps={{'aria-label': 'controlled'}}/>}
															label="Highlight"/>
					</FormGroup>
				</Stack>
				<div ref={containerRef}>
					<D3SnakeyGraph data={data} width={width} maxHeight={maxHeight} alignment={alignment}
												 nodePadding={nodePadding / 100} toggleHighlightEffect={toggleHighlightEffect}/>
				</div>
			</Stack>
		</Box>
	);
}

export default D3SnakeyGraphContainer;
