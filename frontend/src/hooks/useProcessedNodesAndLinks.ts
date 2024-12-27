import {useEffect, useState} from "react";
import {useAppStaticData} from "../store/AppStaticDataStore.tsx";
import {NodesAndLinksData, node_props, link_props} from "../types/Other.ts";
import {OptimizationResult} from "../types/ProductionLine.ts";


const useProcessedNodesAndLinks = (data: OptimizationResult): NodesAndLinksData => {
	const {recipesComponentsDetail, itemsComponentsDetail, recipesGroupedDetail, loading} = useAppStaticData();
	const [processing, setProcessing] = useState<boolean>(true);
	const [nodes, setNodes] = useState<node_props[]>([]);
	const [links, setLinks] = useState<link_props[]>([])

	useEffect(() => {
		setProcessing(true);
		if (!loading && data && Object.entries(data).length > 0) {
			const localNodes: node_props[] = [];
			const localLinks: link_props[] = [];

			const addNode = (id: number, type: string, rate: number = 0, building_name: string | null = null, item: boolean = false) => {
				if (!localNodes.find((node) => node.id === id)) {
					const recipeGroup = !item ? recipesGroupedDetail?.find((group) =>
						group.standard?.id === id ||
						group.alternate?.some((alt) => alt.id === id)
					) : null;
					const standard_item_name = !item ? recipeGroup?.standard_product_display_name || 'loading' : 'item';
					const recipeName = !item ? recipesComponentsDetail?.find((recipe) => recipe.id === id)?.display_name || "loading" : 'item';
					const itemName = item ? itemsComponentsDetail?.find((item) => item.id === id)?.display_name || "loading" : 'Not Item';

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
						item_name: itemName
					});
				}
			};

			const addLink = (source: node_props, target: node_props, item_id: number, quantity: number) => {
				const itemName = itemsComponentsDetail?.find((item) => item.id === item_id)?.display_name || "loading";
				localLinks.push({
					source,
					target,
					item_name: itemName,
					item_id,
					quantity
				})
			}

			// Extract sets of items from raw usage, target outputs, and gather usedAsInput
			const rawResources = new Set(data.raw_resource_usage.map((res) => res.item_id));
			const targetOutputs = new Set(data.target_output.map((output) => output.item_id));

			// 1. Precompute usedAsInput
			const usedAsInput = new Set();
			Object.entries(data.production_line).forEach(([, {recipe_data}]) => {
				recipe_data.ingredients?.forEach((input) => {
					usedAsInput.add(input.id)
				})
			})

			// 2. Add raw and target localNodes
			// rawResources.forEach((item_id) => addNode(`raw-${item_id}`, "raw"));
			// rawResources.forEach((item_id) => addNode(item_id, "raw"));
			rawResources.forEach((item_id) => {
				const raw = data.raw_resource_usage.find((r) => r.item_id === item_id);
				addNode(item_id, "raw", raw?.total_quantity || 0, null, true);
			});
			targetOutputs.forEach((item_id) => {
				const target = data.target_output.find((t) => t.item_id === item_id);
				addNode(item_id, "product", target?.amount || 0, null, true);
			});

			// 3. Add recipe localNodes
			Object.entries(data.production_line).forEach(([, {recipe_data, scale}]) => {
				addNode(recipe_data.id, "recipe", parseFloat(scale.toFixed(3)), (recipe_data.produced_in && recipe_data.produced_in.length > 0) ? recipe_data.produced_in[0].display_name : '');
			})


			// 4. Build localLinks for inputs from producers or raw
			const p_line_objects = Object.values(data.production_line)
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

							const sourceNode = localNodes.find((node) => node.id === recipe_data.id);
							if (!sourceNode) {
								throw new Error(`No source node found for recipe_data.id = ${recipe_data.id}`);
							}

							const targetNode = localNodes.find((node) => node.id === recipe_data_outer.id);
							if (!targetNode) {
								throw new Error(`No target node found for recipe_data_outer.id = ${recipe_data_outer.id}`);
							}

							addLink(sourceNode, targetNode, ingredient.id, parseFloat(actualQuantity.toFixed(3)), // Use the computed actual quantity
							);
						}
					});

					// If it's a raw resource, link directly
					if (rawResources.has(ingredient.id)) {
						const sourceNode = localNodes.find((node) => node.id === ingredient.id);
						if (!sourceNode) {
							throw new Error(`No source node found for recipe_data.id = ${ingredient.id}`);
						}

						const targetNode = localNodes.find((node) => node.id === recipe_data_outer.id);
						if (!targetNode) {
							throw new Error(`No target node found for recipe_data_outer.id = ${recipe_data_outer.id}`);
						}

						addLink(sourceNode, targetNode, ingredient.id, parseFloat((scale * ingredient.amount * (60 / parseFloat(recipe_data_outer.manufactoring_duration))).toFixed(3)))
					}

				})
			})

			// 5. Handle outputs: target outputs or by-products
			p_line_objects.forEach(({recipe_data, scale}) => {
				recipe_data.products?.forEach((product) => {
					const {id} = product;
					// If this item is a target output
					if (targetOutputs.has(id)) {
						const sourceNode = localNodes.find((node) => node.id === recipe_data.id);
						if (!sourceNode) {
							throw new Error(`No source node found for recipe_data.id = ${recipe_data.id}`);
						}

						const targetNode = localNodes.find((node) => node.id === id);
						if (!targetNode) {
							throw new Error(`No target node found for recipe_data_outer.id = ${id}`);
						}

						addLink(sourceNode, targetNode, id, parseFloat((scale * product.amount * (60 / parseFloat(recipe_data.manufactoring_duration))).toFixed(3)));
					} else if (!usedAsInput.has(id) && !rawResources.has(id)) {
						// If not used as input and not a target output, it's a by-product
						const byNodeId = id;
						// const byNodeId = `by-${id}`;
						addNode(byNodeId, "by-product", 0, null, true);
						const sourceNode = localNodes.find((node) => node.id === recipe_data.id);
						if (!sourceNode) {
							throw new Error(`No source node found for recipe_data.id = ${recipe_data.id}`);
						}

						const targetNode = localNodes.find((node) => node.id === byNodeId);
						if (!targetNode) {
							throw new Error(`No target node found for recipe_data_outer.id = ${byNodeId}`);
						}

						addLink(sourceNode, targetNode, id, parseFloat((scale * product.amount * (60 / parseFloat(recipe_data.manufactoring_duration))).toFixed(3)));
					}
					// If it's used as an input elsewhere but not a target,
					// no need to create a link here directly—it's already handled above.
				});
			});

			setNodes(localNodes);
			setLinks(localLinks);
			setProcessing(false);
		}
	}, [data, loading])

	return {nodes, links, processing};

}

export default useProcessedNodesAndLinks;