import { useState, useCallback } from 'react';
import { TableRow, TableCell, CircularProgress, IconButton, Tooltip } from '@mui/material';
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableContainer from '@mui/material/TableContainer';
import Paper from '@mui/material/Paper';
import { Iconify } from 'src/components/iconify';
import { EquipmentTableHead } from './equipment-table-head';
import { EquipmentTableToolbar } from './equipment-table-toolbar';
import { EquipmentTableRow, EquipmentProps } from './equipment-table-row';

// ----------------------------------------------------------------------

type Order = 'asc' | 'desc';

type EquipmentTableProps = {
  equipmentList: EquipmentProps[];
  isLoading?: boolean;
  onViewDetail: (
    uuid: string,
    section: 'productInfo' | 'installationProcess' | 'maintenanceLog' | 'startInstallation'
  ) => void;
  onSelectRow?: (uuid: string) => void;
  page: number;
  rowsPerPage: number;
  onPageChange: (event: unknown, newPage: number) => void;
  onRowsPerPageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

export function EquipmentTable({
  equipmentList,
  isLoading = false,
  onViewDetail,
  onSelectRow,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
}: EquipmentTableProps) {
  const [order, setOrder] = useState<Order>('asc');
  const [orderBy, setOrderBy] = useState<keyof EquipmentProps>('brand');
  const [selected, setSelected] = useState<string[]>([]);
  const [filterName, setFilterName] = useState('');

  const handleRequestSort = useCallback(
    (property: keyof EquipmentProps) => {
      const isAsc = orderBy === property && order === 'asc';
      setOrder(isAsc ? 'desc' : 'asc');
      setOrderBy(property);
    },
    [order, orderBy]
  );

  const handleSelectAllRows = useCallback(
    (checked: boolean) => {
      if (checked) {
        const newSelecteds = equipmentList.map((row) => row.id);
        setSelected(newSelecteds);
      } else {
        setSelected([]);
      }
    },
    [equipmentList]
  );

  const handleSelectRow = useCallback(
    (id: string) => {
      const selectedIndex = selected.indexOf(id);
      let newSelected: string[] = [];

      if (selectedIndex === -1) {
        newSelected = newSelected.concat(selected, id);
      } else if (selectedIndex === 0) {
        newSelected = newSelected.concat(selected.slice(1));
      } else if (selectedIndex === selected.length - 1) {
        newSelected = newSelected.concat(selected.slice(0, -1));
      } else if (selectedIndex > 0) {
        newSelected = newSelected.concat(
          selected.slice(0, selectedIndex),
          selected.slice(selectedIndex + 1)
        );
      }

      setSelected(newSelected);

      if (onSelectRow) {
        const selectedEquipment = equipmentList.find((eq) => eq.id === id);
        if (selectedEquipment) {
          onSelectRow(selectedEquipment.UUID);
        }
      }
    },
    [selected, equipmentList, onSelectRow]
  );

  const handleChangePage = onPageChange;
  const handleChangeRowsPerPage = onRowsPerPageChange;

  const handleFilterByName = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setFilterName(event.target.value);
  }, []);

  const filteredEquipmentList = equipmentList.filter(
    (row) =>
      row.brand?.toLowerCase().includes(filterName.toLowerCase()) ||
      row.model?.toLowerCase().includes(filterName.toLowerCase()) ||
      row.serialNo?.toLowerCase().includes(filterName.toLowerCase()) ||
      row.UUID?.toLowerCase().includes(filterName.toLowerCase()) ||
      row.installerName?.toLowerCase().includes(filterName.toLowerCase())
  );

  const emptyRows =
    page > 0 ? Math.max(0, (1 + page) * rowsPerPage - filteredEquipmentList.length) : 0;

  const renderActions = (row: EquipmentProps) => (
    <Box sx={{ display: 'flex', gap: 1 }}>
      <Tooltip title="View Product Info">
        <IconButton size="small" onClick={() => onViewDetail(row.UUID, 'productInfo')}>
          <Iconify icon="mdi:information" />
        </IconButton>
      </Tooltip>
      <Tooltip title="View Installation">
        <IconButton size="small" onClick={() => onViewDetail(row.UUID, 'installationProcess')}>
          <Iconify icon="mdi:tools" />
        </IconButton>
      </Tooltip>
      <Tooltip title="View Maintenance">
        <IconButton size="small" onClick={() => onViewDetail(row.UUID, 'maintenanceLog')}>
          <Iconify icon="mdi:notebook" />
        </IconButton>
      </Tooltip>
    </Box>
  );

  return (
    <Box sx={{ width: '100%' }}>
      <Paper sx={{ width: '100%', mb: 2 }}>
        <EquipmentTableToolbar
          numSelected={selected.length}
          filterName={filterName}
          onFilterName={handleFilterByName}
        />
        <TableContainer>
          <Table sx={{ minWidth: 750 }}>
            <EquipmentTableHead
              order={order}
              orderBy={orderBy}
              headLabel={[
                { id: 'brand', label: 'Brand' },
                { id: 'model', label: 'Model' },
                { id: 'serialNo', label: 'Serial No' },
                { id: 'UUID', label: 'UUID' },
                { id: 'status', label: 'Status' },
                { id: 'installationData', label: 'Installation Data' },
                { id: 'installerName', label: 'Installer Name' },
                { id: 'actions', label: 'Actions' },
              ]}
              onRequestSort={handleRequestSort}
              onSelectAllRows={handleSelectAllRows}
              rowCount={filteredEquipmentList.length}
              numSelected={selected.length}
            />
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <CircularProgress />
                      <Box sx={{ ml: 2 }}>Loading equipment data...</Box>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : filteredEquipmentList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                    No equipment found
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {filteredEquipmentList
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((row) => (
                      <EquipmentTableRow
                        key={row.id}
                        row={row}
                        selected={selected.includes(row.id)}
                        onSelectRow={() => handleSelectRow(row.id)}
                        onViewDetail={onViewDetail}
                      />
                    ))}
                  {emptyRows > 0 && (
                    <TableRow style={{ height: 53 * emptyRows }}>
                      <TableCell colSpan={8} />
                    </TableRow>
                  )}
                </>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}
