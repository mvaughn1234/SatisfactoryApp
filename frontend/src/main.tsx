// main.tsx (or index.tsx depending on your setup)
import ReactDOM from 'react-dom/client';
import App from './App';
import {AppStaticDataProvider} from "./store/AppStaticDataStore.tsx";
import {ProductionLineProvider} from "./store/ProductionLineContext.tsx";
import {RecipeConfigProvider} from "./store/RecipeConfigStore.tsx";  // Import the provider

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)
root.render(
		<AppStaticDataProvider>  {/* Wrap the app in AppProvider */}
			<ProductionLineProvider>
				<RecipeConfigProvider>
					<App/>
				</RecipeConfigProvider>
			</ProductionLineProvider>
		</AppStaticDataProvider>
);
