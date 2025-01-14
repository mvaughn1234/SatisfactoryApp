// main.tsx (or index.tsx depending on your setup)
import ReactDOM from 'react-dom/client';
import App from './App';
import {AppStaticDataProvider} from "./store/AppStaticDataStore.tsx";
import {ProductionLineProvider} from "./store/ProductionLineContext.tsx";
import React from 'react';
import { Provider } from 'react-redux';
import { recipeConfigsStore } from './store/recipeConfigsStore.ts';


const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)
root.render(
	<React.StrictMode>
		<AppStaticDataProvider>  {/* Wrap the app in AppProvider */}
			<ProductionLineProvider>
				<Provider store={recipeConfigsStore}>
					<App/>
				</Provider>
			</ProductionLineProvider>
		</AppStaticDataProvider>
	</React.StrictMode>
);
