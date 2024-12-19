import React, { createContext, useContext, useEffect, useState, useMemo, ReactNode } from 'react';
import { useFetchItemsComponentsDetail } from "../hooks/itemHooks";
import { useFetchRecipesComponentsDetail, useFetchRecipesGroupedDetail } from "../hooks/recipeHooks";
import {StaticDataState} from "../types/ContextStoreInterfaces.ts";

const AppStaticDataContext = createContext<StaticDataState | null>(null);

// Custom hook for consuming the context
export const useAppStaticData = () => {
	const context = useContext(AppStaticDataContext);
	if (!context) {
		throw new Error('useAppStaticData must be used within AppStaticDataProvider');
	}
	return context;
};

interface AppProviderProps {
	children: ReactNode;
}

// Static Data Provider
export const AppStaticDataProvider: React.FC<AppProviderProps> = ({ children }) => {
	const [itemsComponentsDetail, setItemsComponentsDetail] = useState<StaticDataState["itemsComponentsDetail"]>([]);
	const [recipesComponentsDetail, setRecipesComponentsDetail] = useState<StaticDataState["recipesComponentsDetail"]>([]);
	const [recipesGroupedDetail, setRecipesGroupedDetail] = useState<StaticDataState["recipesGroupedDetail"]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const { fetchedItemsComponentsDetail } = useFetchItemsComponentsDetail();
	const { fetchedRecipesComponentsDetail } = useFetchRecipesComponentsDetail();
	const { fetchedRecipesGroupedDetail } = useFetchRecipesGroupedDetail();

	useEffect(() => {
		const fetchData = async () => {
			try {
				setLoading(true);

				// Wait for all data fetches to resolve
				const [
					itemsDetailResult,
					recipesDetailResult,
					groupedRecipesResult,
				] = await Promise.all([
					fetchedItemsComponentsDetail.loading
						? Promise.resolve(fetchedItemsComponentsDetail.data)
						: fetchedItemsComponentsDetail.data,
					fetchedRecipesComponentsDetail.loading
						? Promise.resolve(fetchedRecipesComponentsDetail.data)
						: fetchedRecipesComponentsDetail.data,
					fetchedRecipesGroupedDetail.loading
						? Promise.resolve(fetchedRecipesGroupedDetail.data)
						: fetchedRecipesGroupedDetail.data,
				]);

				// Set data states
				setItemsComponentsDetail(itemsDetailResult || []);
				setRecipesComponentsDetail(recipesDetailResult || []);
				setRecipesGroupedDetail(groupedRecipesResult || []);

			} catch (err) {
				console.error('Error fetching static data:', err);
				setError('Failed to fetch app static data');
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, [
		fetchedItemsComponentsDetail,
		fetchedRecipesComponentsDetail,
		fetchedRecipesGroupedDetail,
	]);

	// Memoize the state to prevent unnecessary re-renders
	const memoizedState = useMemo(
		() => ({
			itemsComponentsDetail,
			recipesComponentsDetail,
			recipesGroupedDetail,
			loading,
			error,
		}),
		[itemsComponentsDetail, recipesComponentsDetail, recipesGroupedDetail, loading, error]
	);

	return (
		<AppStaticDataContext.Provider value={memoizedState}>
			{children}
		</AppStaticDataContext.Provider>
	);
};
