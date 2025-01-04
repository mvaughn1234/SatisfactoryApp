import {debounce} from "lodash";
import React, {createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState} from 'react';
import {fetchLineOptimizationCalculation} from "../services/calculatorService.ts";
import {ProductionLineState, ProductionLineUpdate} from "../types/ContextStoreInterfaces.ts";
import {OptimizationResult, ProductionLine} from '../types/ProductionLine';
import {fetchProductionLines, updateUserProductionLine} from '../services/userConfigService';

// Create State and Update Contexts
const ProductionLineStateContext = createContext<ProductionLineState | null>(null);
const ProductionLineUpdateContext = createContext<ProductionLineUpdate | null>(null);

// Custom hooks for consuming the context
export const useProductionLineState = () => {
	const context = useContext(ProductionLineStateContext);
	if (!context) throw new Error('useProductionLineState must be used within ProductionLineProvider');
	return context;
};

export const useProductionLineUpdate = () => {
	const context = useContext(ProductionLineUpdateContext);
	if (!context) throw new Error('useProductionLineUpdate must be used within ProductionLineProvider');
	return context;
};

interface ProductionLineProviderProps {
	children: ReactNode;
}

// Provider Component
export const ProductionLineProvider: React.FC<ProductionLineProviderProps> = ({children}) => {
	const [productionLines, setProductionLines] = useState<Record<string, ProductionLine>>({});
	const [activeTabId, setActiveTabId] = useState<string | null>(null);
	const [updateError, setUpdateError] = useState<string | null>(null);
	const [syncInProgress, setSyncInProgress] = useState<boolean>(false);
	const [loadingState, setLoadingState] = useState<boolean>(true);
	const [calculatingResult, setCalculatingResult] = useState<boolean>(true);
	const [optimizationResults, setOptimizationResults] = useState<Record<string, OptimizationResult>>({});

	const calculateOptimization = useCallback(
		debounce(async (lineId: string, updatedLine?: ProductionLine) => {
			const productionLine = updatedLine ? updatedLine : productionLines[lineId];

			// Skip calculation if no production line or no production targets
			if (!productionLine || productionLine.production_targets.length === 0) {
				console.log("Skipping calculation: ", productionLine)
				return;
			}
			console.log("trying calculation")
			setCalculatingResult(true);
			try {
				const results = await fetchLineOptimizationCalculation(lineId);
				setOptimizationResults((prev) => ({ ...prev, [lineId]: results }));
			} catch (error) {
				console.error(`Error calculating optimization for line ${lineId}:`, error);
			} finally {
				setCalculatingResult(false);
			}
		}, 300),
		[productionLines]
	);

	const queueRecalculation = useCallback(
		debounce(async (lineId: string) => {
			if (!productionLines[lineId]) return;

			setCalculatingResult(true);
			try {
				await calculateOptimization(lineId);
			} catch (error) {
				console.error(`Error recalculating optimization for line ${lineId}:`, error);
			} finally {
				setCalculatingResult(false);
			}
		}, 300),
		[productionLines, calculateOptimization]
	);

	// Initial data fetch
	useEffect(() => {
		async function fetchInitialData() {
			setLoadingState(true);
			try {
				const fetchedLines = await fetchProductionLines();
				setProductionLines(fetchedLines);

				// Default to the first line as active tab
				const initialTabId = Object.keys(fetchedLines)[0] || null;
				setActiveTabId(initialTabId);
				setLoadingState(false);

				if (initialTabId) {
					await calculateOptimization(initialTabId);
				}
			} catch (error) {
				console.error("Error fetching initial production lines:", error);
			} finally {
				setLoadingState(false);
			}
		}

		fetchInitialData();
	}, []);

	// React to activeTabId changes
	useEffect(() => {
		if (!activeTabId) return;

		const currentTabId = activeTabId as string;

		async function handleActiveTabChange() {
			setLoadingState(true);
			try {
				const currentLine = productionLines[currentTabId];
				if (!currentLine) {
					const fetchedLines = await fetchProductionLines();
					setProductionLines(fetchedLines);
				}

				if (!optimizationResults[currentTabId]) {
					await calculateOptimization(currentTabId);
				}
			} catch (error) {
				console.error("Error handling active tab change:", error);
			} finally {
				setLoadingState(false);
			}
		}

		handleActiveTabChange();
	}, [activeTabId, productionLines, optimizationResults]);

	const handleTabChange = useCallback((nextTabId: string) => {
		setLoadingState(true)
		setActiveTabId(nextTabId);
	}, [activeTabId])

	// Add a new production line
	const addProductionLine = useCallback(async (name: string) => {
		const new_line_id = `${productionLines.length}`;
		const newLine: ProductionLine = {
			id: new_line_id,
			name,
			production_targets: [],
			input_customizations: [],
			recipe_customizations: [],
		};

		setProductionLines((prev) => ({
			...prev,
			[new_line_id]: newLine,
		}));
		setActiveTabId(newLine.id);

		setSyncInProgress(true);
		try {
			await updateUserProductionLine(new_line_id, newLine);
			const refreshedLines = await fetchProductionLines();
			setProductionLines(refreshedLines);
			setUpdateError(null); // Clear any errors
			setSyncInProgress(false);

			// Trigger recalculation for the updated line
			await calculateOptimization(new_line_id);
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Failed to add production line';
			setUpdateError(errorMessage);
			console.error(`Error adding production line ${new_line_id}:`, err);
		} finally {
			setSyncInProgress(false);
		}
	}, [productionLines]);

	// Update an existing production line
	const updateProductionLine = useCallback(
		debounce(async (lineId: string, updates: Partial<ProductionLine>) => {
			const updatedLine = { ...productionLines[lineId], ...updates };
			setProductionLines((prev) => ({
				...prev,
				[lineId]: updatedLine,
			}));

			setSyncInProgress(true);
			try {
				await updateUserProductionLine(lineId, updatedLine);
				const refreshedLines = await fetchProductionLines();
				setProductionLines(refreshedLines);
				setUpdateError(null); // Clear any errors
				setSyncInProgress(false);

				// Trigger recalculation if the active tab is updated
				if (lineId === activeTabId) {
					await calculateOptimization(lineId, refreshedLines[lineId]);
				}
			} catch (error) {
				console.error(`Error syncing production line ${lineId}:`, error);
			} finally {
				setSyncInProgress(false);
			}
		}, 300),
		[productionLines]
	);

	const removeProductionLine = useCallback(async (lineId: string) => {
		// Optimistically update local state
		setProductionLines((prev) => {
			const { [lineId]: _, ...remainingLines } = prev;
			return remainingLines;
		});

		// Adjust active tab if the removed line was active
		if (lineId === activeTabId) {
			const remainingLineIds = Object.keys(productionLines).filter((id) => id !== lineId);
			setActiveTabId(remainingLineIds[0] || null); // Set a new active tab, or null if none
		}

		setSyncInProgress(true); // Start sync
		try {
			// Sync with backend
			await updateUserProductionLine(lineId, null);
			const refreshedLines = await fetchProductionLines(); // Get updated lines from backend
			setProductionLines(refreshedLines); // Update local state with backend data
			setUpdateError(null); // Clear errors
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : "Failed to remove production line";
			setUpdateError(errorMessage);
			console.error(`Error removing production line ${lineId}:`, err);
		} finally {
			setSyncInProgress(false); // End sync
		}
	}, []);


	// Memoized state and update values
	const memoizedState = useMemo(() => ({
		productionLines,
		activeTabId,
		optimizationResults,
		loadingState,
		syncInProgress,
		calculatingResult
	}), [productionLines, activeTabId, optimizationResults, loadingState, syncInProgress, calculatingResult]);

	const memoizedUpdateFunctions = useMemo(
		() => ({
			handleTabChange,
			addProductionLine,
			updateProductionLine,
			removeProductionLine,
			queueRecalculation
		}),
		[handleTabChange, addProductionLine, updateProductionLine, removeProductionLine, queueRecalculation]
	);

	return (
		<ProductionLineStateContext.Provider value={memoizedState}>
			<ProductionLineUpdateContext.Provider value={memoizedUpdateFunctions}>
				{updateError && <div className="error">{updateError}</div>}
				{children}
			</ProductionLineUpdateContext.Provider>
		</ProductionLineStateContext.Provider>
	);
};
