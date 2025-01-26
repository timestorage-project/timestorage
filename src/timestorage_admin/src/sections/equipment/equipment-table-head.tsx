import Box from '@mui/material/Box';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableSortLabel from '@mui/material/TableSortLabel';
import { Checkbox, TableHead } from '@mui/material';
import { visuallyHidden } from '../user/utils';
import { EquipmentProps } from './equipment-table-row';

// ----------------------------------------------------------------------

type HeadLabel = {
  id: keyof EquipmentProps;
  label: string;
  align?: 'left' | 'center' | 'right';
  width?: number | string;
  minWidth?: number | string;
};

type EquipmentTableHeadProps = {
  order: 'asc' | 'desc';
  orderBy: string;
  headLabel: HeadLabel[];
  onRequestSort: (property: keyof EquipmentProps) => void;
  onSelectAllRows: (checked: boolean) => void;
  rowCount: number;
  numSelected: number;
};

export function EquipmentTableHead({
  order,
  orderBy,
  headLabel,
  onRequestSort,
  onSelectAllRows,
  rowCount,
  numSelected,
}: EquipmentTableHeadProps) {
  return (
    <TableHead>
      <TableRow>
        <TableCell padding="checkbox">
          <Checkbox
            indeterminate={numSelected > 0 && numSelected < rowCount}
            checked={rowCount > 0 && numSelected === rowCount}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
              onSelectAllRows(event.target.checked)
            }
          />
        </TableCell>

        {headLabel.map((headCell) => (
          <TableCell
            key={headCell.id}
            align={headCell.align || 'left'}
            sortDirection={orderBy === headCell.id ? order : false}
            sx={{ width: headCell.width, minWidth: headCell.minWidth }}
          >
            <TableSortLabel
              hideSortIcon
              active={orderBy === headCell.id}
              direction={orderBy === headCell.id ? order : 'asc'}
              onClick={() => onRequestSort(headCell.id)}
            >
              {headCell.label}
              {orderBy === headCell.id ? (
                <Box sx={{ ...visuallyHidden }}>
                  {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                </Box>
              ) : null}
            </TableSortLabel>
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
}
