// ./src/store/recipeSlice.ts
import {
	createSlice,
	createAsyncThunk,
	createEntityAdapter,
	PayloadAction
} from '@reduxjs/toolkit';
import {
	fetchUserRecipeConfigs,
	updateUserRecipeConfig
} from '../services/userConfigService';
import {RecipeConfigsState} from "../types/ContextStoreInterfaces.ts";
import { RecipeConfigs, RecipeConfigData } from '../types/UserConfigs';

export interface RecipeConfigEntity extends RecipeConfigData {}

// Redux state shape
const recipeConfigsAdapter = createEntityAdapter<RecipeConfigEntity>({});

const initialState = recipeConfigsAdapter.getInitialState<RecipeConfigsState>({
	loading: false,
	error: null
});

// Fetch recipes from the backend
export const fetchRecipes = createAsyncThunk<RecipeConfigs>(
	'recipeConfigs/fetchRecipes',
	async () => {
		const resultObj: RecipeConfigs = await fetchUserRecipeConfigs();
		// Convert from { [id: number]: RecipeConfigData } to RecipeConfigEntity[]
		// The adapter needs an array of { id, known, excluded, ... } objects.
		const entitiesArray = Object.values(resultObj); // [ {id:5, known:true}, {id:7,excluded:true}, ...]
		return entitiesArray;
	}
);

interface TogglePropertyArgs {
	id: number;
	property: 'known' | 'excluded' | 'preferred';
	newValue?: number | boolean;
}

export const toggleRecipePropertyThunk = createAsyncThunk<
	TogglePropertyArgs, // return type on success
	TogglePropertyArgs, // argument to the thunk
	{ rejectValue: string } //type for possible rejection
>(
	'recipeConfigs/toggleRecipeProperty',
	async (args, { rejectWithValue }) => {
		try {
			const { id, property, newValue } = args;
			console.log("Updating Property to backend: ", id, property, newValue)
			// Update the backend with the new value
			await updateUserRecipeConfig({ [id]: { [property]: newValue } });
			// Return the same args so the slice can update its store
			return args;
		} catch (err) {
			console.error('Error updating recipe property: ', err);
			return rejectWithValue('Failed to update recipe property.');
		}
	}
);

const recipeSlice = createSlice({
	name: 'recipeConfigs',
	initialState,
	reducers: {
		// Overwrite all recipe configs (eg. after the fetch)
		setAllRecipeConfigs: (state, action: PayloadAction<RecipeConfigData[]>) => {
			// Convert the array of objects (or if you have an object, do Object.values first)
			recipeConfigsAdapter.setAll(state, action.payload);
		}
		// Could do a direct toggle using a synchronous approach, but with
		// createAsyncThunk, can handle it instead in 'extraReducers'.
	},
	extraReducers: (builder) => {
		// fetchRecipes lifecycle
		builder.addCase(fetchRecipes.pending, (state) => {
			state.loading = true;
			state.error = null;
		});
		builder.addCase(fetchRecipes.fulfilled, (state, action) => {
			state.loading = false;
			// action.payload is an array of {id, known, excluded, preferred?}
			recipeConfigsAdapter.setAll(state, action.payload);
		});
		builder.addCase(fetchRecipes.rejected, (state, action) => {
			state.loading = false;
			state.error = action.error.message || 'Error fetching recipes';
		});

		// toggleRecipePropertyThunk lifecycle
		// Set the new value locally (optimistically)
		builder.addCase(toggleRecipePropertyThunk.pending, (state, action) => {
			const { id, property, newValue } = action.meta.arg;
			// adapter.updateOne to only update that single entity
			console.log("Updating locally: ", id, property, newValue)
			recipeConfigsAdapter.updateOne(state, {
				id,
				changes: {
					[property]: property === 'preferred'
						? (newValue as number) || id
						: !(state.entities[id]?.[property] ?? false) // if toggling a boolean
				}
			});
		});
		// If backend succeeds, do nothing (or finalize the state)
		builder.addCase(toggleRecipePropertyThunk.fulfilled, (state, action) => {
			// Could handle final returned data here, bu the actual value is the same.
			// The pending case already applied the update.
		});
		// If backend error, rollback
		builder.addCase(toggleRecipePropertyThunk.rejected, (state, action) => {
			// Ideally, a rollback could be stored in the meta arg
			// and revert to the old value here. For now, just setting the error.
			state.error = action.payload as string;
		});
	},
});

export const { setAllRecipeConfigs } = recipeSlice.actions;

export const recipeConfigsSelectors = recipeConfigsAdapter.getSelectors(
	(state: { recipes: ReturnType<typeof recipeSlice.reducer> }) => state.recipes
);

export default recipeSlice.reducer;