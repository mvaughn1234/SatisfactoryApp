import {Box, Paper} from "@mui/material";
import Grid from "@mui/material/Grid2";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import React, {useCallback, useMemo} from 'react';
import {useAppStaticData} from "../store/AppStaticDataStore.tsx";
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
	const {activeTabId, productionLines, loadingState} = useProductionLineState();
	const {updateProductionLine} = useProductionLineUpdate();
	const {itemsComponentsDetail} = useAppStaticData();

	const activeTargets = useMemo(() => {
		const activeLine = productionLines[activeTabId ?? ''];
		return activeLine ? activeLine.production_targets : [];
	}, [activeTabId, productionLines]);

	const availableTargets = useMemo(() => {
		const activeItemIds = activeTargets.map((activeProductionTarget) => activeProductionTarget.product?.id)
			.filter((item) => item!==null)
		return itemsComponentsDetail.filter((item) => !activeItemIds.find((activeItemId) => item.id === activeItemId))
	}, [activeTargets, itemsComponentsDetail])

	// Add a new target
	const handleAddTarget = useCallback((product: ItemSummary | null, rate: number | null) => {
		if (product && rate !== null) {
			const newTarget: ProductionTarget = {
				id: `${activeTabId}-${product.id}`,
				product,
				rate,
			};
			const updatedTargets = [...activeTargets, newTarget];
			updateProductionLine(activeTabId!, {production_targets: updatedTargets});
		}
	}, [activeTabId, activeTargets, updateProductionLine]);

	// Handle edits from child components
	const handleEditTarget = useCallback((id: string, product: ItemSummary | null, rate: number | null) => {
		const updatedTargets = activeTargets.map((target) =>
			target.id === id ? {...target, product, rate} : target
		);
		updateProductionLine(activeTabId!, {production_targets: updatedTargets});
	}, [activeTabId, activeTargets, updateProductionLine]);

	const handleRemoveTarget = useCallback(
		(id: string) => {
			if (!activeTabId) return;

			// Find the active production line
			const activeLine = productionLines[activeTabId];
			if (!activeLine) return;

			// Filter out the target to remove
			const updatedTargets = activeLine.production_targets.filter((target) => target.id !== id);

			// Update the production line locally and sync to the backend
			updateProductionLine(activeTabId, {production_targets: updatedTargets});
		},
		[activeTabId, productionLines, updateProductionLine]);
	const colWidth = { xs: 12, sm: 12, md: 6, lg: 4, xl: 3 };

	return (
		<Stack>
          <Paper
              elevation={1}
              sx={{
								px: 0,
								pt: 1,
								pb: 1,
								mb: 2,
								// display: 'flex',
								// alignItems: 'flex-end',
								flexGrow: 1,
								borderRadius: 0,
								backgroundColor: 'background.paper',
								// width: '100%',
							}}
          >
              <Grid
                  container
                  direction="row"
								// sx={{justifyContent: 'flex-start', alignItems: 'flex-start'}}
                  columns={{xs: 12}}
              >
								{/* Map the existing production targets */}
								{(!loadingState && activeTargets) ? activeTargets.map((target) => (
										<Grid key={`${activeTabId}-${target.id}`} size={colWidth}
													sx={(theme) => ({
														'--Grid-borderWidth': '1px',
														// borderTop: 'var(--Grid-borderWidth) solid',
														borderColor: 'divider',
														'& > div': {
															borderRight: 'var(--Grid-borderWidth) solid',
															// borderBottom: 'var(--Grid-borderWidth) solid',
															borderColor: 'divider',
															...Object.keys(colWidth).reduce((result, key) => ({
																	...result,
																// @ts-expect-error Key type inference not working
																[`&:nth-of-type(${12 / colWidth[key]}n)`]: {
																	// @ts-expect-error Key type inference not working
																		[theme.breakpoints.only(key)]: {
																			borderRight: 'none',
																		},
																	},
																}),	{}),
														},
													})}
										>
											<Box>
												<MemoizedSelectorGroup
													target={target}
													isDummy={false}
													onEdit={handleEditTarget}
													availableItems={itemsComponentsDetail}
													onRemove={handleRemoveTarget}
												/>
											</Box>
										</Grid>
									))
									:
									<Grid size={colWidth}>
										<Box>
											<Skeleton
												variant="rectangular"
												// width="200px"
												sx={{mx: 1}}
												height={50}
												animation="wave"
											/>
										</Box>
									</Grid>
								}
								{activeTabId &&
                    <Grid size={colWidth}>
                        <Box>
                            <ProductionItemSelectorGroup
                                key={`dummy-${activeTabId}:${activeTargets.length}`}
                                target={{id: 'dummy', product: null, rate: null}}
                                isDummy={true}
                                onAdd={handleAddTarget}
                                availableItems={availableTargets}
                            />
                        </Box>
                    </Grid>
								}
								{/*<Divider orientation="vertical" flexItem/>*/}
              </Grid>

          </Paper>
		</Stack>
	);
};

export default ProductionTargetsGroup;