import {Paper} from "@mui/material";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import React, {useEffect, useState} from 'react';
import {useProductionLineState, useProductionLineUpdate} from "../store/ProductionLineContext.tsx";
import {ItemSummary} from "../types/Item";
import {ProductionTarget} from '../types/ProductionLine';
import ProductionItemSelectorGroup from "./ProductionItemSelectorGroup.tsx";

const MemoizedSelectorGroup = React.memo(ProductionItemSelectorGroup, (prevProps, nextProps) => {
	// Return true if the props haven't changed to avoid re-rendering
	return (
		// prevProps.key === nextProps.key &&
		prevProps.target === nextProps.target &&
		prevProps.isDummy === nextProps.isDummy
	);
});


const ProductionTargetsGroup: React.FC = () => {
	const { activeTabId, productionLines } = useProductionLineState();
	const { updateProductionLine } = useProductionLineUpdate();
	const [productionTargets, setProductionTargets] = useState<ProductionTarget[]>([]);
	const [pendingUpdates, setPendingUpdates] = useState<ProductionTarget[] | null>(null);

	// Fetch production targets when the active tab changes
	useEffect(() => {
		console.log("fetch targets when active tab changes")
		if (activeTabId) {
			const activeLine = productionLines.find((line) => line.id === activeTabId);
			const storedProductionTargets = activeLine?.production_targets || [];
			setProductionTargets(storedProductionTargets);
		}
	}, [activeTabId]);

	// Synchronize pending updates with the backend
	useEffect(() => {
		console.log("pending updates")
		if (pendingUpdates) {
			const debouncedUpdate = setTimeout(() => {
				updateProductionLine(activeTabId, { production_targets: pendingUpdates });
				setPendingUpdates(null); // Clear pending updates
			}, 200); // Debounce delay

			return () => clearTimeout(debouncedUpdate); // Cleanup if updates change
		}
	}, [pendingUpdates, activeTabId, updateProductionLine]);

	// Add a new target
	const handleAddTarget = (product: ItemSummary | null, rate: number | null) => {
		console.log("onAdd")
		if (product && rate !== null) {
			const newTarget: ProductionTarget = {
				id: `${activeTabId}.${product.id}`,
				product,
				rate,
			};
			const updatedTargets = [...productionTargets, newTarget];
			setProductionTargets(updatedTargets); // Update local state
			setPendingUpdates(updatedTargets); // Queue for backend sync
		}
	};

	// Handle edits from child components
	const handleEditTarget = (id: string, product: ItemSummary | null, rate: number | null) => {
		console.log("onEdit")
		const updatedTargets = productionTargets.map((target) =>
			target.id === id ? { ...target, product, rate } : target
		);
		setProductionTargets(updatedTargets); // Update local state
		setPendingUpdates(updatedTargets); // Queue for backend sync
	};

	const selectedLine = productionLines?.find((line) => line['id'] === activeTabId);

	return (
		<Stack>
			{(selectedLine?.production_targets?.length || 0) > 0 && (
				<Paper
					elevation={1}
					sx={{
						px: 0,
						pt: 1,
						pb: 1,
						mb: 2,
						display: 'flex',
						alignItems: 'flex-end',
						borderRadius: 0,
						backgroundColor: 'background.paper',
						width: '100%',
					}}
				>
					<Stack direction="row">
						<Stack>
							{/* Map the existing production targets */}
							{selectedLine?.production_targets.map((target) => (
								<MemoizedSelectorGroup
									key={`${activeTabId}-${target.id}`}
									target={target}
									isDummy={false}
									onEdit={handleEditTarget}
								/>
							))}
						</Stack>

						<Divider orientation="vertical" flexItem />
					</Stack>
				</Paper>
			)}

			{/* Dummy group for adding new targets */}
			<ProductionItemSelectorGroup
				key={`dummy-${productionTargets.length}`}
				target={{ id: 'dummy', product: null, rate: null }}
				isDummy={true}
				onAdd={handleAddTarget}
			/>
		</Stack>
	);
};

export default ProductionTargetsGroup;