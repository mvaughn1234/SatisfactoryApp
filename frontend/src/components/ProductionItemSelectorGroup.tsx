import CloseIcon from '@mui/icons-material/Close';
import {Autocomplete, Box, IconButton, Popper, TextField, Typography} from '@mui/material';
import {autocompleteClasses} from '@mui/material/Autocomplete';
import {styled, useTheme} from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {FixedSizeList, ListChildComponentProps} from 'react-window';
import {ItemSummary} from "../types/Item.ts";
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
	availableItems: ItemSummary[];
}


const ProductionItemSelectorGroup: React.FC<Props> = ({
																												target,
																												isDummy = false,
																												onAdd,
																												onEdit,
																												onRemove,
																												availableItems,
																											}) => {
	const [product, setProduct] = useState<ItemSummary | null>(target.product);
	const [rate, setRate] = useState<number | null>(target.rate);
	const rateInputRef = useRef<HTMLInputElement>(null);

	const DEBOUNCE_DELAY = 300;

	useEffect(() => {
		if (isDummy && product && rate !== null) {
			const timer = setTimeout(() => {
				if (onAdd) {
					onAdd(product, rate);
				}
			}, DEBOUNCE_DELAY); // Delay to give users time to fill out the rate

			return () => clearTimeout(timer); // Cleanup the timer on changes
		}
	}, [isDummy, product, rate, onAdd]);

	useEffect(() => {
		if (!isDummy && rateInputRef.current) {
			rateInputRef.current.focus(); // Focus on the rate input when switching to non-dummy
		}
	}, [isDummy]);

	const handleRateChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
		const value = parseFloat(event.target.value);
		setRate(isNaN(value) ? null : value);
		if (!isDummy && onEdit) {
			onEdit(target.id, product, isNaN(value) ? null : value);
		}
	}, [isDummy, product, onEdit, target.id]);

	const handleProductChange = useCallback(
		(_event: React.ChangeEvent<{}>, newValue: ItemSummary | null) => {
			setProduct(newValue);
			if (!isDummy && onEdit) {
				onEdit(target.id, newValue, rate);
			}
		},
		[isDummy, onEdit, rate, target.id]
	);

	const handleRemove = useCallback(() => {
		if (onRemove) {
			onRemove(target.id);
		}
	}, [onRemove, target.id]);

	return (
		<Box
			// elevation={isDummy ? 0 : 2}
			sx={{
				px: 2, pt: isDummy ? 0 : 2, pb: 0,
				display: 'flex', alignItems: 'flex-center', borderRadius: 0,
				// backgroundColor: 'background.paper',
				'&:hover': {backgroundColor: !isDummy ? 'background.default' : ''},
			}}
		>
			<Autocomplete
				value={product}
				options={availableItems}
				getOptionLabel={(option) => option.display_name || option.class_name || ''}
				onChange={handleProductChange}
				// onChange={(_event, newValue) => {
				// 	// console.log("onChange triggered:", newValue);
				// 	setProduct(newValue as ItemDetail);
				// }}
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
				onChange={handleRateChange}
				// onChange={(e) => {
				// 	const val = e.target.value;
				// 	// Convert immediately to a number (or null if empty)
				// 	const numericVal = val === '' ? null : parseFloat(val);
				// 	setRate(isNaN(numericVal as number) ? null : numericVal);
				// }}
				variant="standard"
				inputRef={rateInputRef}
				// onBlur={() => !isDummy && onEdit?.(target.id, product, rate)}
				// Trigger commit to global state on losing focus
				// onKeyDown={handleKeyDown} // Trigger blur on Enter
				sx={{ml: 2, maxWidth: 50, minWidth: 30}}
			/>

			{!isDummy && (
				<IconButton onClick={handleRemove} color="error" sx={{ml: 1}}>
					<CloseIcon/>
				</IconButton>
			)}
		</Box>
	);
};

export default ProductionItemSelectorGroup;
