export interface raw_resource_lookup_props {
	[id: number]: {
		display_name: string;
		global_limit: number;
		gradient: string[];
	}
}

export interface node_props {
	id: number;
	type: string;
	rate: number;
	recipeName: string;
	standard_item_name: string;
	building_name: string;
	item_name: string;
}

export interface dg_node_props extends node_props{
	fx: number | null;
	fy: number | null;
	x: number;
	y: number;
}

export interface link_props {
	source: node_props;
	target: node_props;
	item_name: string;
	item_id: number;
	quantity: number;
}

export interface dg_link_props {
	source: dg_node_props;
	target: dg_node_props;
	item_name: string;
	item_id: number;
	quantity: number;
}

export interface NodesAndLinksData {
	nodes: node_props[];
	links: link_props[];
	processing: boolean;
}

export interface DGNodesAndLinksData {
	nodes: dg_node_props[];
	links: dg_link_props[];
	processing: boolean;
}

export interface SankeyNodesAndLinksData {
	nodes: SankeyInputNode[];
	links: SankeyInputLink[];
	processing: boolean;
}

