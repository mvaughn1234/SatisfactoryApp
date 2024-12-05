import {Paper} from "@mui/material";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import React, {useEffect, useState} from 'react';
import {useAppContext} from '../store/AppContext';
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
	const {activeTabId, productionLines, updateProductionLine} = useAppContext();
	const [productionTargets, setProductionTargets] = useState<ProductionTarget[]>([]);
	const [targetSequencer, setTargetSequencer] = useState<number>(0);

	// Fetch production targets when the active tab changes
	useEffect(() => {
		if (activeTabId) {
			const activeLine = productionLines.find(line => line.id === activeTabId);
			const storedProductionTargets = activeLine?.production_targets || [];
			setProductionTargets(storedProductionTargets);
		}
	}, [activeTabId, productionLines]);

	// Function to update global state for the active production line's targets
	const updateGlobalLine = (newTargets: ProductionTarget[]) => {
		updateProductionLine(activeTabId, {production_targets: newTargets});
	};

	const sequenceTarget = () => {
		const currentSequence = targetSequencer;
		setTargetSequencer(currentSequence + 1);
		return currentSequence + 1;
	}

	// Add a new target
	const handleAddTarget = (product: ItemSummary | null, rate: number | null) => {
		if (product && rate !== null) {
			const newTarget: ProductionTarget = {
				id: `${activeTabId}.${sequenceTarget()}`, // Create a unique ID based on the length of targets
				product,
				rate,
			};
			const updatedTargets = [...productionTargets, newTarget];
			setProductionTargets(updatedTargets); // Update local state
			updateGlobalLine(updatedTargets); // Update global state
		}
	};

	const selectedLine = productionLines?.find((line) => line['id'] === activeTabId)

	return (
		<Stack>
			{(selectedLine?.production_targets?.length || 0) > 0 && (
				<Paper
					elevation={1}
					sx={{
						px: 0, pt: 1, pb: 1, mb: 2,
						display: 'flex', alignItems: 'flex-end', borderRadius: 0,
						backgroundColor: 'background.paper',
						width: '100%',
						// '&:hover': {backgroundColor: 'background.default'},
					}}
				>
					<Stack direction="row">
						<Stack>
							{/* Map the existing production targets */}
							{selectedLine?.production_targets.map(target => (
								<MemoizedSelectorGroup
									key={`${activeTabId}-${target.id}`}
									target={target}
									isDummy={false}
								/>
							))}
						</Stack>

						<Divider orientation="vertical" flexItem/>
					</Stack>
				</Paper>
			)}

			{/* Dummy group for adding new targets */}
			<ProductionItemSelectorGroup
				key={`dummy-${productionTargets.length}`}
				target={{id: 'dummy', product: null, rate: null}}
				isDummy={true} // Mark as the dummy group
				onAdd={handleAddTarget} // Handle adding a new target
			/>
		</Stack>
	);
};

export default ProductionTargetsGroup;
