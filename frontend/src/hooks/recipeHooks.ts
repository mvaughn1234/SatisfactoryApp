import {useEffect, useMemo, useState} from 'react';
import {
	fetchRecipesComponentsDetail,
	fetchRecipesComponentsIds,
	fetchRecipesGroupedDetail
} from "../services/recipeService.ts";


export const useFetchRecipesComponentsDetail = () => {
	const [data, setData] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<Error | null>(null);

	useEffect(() => {
		// Immediately Invoked Function Expression

		(async () => {
			try {
				const recipes = await fetchRecipesComponentsDetail();
				setData(recipes);
			} catch (err) {
				setError(err as Error);
			} finally {
				setLoading(false);
			}
		})();
	}, []);

	return {fetchedRecipesComponentsDetail: {data, loading, error}};
};

export const useFetchRecipesComponentsIds = () => {
	const [data, setData] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<Error | null>(null);

	useEffect(() => {
		// Immediately Invoked Function Expression

		(async () => {
			try {
				const recipe_ids = await fetchRecipesComponentsIds();
				console.log("Fetching recipe component ids")
				setData(recipe_ids);
			} catch (err) {
				setError(err as Error);
			} finally {
				console.log("Setting loading ids to false")
				setLoading(false);
			}
		})();
	}, []);

	// Use `useMemo` to stabilize the returned object reference
	const fetchedRecipesComponentsIds = useMemo(
		() => ({data, loading, error}),
		[data, loading, error]
	);

	return {fetchedRecipesComponentsIds};
};

export const useFetchRecipesGroupedDetail = () => {
	const [data, setData] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<Error | null>(null);

	useEffect(() => {
		// Immediately Invoked Function Expression
		(async () => {
			try {
				const recipes = await fetchRecipesGroupedDetail();
				setData(recipes);
			} catch (err) {
				setError(err as Error);
			} finally {
				setLoading(false);
			}
		})();
	}, []);

	return {fetchedRecipesGroupedDetail: {data, loading, error}};
};