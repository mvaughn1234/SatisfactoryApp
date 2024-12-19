import {generateThreeStopGradient} from "../services/generateThreeStopGradient.ts";
import {raw_resource_lookup_props} from "../types/Other.ts";

const colors = {
	"Iron Ore": "#9994A6",
	"Coal": "#272733",
	"Water": "#2563AD",
	"Nitrogen Gas": "#F7FAD7",
	"Sulfur": "#FCDC48",
	"Sam Ore": "#d946ef",
	"Bauxite": "#CD7660",
	"Caterium Ore": "#E2B148",
	"Copper Ore": "#BD4C39",
	"Raw Quartz": "#F177B5",
	"Limestone": "#C8BFA7",
	"Uranium": "#88D288",
	"Cure Oil": "#7D0F9C"
}

const raw_resource_lookup: raw_resource_lookup_props = {
	155: { display_name: "Iron Ore", global_limit: 92100, gradient: generateThreeStopGradient(colors["Iron Ore"]) }, // Rusty orange to brown with depth
	156: { display_name: "Coal", global_limit: 42300, gradient: generateThreeStopGradient(colors["Coal"]) }, // Gradient of deep grays to black
	157: { display_name: "Water", global_limit: 9007199254740991, gradient: generateThreeStopGradient(colors["Water"]) }, // Bright aqua to deep blue
	158: { display_name: "Nitrogen Gas", global_limit: 12000, gradient: generateThreeStopGradient(colors["Nitrogen Gas"]) }, // Cyan blues transitioning into teal
	159: { display_name: "Sulfur", global_limit: 10800, gradient: generateThreeStopGradient(colors["Sulfur"]) }, // Bright yellow to warm golden orange
	160: { display_name: "Sam Ore", global_limit: 10200, gradient: generateThreeStopGradient(colors["Sam Ore"]) }, // Purplish-reds blending into deep maroon
	161: { display_name: "Bauxite", global_limit: 12300, gradient: generateThreeStopGradient(colors["Bauxite"]) }, // Rich peach-orange to deeper earthy orange
	162: { display_name: "Caterium Ore", global_limit: 15000, gradient: generateThreeStopGradient(colors["Caterium Ore"]) }, // Vibrant gold transitioning into deep amber
	163: { display_name: "Copper Ore", global_limit: 36900, gradient: generateThreeStopGradient(colors["Copper Ore"]) }, // Warm copper transitioning into bronze
	164: { display_name: "Raw Quartz", global_limit: 13500, gradient: generateThreeStopGradient(colors["Raw Quartz"]) }, // Light pink to lavender with purple hints
	165: { display_name: "Limestone", global_limit: 69900, gradient: generateThreeStopGradient(colors["Limestone"]) }, // Soft green transitioning into mossy green
	166: { display_name: "Uranium", global_limit: 2100, gradient: generateThreeStopGradient(colors["Uranium"]) }, // Glowing lime to strong green
	167: { display_name: "Cure Oil", global_limit: 12600, gradient: generateThreeStopGradient(colors["Cure Oil"]) }, // Dark teal to deep blue-black
};

export default raw_resource_lookup;