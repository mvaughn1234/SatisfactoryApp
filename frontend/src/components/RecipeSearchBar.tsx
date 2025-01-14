// ./src/components/RecipeSearchBar.tsx
import Collapse from "@mui/material/Collapse";
import React, {useState} from 'react';
import {Stack, TextField, IconButton, Box, Typography, Checkbox, FormGroup, FormControlLabel} from '@mui/material';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import IndeterminateCheckBoxIcon from "@mui/icons-material/IndeterminateCheckBox";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";

type RecipeSearchBarProps = {
	searchValue: string;
	onSearchChange: (newValue: string) => void;
	// Add filters or grouping controls (alphabetical, group by, etc.) here:
	// onToggleGroupByAlphabet?: () => void;
	// onToggleGroupByRecipeGroups?: () => void;
	// onFilterSearch: (filters: {
	// 	known: boolean;
	// 	knownIndeterminate: boolean;
	// 	excluded: boolean;
	// 	excludedIndeterminate: boolean;
	// 	preferred: boolean;
	// 	preferredIndeterminate: boolean;
	// }) => void;
};

const RecipeSearchBar: React.FC<RecipeSearchBarProps> = ({
																													 searchValue,
																													 onSearchChange,
																													 // onFilterSearch,
																												 }) => {
	const [openFilter, setOpenFilter] = useState<boolean>(false);
	// const [known, setKnown] = useState<boolean>(false);
	// const [knownIndeterminate, setKnownIndeterminate] = useState<boolean>(true);
	// const [excluded, setExcluded] = useState<boolean>(false);
	// const [excludedIndeterminate, setExcludedIndeterminate] = useState<boolean>(true);
	// const [preferred, setPreferred] = useState<boolean>(false);
	// const [preferredIndeterminate, setPreferredIndeterminate] = useState<boolean>(true);
	//
	// const handleSetKnown = (_event) => {
	// 	if (known && !knownIndeterminate) {
	// 		setKnown(false)
	// 		setKnownIndeterminate(false)
	// 	} else if (!known && knownIndeterminate) {
	// 		setKnown(true)
	// 		setKnownIndeterminate(false)
	// 	} else if (!known && !knownIndeterminate) {
	// 		setKnownIndeterminate(true)
	// 		setKnown(false)
	// 	}
	// 	onFilterSearch({
	// 		known, knownIndeterminate,
	// 		excluded, excludedIndeterminate,
	// 		preferred, preferredIndeterminate
	// 	})
	// }
	//
	// const handleSetExcluded = (_event) => {
	// 	if (excluded && !excludedIndeterminate) {
	// 		setExcluded(false)
	// 		setExcludedIndeterminate(false)
	// 	} else if (!excluded && excludedIndeterminate) {
	// 		setExcluded(true)
	// 		setExcludedIndeterminate(false)
	// 	} else if (!excluded && !excludedIndeterminate) {
	// 		setExcludedIndeterminate(true)
	// 		setExcluded(false)
	// 	}
	// 	onFilterSearch({
	// 		known, knownIndeterminate,
	// 		excluded, excludedIndeterminate,
	// 		preferred, preferredIndeterminate
	// 	})
	// }
	// const handleSetPreferred = (_event) => {
	// 	if (preferred && !preferredIndeterminate) {
	// 		setPreferred(false)
	// 		setPreferredIndeterminate(false)
	// 	} else if (!preferred && preferredIndeterminate) {
	// 		setPreferred(true)
	// 		setPreferredIndeterminate(false)
	// 	} else if (!preferred && !preferredIndeterminate) {
	// 		setPreferredIndeterminate(true)
	// 		setPreferred(false)
	// 	}
	// 	onFilterSearch({
	// 		known, knownIndeterminate,
	// 		excluded, excludedIndeterminate,
	// 		preferred, preferredIndeterminate
	// 	})
	// }


	return (
		<Stack direction="column">
			<Stack direction="row" spacing={1} sx={{p: 1, justifyContent: 'space-between', alignItems: 'center'}}>
				<TextField
					value={searchValue}
					onChange={(e) => onSearchChange(e.target.value)}
					placeholder="Search..."
					size="small"
				/>
				{/*<IconButton onClick={() => setOpenFilter(!openFilter)}>*/}
				{/*	<FilterAltIcon/>*/}
				{/*</IconButton>*/}
			</Stack>
			{/*<Collapse in={openFilter} timeout="auto" unmountOnExit>*/}
			{/*</Collapse>*/}
			{/*<Stack direction="row" sx={{justifyContent: 'space-between'}}>*/}
			{/*	<Checkbox checked={known} indeterminate={knownIndeterminate} onChange={handleSetKnown}*/}
			{/*		// icon={<CheckBoxOutlineBlankIcon />}*/}
			{/*		// checkedIcon={<CheckBoxIcon />}*/}
			{/*		// indeterminateIcon={<IndeterminateCheckBoxIcon />}*/}
			{/*	/>*/}
			{/*	<Stack direction="row" sx={{pr: 2}}>*/}
			{/*		<Checkbox checked={excluded} indeterminate={excludedIndeterminate} onChange={handleSetExcluded}*/}
			{/*			// icon={<CheckBoxOutlineBlankIcon />}*/}
			{/*			// checkedIcon={<CheckBoxIcon />}*/}
			{/*			// indeterminateIcon={<IndeterminateCheckBoxIcon />}*/}
			{/*		/>*/}
			{/*		<Checkbox checked={preferred} indeterminate={preferredIndeterminate} onChange={handleSetPreferred}*/}
			{/*			// icon={<CheckBoxOutlineBlankIcon />}*/}
			{/*			// checkedIcon={<CheckBoxIcon />}*/}
			{/*			// indeterminateIcon={<IndeterminateCheckBoxIcon />}*/}
			{/*		/>*/}
			{/*	</Stack>*/}
			{/*</Stack>*/}
			{/*
        Optionally add more buttons or toggles for grouping,
        e.g. a button for 'Group Alphabetically' or 'No Group'
      */}
		</Stack>
	);
};

export default RecipeSearchBar;
