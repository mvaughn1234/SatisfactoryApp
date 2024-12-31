import {debounce} from "lodash";
import React, {createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState} from 'react';
import {fetchLineOptimizationCalculation} from "../services/calculatorService.ts";
import {ProductionLineState, ProductionLineUpdate} from "../types/ContextStoreInterfaces.ts";
import {OptimizationResult, ProductionLine} from '../types/ProductionLine';
import {useFetchProductionLines} from '../hooks/userHooks';
import {updateUserProductionLine} from '../services/userConfigService';

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
	const [productionLines, setProductionLines] = useState<ProductionLine[]>([]);
	const [activeTabId, setActiveTabId] = useState<string>('0'); // Default to first tab
	const [loadingProductionLines, setLoadingProductionLines] = useState<boolean>(true);
	const [optimizedLineData, setOptimizedLineData] = useState<OptimizationResult | undefined>(undefined);
	const [calculationError, setCalculationError] = useState<string | null>(null); // Track fetch errors
	const [loadingOptimization, setLoadingOptimization] = useState<boolean>(true);
	const [queuedCalculation, setQueuedCalculation] = useState<boolean>(false);

	const {fetchedProductionLines} = useFetchProductionLines();

	// Fetch optimization results and store in optimized line data
	const fetchOptimizationData = useCallback(
		debounce(async (activeTabId: string) => {
			setLoadingOptimization(true);
			try {
				if (activeTabId) {
					const results = await fetchLineOptimizationCalculation(activeTabId);
					setOptimizedLineData(results ?? undefined);
					setCalculationError(null); // Clear any previous errors
					setLoadingOptimization(false);
				}
			} catch (error: unknown) {
				if (error instanceof Error) {
					console.error('Error fetching optimization data:', error);
					setCalculationError(error.message || 'Unknown error');
				} else {
					console.error('Unknown error:', error);
					setCalculationError('Unknown error');
				}
			}
		}, 300), // Debounce delay (300ms)
		[]
	);

	useEffect(() => {
		if (queuedCalculation) {
			setQueuedCalculation(false)
			console.log('queueing calculation')
			fetchOptimizationData(activeTabId);
			// Cleanup the debounce function on unmount
			// return () => fetchOptimizationData.cancel();
		}
	}, [activeTabId, queuedCalculation]);

	// Trigger the debounced fetch on production line changes
	useEffect(() => {
		fetchOptimizationData(activeTabId);
		// Cleanup the debounce function on unmount
		return () => fetchOptimizationData.cancel();
	}, [activeTabId, productionLines, fetchOptimizationData]);

	// Fetch production lines on mount
	useEffect(() => {
		setLoadingProductionLines(fetchedProductionLines.loading);

		if (!fetchedProductionLines.loading && fetchedProductionLines.data) {
			setProductionLines(fetchedProductionLines.data);
		}

		if (fetchedProductionLines.error) {
			console.error('Error fetching production lines:', fetchedProductionLines.error);
		}
	}, [fetchedProductionLines]);

	const queueCalculation = useCallback(() => {
		setQueuedCalculation(true);
	}, [queuedCalculation]);

	// Add a new production line
	const addProductionLine = useCallback((name: string) => {
		const new_line_id = `${productionLines.length}`
		const newLine: ProductionLine = {
			id: new_line_id, // Use timestamp for unique ID
			name,
			production_targets: [],
			input_customizations: [],
			recipe_customizations: [],
		};
		setProductionLines((prevLines) => [...prevLines, newLine]);
		setActiveTabId(newLine.id);

		(async () => {
			try {
				await updateUserProductionLine(new_line_id, newLine);
			} catch (err) {
				console.error(`Error updating production line ${new_line_id}:`, err);
			}
		})();
	}, [productionLines]);

	// Update an existing production line
	const updateProductionLine = useCallback((id: string, updates: Partial<ProductionLine>) => {
		setProductionLines((prevLines) => {
			const updatedLines = prevLines.map((line) =>
				line.id === id ? { ...line, ...updates } : line
			);

			// Perform backend update with the updated state
			(async () => {
				try {
					const activeLine = updatedLines.find((line) => line.id === id);
					if (activeLine) {
						await updateUserProductionLine(id, activeLine);
					}
				} catch (err) {
					console.error(`Error updating production line ${id}:`, err);
				}
			})();

			return updatedLines;
		});
	}, []);

	const removeProductionLine = useCallback((id: string) => {
		console.log("removing target product: ", id)
		setProductionLines((prevLines) => prevLines.filter((line) => line.id !== id));

		(async () => {
			try {
				await updateUserProductionLine(id, null); // Pass `null` or similar to delete
			} catch (err) {
				console.error(`Error removing production line ${id}:`, err);
			}
		})();
	}, []);

	// Memoized state and update values
	const memoizedState = useMemo(
		() => ({
			productionLines,
			activeTabId,
			loadingProductionLines,
			optimizedLineData,
			loadingOptimization,
			calculationError
		}),
		[productionLines, activeTabId, loadingProductionLines, optimizedLineData, loadingOptimization, calculationError]
	);

	const memoizedUpdateFunctions = useMemo(
		() => ({
			setActiveTabId,
			addProductionLine,
			updateProductionLine,
			removeProductionLine,
			queueCalculation
		}),
		[addProductionLine, updateProductionLine, removeProductionLine, queueCalculation]
	);

	return (
		<ProductionLineStateContext.Provider value={memoizedState}>
			<ProductionLineUpdateContext.Provider value={memoizedUpdateFunctions}>
				{children}
			</ProductionLineUpdateContext.Provider>
		</ProductionLineStateContext.Provider>
	);
};
