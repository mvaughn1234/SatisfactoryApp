const USER_KEY_STORAGE = 'userKey';

// Generate a new user key
const generateUserKey = () => crypto.randomUUID();

// Initialize the user key if it doesn’t exist
const initializeUserKey = () => {
	const existingKey = localStorage.getItem(USER_KEY_STORAGE);
	if (!existingKey) {
		const newKey = generateUserKey();
		localStorage.setItem(USER_KEY_STORAGE, newKey);
		console.log('Generated new user key:', newKey);
		return newKey;
	}
	return existingKey;
};

// Retrieve the user key, ensuring it's initialized
const getUserKey = () => {
	const userKey = localStorage.getItem(USER_KEY_STORAGE);
	return userKey || initializeUserKey(); // Initialize if missing
};

export { getUserKey };
