export const API_URL = import.meta.env.VITE_API_URL;
console.log(API_URL)
// export const API_URL = `http://localhost:5000/api`
export const ITEM_API_URL = `${API_URL}/items`;
export const RECIPE_API_URL = `${API_URL}/recipes`
export const CALCULATOR_API_URL = `${API_URL}/calculator`
export const USER_CONFIG_API_URL = `${API_URL}/users`
