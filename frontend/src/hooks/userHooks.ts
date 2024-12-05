import {useEffect, useState} from "react";
import {
	fetchProductionLines,
	fetchUserRecipeConfig,
	updateUserProductionLine,
	updateUserRecipeConfig
} from "../services/userConfigService.ts";
import {ProductionLine} from "../types/ProductionLine.ts";
import {RecipeConfigs} from "../types/UserConfigs.ts";

export const useFetchUserRecipeConfig = () => {
	const [data, setData] = useState<RecipeConfigs>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<Error | null>(null);

	useEffect(() => {
		(async () => {
			try {
				const configs = await fetchUserRecipeConfig();
				setData(configs);
			} catch (err) {
				setError(err as Error);
			} finally {
				setLoading(false);
			}
		})();
	}, []);

	return {fetchedRecipeConfigs: {data, loading, error}};
};

export const useUpdateUserRecipeConfig = (recipeConfigUpdates: RecipeConfigs) => {
	const [data, setData] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<Error | null>(null);

	useEffect(() => {
		(async () => {
			try {
				const configs = await updateUserRecipeConfig(recipeConfigUpdates);
				setData(configs);
			} catch (err) {
				setError(err as Error);
			} finally {
				setLoading(false);
			}
		})();
	}, []);

	return {updatedRecipeConfigs: {data, loading, error}};
};

export const useFetchProductionLines = () => {
	const [data, setData] = useState<ProductionLine[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<Error | null>(null);

	useEffect(() => {
		(async () => {
			try {
				const configs = await fetchProductionLines();
				setData(configs);
			} catch (err) {
				setError(err as Error);
			} finally {
				setLoading(false);
			}
		})();
	}, []);

	return {fetchedProductionLines: {data, loading, error}};

}

export const useUpdateUserProductionLine = (id: string, updates: Partial<ProductionLine>) => {
	const [data, setData] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<Error | null>(null);

	useEffect(() => {
		(async () => {
			try {
				const configs = await updateUserProductionLine(id, updates);
				setData(configs);
			} catch (err) {
				setError(err as Error);
			} finally {
				setLoading(false);
			}
		})();
	}, []);

	return {updatedProductionLine: {data, loading, error}};
}