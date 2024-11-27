import {ITEM_API_URL} from '../constants/constants';

export const fetchItemsComponentsDetail = async () => {
	try {
		const response = await fetch(`${ITEM_API_URL}/components/detail/`);
		return await response.json();
	} catch (error) {
		console.error('Error fetching component items:', error);
	}
};

