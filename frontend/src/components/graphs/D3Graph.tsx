import React, {useRef, useEffect, useState} from "react";
import * as d3 from "d3";
import ReactDOM from "react-dom/client";
import {useAppStaticData} from "../../store/AppStaticDataStore.tsx";
import {OptimizationResult} from "../../types/ProductionLine.ts";
import RecipeNode from "./RecipeNode.tsx";
import raw_resource_lookup from "../../data/rawResourceLookup.ts";

interface GraphProps {
	data: OptimizationResult;
	height?: number;
}

interface node_props {
	fx: number | null;
	fy: number | null;
	x: number;
	y: number;
	id: number;
	type: string;
	rate: number;
	building_name: string | null;
}

interface link_props {
	source: node_props;
	target: node_props;
	item_id: number;
	quantity: number;
}

const D3Graph: React.FC<GraphProps> = ({
																				 data,
																				 height = 600,
																			 }) => {
	const containerRef = useRef<HTMLDivElement>(null);
	const [width, setWidth] = useState<number>(0);

	const {recipesComponentsDetail, itemsComponentsDetail, recipesGroupedDetail, loading} = useAppStaticData();

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
		if (!data || !containerRef.current || width === 0) return;

		// Clear previous SVG content
		d3.select(containerRef.current).select("svg").remove();

		const transformData = (graph: OptimizationResult) => {
			const nodes: node_props[] = [];
			const links: link_props[] = [];

			const addNode = (id: number, type: string, rate: number = 0, building_name: string | null = null) => {
				if (!nodes.find((node) => node.id === id)) {
					nodes.push({id, type, rate, building_name, x: 0, y: 0, fx: null, fy: null});
				}
			};

			// Extract sets of items from raw usage, target outputs, and gather usedAsInput
			const rawResources = new Set(graph.raw_resource_usage.map((res) => res.item_id));
			const targetOutputs = new Set(graph.target_output.map((output) => output.item_id));

			// 1. Precompute usedAsInput
			const usedAsInput = new Set();
			Object.entries(graph.production_line).forEach(([, {recipe_data}]) => {
				recipe_data.ingredients?.forEach((input) => {
					usedAsInput.add(input.id)
				})
			})

			// 2. Add raw and target nodes
			// rawResources.forEach((item_id) => addNode(`raw-${item_id}`, "raw"));
			// rawResources.forEach((item_id) => addNode(item_id, "raw"));
			rawResources.forEach((item_id) => {
				const raw = graph.raw_resource_usage.find((r) => r.item_id === item_id);
				addNode(item_id, "raw", raw?.total_quantity || 0);
			});
			targetOutputs.forEach((item_id) => {
				const target = graph.target_output.find((t) => t.item_id === item_id);
				addNode(item_id, "product", target?.amount || 0);
			});

			// 3. Add recipe nodes
			Object.entries(graph.production_line).forEach(([, {recipe_data, scale}]) => {
				addNode(recipe_data.id, "recipe", parseFloat(scale.toFixed(3)), (recipe_data.produced_in && recipe_data.produced_in.length > 0) ? recipe_data.produced_in[0].display_name : '');
			})


			// 4. Build links for inputs from producers or raw
			const p_line_objects = Object.values(graph.production_line)
			p_line_objects.forEach(({recipe_data: recipe_data_outer, scale}) => {
				recipe_data_outer.ingredients?.forEach((ingredient) => {
					// Find all producers of this input item
					const producers = p_line_objects.filter(({recipe_data}) =>
						recipe_data.products?.some((product) => product.id === ingredient.id)
					)

					const totalProduced = producers.reduce((sum, {recipe_data, scale}) => {
						const out = recipe_data.products?.find((o) => o.id === ingredient.id)

						return sum + (out ? (scale * out.amount * (60 / parseFloat(recipe_data.manufactoring_duration))) : 0)
					}, 0)

					// Compute how much the consumer needs
					const requiredAmount = ingredient.amount * scale * (60 / parseFloat(recipe_data_outer.manufactoring_duration));

					// For each producer of this ingredient
					producers.forEach(({recipe_data, scale}) => {
						const out = recipe_data.products?.find((o) => o.id === ingredient.id);
						if (out) {
							const producerQuantity = scale * out.amount * (60 / parseFloat(recipe_data.manufactoring_duration));
							const fraction = producerQuantity / totalProduced;
							const actualQuantity = fraction * requiredAmount;

							const sourceNode = nodes.find((node) => node.id === recipe_data.id);
							if (!sourceNode) {
								throw new Error(`No source node found for recipe_data.id = ${recipe_data.id}`);
							}

							const targetNode = nodes.find((node) => node.id === recipe_data_outer.id);
							if (!targetNode) {
								throw new Error(`No target node found for recipe_data_outer.id = ${recipe_data_outer.id}`);
							}

							links.push({
								source: sourceNode,
								target: targetNode,
								item_id: ingredient.id,
								quantity: parseFloat(actualQuantity.toFixed(3)), // Use the computed actual quantity
							});
						}
					});

					// If it's a raw resource, link directly
					if (rawResources.has(ingredient.id)) {
						const sourceNode = nodes.find((node) => node.id === ingredient.id);
						if (!sourceNode) {
							throw new Error(`No source node found for recipe_data.id = ${ingredient.id}`);
						}

						const targetNode = nodes.find((node) => node.id === recipe_data_outer.id);
						if (!targetNode) {
							throw new Error(`No target node found for recipe_data_outer.id = ${recipe_data_outer.id}`);
						}

						links.push({
							source: sourceNode,
							// source: `raw-${ingredient.id}`,
							target: targetNode,
							item_id: ingredient.id,
							quantity: parseFloat((scale * ingredient.amount * (60 / parseFloat(recipe_data_outer.manufactoring_duration))).toFixed(3)),
						})
					}

				})
			})

			// 5. Handle outputs: target outputs or by-products
			p_line_objects.forEach(({recipe_data, scale}) => {
				recipe_data.products?.forEach((product) => {
					const {id} = product;
					// If this item is a target output
					if (targetOutputs.has(id)) {
						const sourceNode = nodes.find((node) => node.id === recipe_data.id);
						if (!sourceNode) {
							throw new Error(`No source node found for recipe_data.id = ${recipe_data.id}`);
						}

						const targetNode = nodes.find((node) => node.id === id);
						if (!targetNode) {
							throw new Error(`No target node found for recipe_data_outer.id = ${id}`);
						}

						links.push({
							source: sourceNode,
							target: targetNode,
							item_id: id,
							quantity: parseFloat((scale * product.amount * (60 / parseFloat(recipe_data.manufactoring_duration))).toFixed(3)),
						});
					} else if (!usedAsInput.has(id) && !rawResources.has(id)) {
						// If not used as input and not a target output, it's a by-product
						const byNodeId = id;
						// const byNodeId = `by-${id}`;
						addNode(byNodeId, "by-product");
						const sourceNode = nodes.find((node) => node.id === recipe_data.id);
						if (!sourceNode) {
							throw new Error(`No source node found for recipe_data.id = ${recipe_data.id}`);
						}

						const targetNode = nodes.find((node) => node.id === byNodeId);
						if (!targetNode) {
							throw new Error(`No target node found for recipe_data_outer.id = ${byNodeId}`);
						}

						links.push({
							source: sourceNode,
							target: targetNode,
							item_id: id,
							quantity: parseFloat((scale * product.amount * (60 / parseFloat(recipe_data.manufactoring_duration))).toFixed(3)),
						});
					}
					// If it's used as an input elsewhere but not a target,
					// no need to create a link here directly—it's already handled above.
				});
			});

			return {nodes, links};
		};

		const {nodes, links} = transformData(data);

		// Create an SVG canvas
		const svg = d3.select(containerRef.current)
			.append("svg")
			.attr("width", width)
			.attr("height", height);

		// Add marker for arrows
		svg.append("defs")
			.append("marker")
			.attr("id", "arrow")
			.attr("viewBox", "0 -5 10 10")
			.attr("refX", 5)
			.attr("refY", 0)
			.attr("markerWidth", 5)
			.attr("markerHeight", 5)
			.attr("orient", "auto")
			.append("path")
			.attr("d", "M0,-5L10,0L0,5")
			.attr("fill", "#ff7200");

		const g: d3.Selection<SVGGElement, unknown, null, undefined> = svg.append("g");

		// Add zoom behavior
		svg.call(
			d3.zoom<SVGSVGElement, unknown>()
				.scaleExtent([0.1, 2])
				.on("zoom", (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
					g.attr("transform", event.transform.toString());
				})
		);

		const link: d3.Selection<SVGPathElement, link_props, SVGGElement, unknown> = g.append("g")
			.selectAll("path")
			.data(links)
			.enter()
			.append("path")
			.attr("fill", "none")
			.attr("stroke", "url(#link-gradient)")
			.attr("stroke-width", 4)
			.attr("stroke-opacity", 0.8)
			.attr("marker-end", "url(#arrow)")
		// .attr("d", calculateCurve);


		const linkLabels = g.append("g")
			.selectAll("text")
			.data(links)
			.enter()
			.append("text")
			.attr("fill", "#555")
			.attr("font-size", "20px")
			.attr("text-anchor", (d) => {
				if (d.source.id in raw_resource_lookup) {
					return "end"
				} else if (nodes.filter((node) => node.type === "product").map((node) => node.id).includes(d.target.id)) {
					return "start"
				} else {
					return "middle"
				}
			})
			.text((d) => {
				const itemName = !loading ? itemsComponentsDetail.find((item) => item.id === d.item_id)?.display_name : "loading";
				return `${itemName}: ${d.quantity || "Produced"}`;
			});

		// Node drawing logic
		const nodeGroup = g.append("g").selectAll<SVGGElement, node_props>("g").data(nodes).enter().append("g");

		nodeGroup.each(function (d: node_props) {
			const group = d3.select(this);

			if (d.type === "raw") {
				group
					.append("path")
					.attr("d", d3.symbol().type(d3.symbolSquare).size(2000)())
					.attr("fill", "#d59953");
			} else if (d.type === "product") {
				group
					.append("path")
					.attr("d", d3.symbol().type(d3.symbolDiamond).size(1000)())
					.attr("fill", "orange");
			} else if (d.type === "recipe") {
				const fo = group
					.append("foreignObject")
					.attr("x", -125)
					.attr("y", -45)
					.attr("width", 250)
					.attr("height", 90);

				// Append a container div inside the foreignObject
				const container = fo.append("xhtml:div")
					.style("width", "250px")
					.style("height", "90px")
					.style("display", "flex")
					.style("flex-direction", "column")
					.style("align-items", "center")
					.style("justify-content", "center");


				// Find your data
				const recipeGroup = recipesGroupedDetail.find((group) =>
					group.standard?.id === d.id ||
					group.alternate?.some((alt) => alt.id === d.id)
				);
				const standard_item_name = recipeGroup?.standard_product_display_name || 'Iron Plate';
				const recipeName = recipesComponentsDetail.find((recipe) => recipe.id === d.id)?.display_name || "loading";

				// Now container.node() is a DOM node we can render React into
				const containerNode = container.node() as HTMLDivElement;
				if (containerNode) {
					const root = ReactDOM.createRoot(containerNode);
					root.render(
						<RecipeNode
							name={recipeName}
							rate={d.rate}
							representative_item_name={standard_item_name}
							building_name={d.building_name}
						/>
					);
				}

			} else if (d.type === "by-product") {
				// Draw a circle or triangle for by-product nodes
				group
					.append("path")
					// For example, let's use a symbolTriangle
					.attr("d", d3.symbol().type(d3.symbolTriangle).size(1000)())
					.attr("fill", "purple");
			}

			// group.call(
			// 	d3.drag<SVGGElement, node_props, node_props>()
			// 		.on("start", (event: d3.D3DragEvent<SVGGElement, node_props, node_props>, d: node_props) => {
			// 			if (!event.active) simulation.alphaTarget(0.3).restart();
			// 			d.fx = d.x;
			// 			d.fy = d.y;
			// 		})
			// 		.on("drag", (event: d3.D3DragEvent<SVGGElement, node_props, node_props>, d: node_props) => {
			// 			d.fx = event.x;
			// 			d.fy = event.y;
			// 		})
			// 		.on("end", (event: d3.D3DragEvent<SVGGElement, node_props, node_props>, d: node_props) => {
			// 			if (!event.active) simulation.alphaTarget(0);
			// 			d.fx = null;
			// 			d.fy = null;
			// 		}));
		});

		const nodeLabels = g.append("g")
			.selectAll("text")
			.data(nodes)
			.enter()
			.append("text")
			.attr("fill", "#000")
			.attr("font-size", "20px")
			.attr("text-anchor", "middle")
			.attr("dy", (d) => (d.type === "recipe" ? 6 : -12))
			.text((d) => {
				if (d.type === "raw") {
					// const rawId = d.id.replace("raw-", "");
					const rawId = d.id;
					const rawName = raw_resource_lookup[rawId].display_name;
					return `${rawName}`;
				} else if (d.type === "product") {
					const itemName = !loading ? itemsComponentsDetail.find((item) => item.id === d.id)?.display_name : "loading";
					return `${itemName}: ${d.rate || "Produced"}`;
				} else if (d.type === "by-product") {
					// For by-products, try to find the item name
					// const byId = parseInt(d.id.replace("by-", ""), 10);
					const byId = d.id;
					const itemName = !loading ? itemsComponentsDetail.find((item) => item.id === byId)?.display_name : "loading";
					return itemName ? `By-Product: ${itemName}` : "By-Product";
				}
				return '';
			});

		const simulation = d3.forceSimulation<node_props>(nodes)
			.force("link", d3.forceLink<node_props, link_props>(links)
				.id(d => d.id)
				.distance(200) // try 200 or more
				.strength(0.2)
			)
			.force("charge", d3.forceManyBody().strength(-500))
			.force("x", d3.forceX<node_props>((d) => {
				if (d.type === "raw") return 100;
				if (d.type === "product") return width - 100;
				return width / 2;
			}).strength(0.25))
			// .force("y", d3.forceY((d) => height / 2).strength(0.2))
			.force("collide", d3.forceCollide<node_props>()
				.radius(d => d.type === "recipe" ? 150 : 50)
				.iterations(2) // More iterations can separate them better
				.strength(1) // Increase the collision strength
			)
			.force("center", d3.forceCenter(width / 2, height / 2))


		const defs = svg.append("defs");
		const gradient = defs.append("linearGradient")
			.attr("id", "link-gradient")
			.attr("gradientUnits", "userSpaceOnUse")
			.attr("x1", "0%")
			.attr("y1", "0%")
			.attr("x2", "100%")
			.attr("y2", "0%");

		gradient.append("stop").attr("offset", "0%").attr("stop-color", "blue");
		gradient.append("stop").attr("offset", "100%").attr("stop-color", "red");

		function intersectRect(
			sx: number, sy: number,    // source.x, source.y
			tx: number, ty: number,    // target.x, target.y
			cx: number, cy: number,    // center of the node rectangle
			hw: number, hh: number     // half-width and half-height of the rectangle
		) {
			const dx = tx - sx;
			const dy = ty - sy;

			// Potential intersection t-values
			const  candidates = [];

			// Check vertical boundaries: x = cx ± hw
			if (dx !== 0) {
				// Left boundary:
				let t = ((cx - hw) - sx) / dx;
				let yCandidate = sy + t * dy;
				if (t >= 0 && t <= 1 && (yCandidate >= cy - hh && yCandidate <= cy + hh)) {
					candidates.push(t);
				}

				// Right boundary:
				t = ((cx + hw) - sx) / dx;
				yCandidate = sy + t * dy;
				if (t >= 0 && t <= 1 && (yCandidate >= cy - hh && yCandidate <= cy + hh)) {
					candidates.push(t);
				}
			}

			// Check horizontal boundaries: y = cy ± hh
			if (dy !== 0) {
				// Top boundary:
				let t = ((cy - hh) - sy) / dy;
				let xCandidate = sx + t * dx;
				if (t >= 0 && t <= 1 && (xCandidate >= cx - hw && xCandidate <= cx + hw)) {
					candidates.push(t);
				}

				// Bottom boundary:
				t = ((cy + hh) - sy) / dy;
				xCandidate = sx + t * dx;
				if (t >= 0 && t <= 1 && (xCandidate >= cx - hw && xCandidate <= cx + hw)) {
					candidates.push(t);
				}
			}

			if (candidates.length === 0) {
				// No intersection found: fallback to center (shouldn't happen if line truly passes through)
				return {x: cx, y: cy};
			}

			// Pick the intersection that’s closest to the relevant endpoint.
			// For connecting from source to target, if we’re adjusting the target intersection,
			// we want the intersection point closest to the target (largest t if direction is source->target).
			// For adjusting the source intersection, you might want the intersection closest to the source (smallest t).

			// If this is for the target node:
			let bestT = Math.min(...candidates.map(Math.abs)); // or pick max/min depending on direction preference
			// Actually, since we know we’re going from source to target,
			// for the target node intersection, choose the intersection with the highest t (closest to t=1):
			bestT = candidates.reduce((acc, val) => (Math.abs(val - 1) < Math.abs(acc - 1)) ? val : acc, candidates[0]);

			const finalX = sx + bestT * dx;
			const finalY = sy + bestT * dy;
			return {x: finalX, y: finalY};
		}


		simulation.nodes(nodes).on("tick", () => {
			// link.attr("d", calculateCurve);
			// link.attr("d", d => shortenLink(d))
			link.attr("d", d => {
				const sourceHw = (d.source.type === 'recipe') ? 125 : 0; // or radius if raw
				const sourceHh = (d.source.type === 'recipe') ? 50 : 0;
				const targetHw = (d.target.type === 'recipe') ? 125 : 0;
				const targetHh = (d.target.type === 'recipe') ? 50 : 0;

				// Adjust source endpoint
				let {x: sx, y: sy} = d.source;
				if (d.source.type === 'recipe') {
					const intersectionSource = intersectRect(d.target.x, d.target.y, d.source.x, d.source.y, d.source.x, d.source.y, sourceHw, sourceHh);
					// Notice we reversed arguments here because we are basically checking intersection from target->source line
					// to find where it enters the source rectangle. You can also write a separate function if that's clearer.
					sx = intersectionSource.x;
					sy = intersectionSource.y;
				}

				// Adjust target endpoint
				let {x: tx, y: ty} = d.target;
				if (d.target.type === 'recipe') {
					const intersectionTarget = intersectRect(d.source.x, d.source.y, d.target.x, d.target.y, d.target.x, d.target.y, targetHw, targetHh);
					tx = intersectionTarget.x;
					ty = intersectionTarget.y;
				}

				return `M${sx},${sy} L${tx},${ty}`;
			});

			linkLabels
				.attr("x", (d) => (d.source.x + d.target.x) / 2)
				.attr("y", (d) => (d.source.y + d.target.y) / 2);

			nodeGroup.attr("transform", (d) => `translate(${d.x || 0}, ${d.y || 0})`);

			nodeLabels.attr("x", (d) => d.x || 0).attr("y", (d) => (d.y || 0) - 12);
		});

		(simulation.force("link") as d3.ForceLink<node_props, link_props>).links(links);
		// simulation
		// 	.alphaDecay(0.02) // slower decay for smoother animations
		// 	.alphaMin(0.001); // let it run just a bit longer before stopping

	}, [data, width, height, recipesComponentsDetail, itemsComponentsDetail, loading]);

	return <div ref={containerRef} style={{width: "100%", height}}/>;
};

export default D3Graph;

