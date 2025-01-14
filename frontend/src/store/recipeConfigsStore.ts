// ./src/store/store.ts
import { configureStore } from '@reduxjs/toolkit';
import recipeReducer from './recipeSlice';

export const recipeConfigsStore = configureStore({
	reducer: {
		recipes: recipeReducer
	}
});

export type RootState = ReturnType<typeof recipeConfigsStore.getState>;
export type AppDispatch = typeof recipeConfigsStore.dispatch;