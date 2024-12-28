type SankeyInputNode = {
	name: string
	column?: number,
}
type SankeyInputLink = {
	source: string,
	target: string,
	value: number,
	optimal: string
}
type SankeyInputData = {
	nodes: SankeyInputNode[],
	links: SankeyInputLink[],
}
type SankeyEnhancedLink = SankeyInputLink & {
	path: string,
	circular: boolean,
	source: SankeyEnhancedNode,
	target: SankeyEnhancedNode,
	y0: number,
	y1: number,
	width: number,
	index: number,
	circularLinkType?: "top" | "bottom",
}
type SankeyEnhancedNode = SankeyInputNode & {
	depth: number,
	x0: number,
	x1: number,
	y0: number,
	y1: number,
	x: number,
	y: number,
	index: number,
	partOfCycle: boolean,
	column: number,
	sourceLinks: SankeyEnhancedLink[],
	targetLinks: SankeyEnhancedLink[],
	circularLinkID?: number,
	circularLinkType?: "top" | "bottom",
	circularLinkPathData: never
}
type SankeyEnhancedData = {
	nodes: SankeyEnhancedNode[],
	links: SankeyEnhancedLink[],
}

interface nodeFn { (element: SankeyEnhancedNode): void }
interface nodeIdFn { (element: SankeyInputNode): (string | number) }
interface sankeyAlignFn { (element: SankeyEnhancedNode): number }

type size = [number, number]


declare module 'd3-sankey-circular' {
	type SankeyObject = {
		nodeId(arg: nodeIdFn): SankeyObject
		nodeAlign(arg: sankeyAlignFn): SankeyObject
		nodeWidth(arg: number): SankeyObject
		nodePadding(arg: number): SankeyObject
		nodePaddingRatio(arg: number): SankeyObject
		nodes(arg: never): SankeyObject
		links(arg: never): SankeyObject
		size(arg: size):  SankeyObject
		extent(arg: [size, size]): SankeyObject
		iterations(arg: number): SankeyObject
		circularLinkGap(arg: number): SankeyObject
		sortNodes(arg: string): SankeyObject
		update(arg: SankeyInputData): SankeyEnhancedData
		(arg: SankeyInputData): SankeyEnhancedData
	}
	export function sankeyCircular(): SankeyObject
	export function sankeyCenter(node: SankeyEnhancedNode): number
	export function sankeyLeft(node: SankeyEnhancedNode): number
	export function sankeyRight(node: SankeyEnhancedNode): number
	export function sankeyJustify(node: SankeyEnhancedNode): number
}
