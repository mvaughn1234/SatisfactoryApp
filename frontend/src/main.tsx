// main.tsx (or index.tsx depending on your setup)
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import {AppProvider} from './store/AppContext';
import {RecipeConfigProvider} from "./store/RecipeConfigStore.tsx";  // Import the provider

ReactDOM.render(
	<React.StrictMode>
		<AppProvider>  {/* Wrap the app in AppProvider */}
			<RecipeConfigProvider>
			<App/>
			</RecipeConfigProvider>
		</AppProvider>
	</React.StrictMode>,
	document.getElementById('root')
);
