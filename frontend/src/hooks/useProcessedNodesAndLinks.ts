import {useEffect, useState} from "react";
import {useAppStaticData} from "../store/AppStaticDataStore.tsx";
import {NodesAndLinksData, dg_node_props, link_props} from "../types/Other.ts";
import {OptimizationResult} from "../types/ProductionLine.ts";

const useProcessedNodesAndLinks = (data: OptimizationResult): NodesAndLinksData => {
	const {recipesComponentsDetail, itemsComponentsDetail, recipesGroupedDetail, loading} = useAppStaticData();
	const [processing, setProcessing] = useState<boolean>(true);
	const [nodes, setNodes] = useState<dg_node_props[]>([]);
	const [links, setLinks] = useState<link_props[]>([]);

	useEffect(() => {
		setProcessing(true);

		if (!loading && data && Object.entries(data).length > 0) {
			const localNodes: dg_node_props[] = [];
			const localLinks: link_props[] = [];

			// These will track how much each recipe produces and how much of that production
			// is consumed by other recipes. Later we can subtract consumption from production
			// so that only leftover is linked to "product" or "by-product".
			// Structure: producedByRecipe[recipeId][itemId] = total produced
			//            consumedFromRecipe[recipeId][itemId] = total consumed from that recipe’s output
			const producedByRecipe: Record<number, Record<number, number>> = {};
			const consumedFromRecipe: Record<number, Record<number, number>> = {};

			const addNode = (
				id: number,
				type: string,
				rate: number = 0,
				building_name: string | null = null,
				item: boolean = false
			) => {
				if (!localNodes.find((node) => node.id === id)) {
					const recipeGroup = !item
						? recipesGroupedDetail?.find(
							(group) =>
								group.standard?.id === id ||
								group.alternate?.some((alt) => alt.id === id)
						)
						: null;

					const standard_item_name = !item
						? recipeGroup?.standard_product_display_name || "loading"
						: "item";

					const recipeName = !item
						? recipesComponentsDetail?.find((recipe) => recipe.id === id)
						?.display_name || "loading"
						: "item";

					const itemName = item
						? itemsComponentsDetail?.find((itm) => itm.id === id)?.display_name ||
						"loading"
						: "Not Item";

					localNodes.push({
						id,
						type,
						rate,
						building_name: building_name ? building_name : "no building",
						x: 0,
						y: 0,
						fx: null,
						fy: null,
						recipeName,
						standard_item_name,
						item_name: itemName,
					});
				}
			};

			const addLink = (
				source: dg_node_props,
				target: dg_node_props,
				item_id: number,
				quantity: number
			) => {
				const itemName =
					itemsComponentsDetail?.find((itm) => itm.id === item_id)?.display_name ||
					"loading";

				localLinks.push({
					source,
					target,
					item_name: itemName,
					item_id,
					quantity,
				});
			};

			// 1. Identify which items are raw inputs, and which are final target outputs
			const rawResources = new Set(data.raw_resource_usage.map((res) => res.item_id));
			const targetOutputs = new Set(data.target_output.map((output) => output.item_id));

			// 2. Track which items are used as inputs by any recipe
			const usedAsInput = new Set<number>();
			Object.entries(data.production_line).forEach(([, { recipe_data }]) => {
				recipe_data.ingredients?.forEach((input) => {
					usedAsInput.add(input.id);
				});
			});

			// 3. Add nodes for raw resources and for target output items
			rawResources.forEach((item_id) => {
				const raw = data.raw_resource_usage.find((r) => r.item_id === item_id);
				addNode(item_id, "raw", raw?.total_quantity || 0, null, true);
			});
			targetOutputs.forEach((item_id) => {
				const target = data.target_output.find((t) => t.item_id === item_id);
				addNode(item_id, "product", target?.amount || 0, null, true);
			});

			// 4. Add recipe nodes
			const p_line_objects = Object.values(data.production_line);
			p_line_objects.forEach(({ recipe_data, scale }) => {
				addNode(
					recipe_data.id,
					"recipe",
					parseFloat(scale.toFixed(3)),
					recipe_data.produced_in?.[0]?.display_name || ""
				);
			});

			// Initialize producedByRecipe and consumedFromRecipe so we can accumulate
			p_line_objects.forEach(({ recipe_data }) => {
				producedByRecipe[recipe_data.id] = {};
				consumedFromRecipe[recipe_data.id] = {};
			});

			// 5. Build links for recipe->recipe consumption and accumulate consumption
			p_line_objects.forEach(({ recipe_data: consumerRecipe, scale: consumerScale }) => {
				consumerRecipe.ingredients?.forEach((ingredient) => {
					// How much total is required by this consumer recipe?
					const requiredAmount =
						ingredient.amount *
						consumerScale *
						(60 / parseFloat(consumerRecipe.manufactoring_duration));

					// Find all producers that produce this input item
					const producers = p_line_objects.filter(({ recipe_data }) =>
						recipe_data.products?.some((prod) => prod.id === ingredient.id)
					);

					// Sum total production (from all producers) for this item
					const totalProduced = producers.reduce((sum, { recipe_data, scale }) => {
						const out = recipe_data.products?.find((p) => p.id === ingredient.id);
						return (
							sum +
							(out
								? scale * out.amount * (60 / parseFloat(recipe_data.manufactoring_duration))
								: 0)
						);
					}, 0);

					// Link each producer -> consumer with fraction of the required amount
					producers.forEach(({ recipe_data: producerRecipe, scale: producerScale }) => {
						const out = producerRecipe.products?.find((o) => o.id === ingredient.id);
						if (out) {
							// Producer's total for this item
							const producerQuantity =
								producerScale *
								out.amount *
								(60 / parseFloat(producerRecipe.manufactoring_duration));

							// Fraction of total production that goes to this consumer
							const fraction = producerQuantity / totalProduced || 0;
							const actualQuantity = fraction * requiredAmount;

							// Accumulate consumption from that producer
							if (!consumedFromRecipe[producerRecipe.id][ingredient.id]) {
								consumedFromRecipe[producerRecipe.id][ingredient.id] = 0;
							}
							consumedFromRecipe[producerRecipe.id][ingredient.id] += actualQuantity;

							// Add the link from the producer recipe node -> consumer recipe node
							const sourceNode = localNodes.find((node) => node.id === producerRecipe.id);
							const targetNode = localNodes.find((node) => node.id === consumerRecipe.id);

							if (!sourceNode) {
								throw new Error(
									`No source node found for producer recipe ${producerRecipe.id}`
								);
							}
							if (!targetNode) {
								throw new Error(
									`No target node found for consumer recipe ${consumerRecipe.id}`
								);
							}

							addLink(
								sourceNode,
								targetNode,
								ingredient.id,
								parseFloat(actualQuantity.toFixed(3))
							);
						}
					});

					// If it's a raw resource, link directly from raw node -> consumer recipe
					if (rawResources.has(ingredient.id)) {
						const sourceNode = localNodes.find((node) => node.id === ingredient.id);
						const targetNode = localNodes.find((node) => node.id === consumerRecipe.id);

						if (!sourceNode) {
							throw new Error(`No source node found for raw item ${ingredient.id}`);
						}
						if (!targetNode) {
							throw new Error(
								`No target node found for consumer recipe ${consumerRecipe.id}`
							);
						}

						addLink(
							sourceNode,
							targetNode,
							ingredient.id,
							parseFloat(requiredAmount.toFixed(3))
						);
					}
				});
			});

			// 6. Accumulate total production for each recipe -> item
			p_line_objects.forEach(({ recipe_data, scale }) => {
				recipe_data.products?.forEach((product) => {
					const totalProducedAmount =
						scale * product.amount * (60 / parseFloat(recipe_data.manufactoring_duration));

					producedByRecipe[recipe_data.id][product.id] =
						(producedByRecipe[recipe_data.id][product.id] || 0) + totalProducedAmount;
				});
			});

			// 7. Now create net links from each recipe to either "product" or "by-product"
			p_line_objects.forEach(({ recipe_data }) => {
				const sourceNode = localNodes.find((node) => node.id === recipe_data.id);
				if (!sourceNode) {
					throw new Error(`No node found for recipe ${recipe_data.id}`);
				}

				recipe_data.products?.forEach((product) => {
					const itemId = product.id;
					const totalProducedAmount = producedByRecipe[recipe_data.id][itemId] || 0;
					const totalConsumedFromThisRecipe = consumedFromRecipe[recipe_data.id][itemId] || 0;
					const leftover = totalProducedAmount - totalConsumedFromThisRecipe;

					// Only link leftover if > 0
					if (leftover*100 > 1) {
						// If item is a target output
						if (targetOutputs.has(itemId)) {
							// Link to the "product" node
							const targetNode = localNodes.find((node) => node.id === itemId);
							if (!targetNode) {
								throw new Error(`No product node found for item ${itemId}`);
							}
							addLink(
								sourceNode,
								targetNode,
								itemId,
								parseFloat(leftover.toFixed(3))
							);
						}
						// else if (!usedAsInput.has(itemId) && !rawResources.has(itemId)) {
						else {
							// If it's not used as input and not a raw resource, treat as by-product
							// ensure we have a by-product node for it
							const byNodeId = itemId;
							let targetNode = localNodes.find((node) => node.id === byNodeId);
							if (!targetNode) {
								// create the by-product node if not exist
								addNode(byNodeId, "by-product", leftover, null, true);
								targetNode = localNodes.find((node) => node.id === byNodeId);
							}

							if (!targetNode) {
								throw new Error(`No by-product node found for item ${byNodeId}`);
							}
							addLink(
								sourceNode,
								targetNode,
								itemId,
								parseFloat(leftover.toFixed(3))
							);
						}
						// If it's used as input in another recipe but not a final product,
						// we already have the recipe->recipe link above.
						// (So we do NOT add anything additional here for that.)
					}
				});
			});

			setNodes(localNodes);
			setLinks(localLinks);
			setProcessing(false);
		} else {
			setNodes([]);
			setLinks([]);
			setProcessing(true);
		}
	}, [data, loading]);

	return {nodes, links, processing};
};

export default useProcessedNodesAndLinks;
