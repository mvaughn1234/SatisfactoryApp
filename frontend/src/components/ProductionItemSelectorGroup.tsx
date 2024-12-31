import CloseIcon from '@mui/icons-material/Close';
import {Autocomplete, Box, IconButton, Popper, TextField, Typography} from '@mui/material';
import {autocompleteClasses} from '@mui/material/Autocomplete';
import {styled, useTheme} from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import React, {useEffect, useRef, useState} from 'react';
import {FixedSizeList, ListChildComponentProps} from 'react-window';
import {useAppStaticData} from "../store/AppStaticDataStore.tsx";
import {useProductionLineState, useProductionLineUpdate} from "../store/ProductionLineContext.tsx";
import {ItemDetail, ItemSummary} from "../types/Item.ts";
import {ProductionTarget} from '../types/ProductionLine';

const LISTBOX_PADDING = 8;

// Define ListboxComponent for virtualized rendering
const CustomListboxComponent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
	({children, ...other}, ref) => {
		const theme = useTheme();
		const smUp = useMediaQuery(theme.breakpoints.up('sm'), {noSsr: true});

		const itemData = React.Children.toArray(children);

		return (
			<div ref={ref} {...other}>
				<FixedSizeList
					width="100%"
					itemSize={smUp ? 36 : 48}
					height={150}
					overscanCount={5}
					itemCount={itemData.length}
				>
					{({index, style}: ListChildComponentProps) => (
						<Typography style={{...style, top: ((style.top as number) || 0) + LISTBOX_PADDING}}>
							{itemData[index]}
						</Typography>
					)}
				</FixedSizeList>
			</div>
		);
	}
);


const StyledPopper = styled(Popper)({
	[`& .${autocompleteClasses.listbox}`]: {
		boxSizing: 'border-box',
		'& ul': {padding: 0, margin: 0},
	},
});

interface Props {
	target: ProductionTarget;
	isDummy?: boolean;
	onAdd?: (product: ItemSummary | null, rate: number | null) => void;
	onEdit?: (id: string, product: ItemSummary | null, rate: number | null) => void;
	onRemove?: (id: string) => void;
}


const ProductionItemSelectorGroup: React.FC<Props> = ({target, isDummy, onAdd, onEdit}) => {
	const {itemsComponentsDetail} = useAppStaticData();
	const {productionLines,activeTabId} = useProductionLineState();
	const {updateProductionLine} = useProductionLineUpdate();
	const [product, setProduct] = useState<ItemSummary | null>(target.product);
	const [rate, setRate] = useState<number | null>(target.rate);
	const rateInputRef = useRef<HTMLInputElement>(null);

	const DEBOUNCE_DELAY = 100;

	useEffect(() => {
		if (rateInputRef.current && !isDummy) {
			rateInputRef.current.focus();
		}
	}, [isDummy, target.id]);

	useEffect(() => {
		if (!isDummy && target.id) {
			handleEditTarget(target.id, product, rate);
		}
	}, [isDummy, product]);

	useEffect(() => {
		if (isDummy && product && rate !== null && onAdd && rate !== 0 && rate != 0) {
			const handler = setTimeout(() => {
				onAdd(product, rate);
			}, DEBOUNCE_DELAY)

			return () => {
				clearTimeout(handler);
			};
		}
	}, [isDummy, onAdd, product, rate]);

	const removeGroup = () => {
		if (!isDummy) {
			handleRemoveTarget(target.id);
		} else {
			setProduct(null);
			setRate(null);
		}
	};

	// const handleRateBlur = () => {
	// 	const parsedRate = rate !== '' && rate !== null ? parseFloat(rate) : null; // Convert string to float
	// 	if (product !== null) {
	// 		handleEditTarget(target.id, product, !isNaN(parsedRate) ? parsedRate : null);
	// 	}
	// };

	const handleRateBlur = () => {
		// const parsedRate = rate !== '' && rate !== null ? parseFloat(rate) : null;
		// if (product !== null && (parsedRate !== target.rate || product !== target.product)) {
		// 	onEdit?.(target.id, product, !isNaN(parsedRate) ? parsedRate : null); // Notify parent of changes
		// }
		if (product !== null && (rate !== target.rate || product !== target.product)) {
			onEdit?.(target.id, product, rate); // rate is already a number | null
		}
	};

	// Function to update global state for the active production line's targets
	const updateGlobalLine = (newTargets: ProductionTarget[]) => {
		updateProductionLine(activeTabId, {production_targets: newTargets});
	};

	// Edit an existing target
	const handleEditTarget = (id: string, product: ItemSummary | null, rate: number | null) => {
		const currentLine = productionLines.find((line) => line['id'] === activeTabId)
		if (currentLine) {
			const updatedTarget = {
				id: `${activeTabId}.${product?.id || '0'}`,
				product: product,
				rate: rate,
			}
			const updatedTargets = currentLine['production_targets'].map(target =>
				target.id === id ? updatedTarget : target
			);
			updateGlobalLine(updatedTargets); // Update global state
		} else {
			updateGlobalLine([target])
		}
	};

	// Remove an existing target
	const handleRemoveTarget = (id: string) => {
		const currentLine = productionLines.find((line) => line['id'] === activeTabId)
		if (currentLine) {
			const updatedTargets = currentLine['production_targets'].filter(target => target.id !== id);
			updateGlobalLine(updatedTargets); // Update global state via context
		}
	};

	const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
		// console.log('Event: ', event, ' event.key: ', event.key);
		if (event.key === "Enter" && rateInputRef.current) {
			rateInputRef.current.blur(); // Remove focus, triggering onBlur
		}
	};

	return (
		<Box
			// elevation={isDummy ? 0 : 2}
			sx={{
				px: 2, pt: 1, pb: 0,
				display: 'flex', alignItems: 'flex-center', borderRadius: 0,
				// backgroundColor: 'background.paper',
				'&:hover': {backgroundColor: !isDummy ? 'background.default' : ''},
			}}
		>
			<Autocomplete
				value={product}
				options={itemsComponentsDetail}
				getOptionLabel={(option) => option.display_name || option.class_name || ''}
				onChange={(_event, newValue) => {
					// console.log("onChange triggered:", newValue);
					setProduct(newValue as ItemDetail);
				}}
				renderInput={(params) => (
					<TextField {...params} label={(isDummy || !product) ? "Select Product" : ''} variant="standard" sx={{minWidth: 200}}/>
				)}
				ListboxComponent={CustomListboxComponent}
				PopperComponent={StyledPopper}
			/>

			<TextField
				label={(isDummy || !rate) ? "Rate" : ''}
				type="number"
				value={rate || ''}
				// onChange={(e) => setRate(e.target.value)}
				onChange={(e) => {
					const val = e.target.value;
					// Convert immediately to a number (or null if empty)
					const numericVal = val === '' ? null : parseFloat(val);
					setRate(isNaN(numericVal as number) ? null : numericVal);
				}}
				variant="standard"
				inputRef={rateInputRef}
				onBlur={handleRateBlur}
				// Trigger commit to global state on losing focus
				onKeyDown={handleKeyDown} // Trigger blur on Enter
				sx={{ml: 2, maxWidth: 100, minWidth: 50}}
			/>

			{!isDummy && (
				<IconButton onClick={removeGroup} color="error" sx={{ml: 2}}>
					<CloseIcon/>
				</IconButton>
			)}
		</Box>
	);
};

export default ProductionItemSelectorGroup;
