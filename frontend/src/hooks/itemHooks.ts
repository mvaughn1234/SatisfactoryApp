import {useEffect, useState} from "react";
import {fetchItemsComponentsDetail} from "../services/itemService.ts";

export const useFetchItemsComponentsDetail = () => {
	const [data, setData] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<Error | null>(null);

	useEffect(() => {
		// Immediately Invoked Function Expression

		(async () => {
			try {
				const components = await fetchItemsComponentsDetail();
				setData(components);
			} catch (err) {
				setError(err as Error);
			} finally {
				setLoading(false);
			}
		})();
	}, []);

	return {fetchedItemsComponentsDetail: {data, loading, error}};
};