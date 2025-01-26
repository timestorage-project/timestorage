import { useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import Popover from '@mui/material/Popover';
import MenuList from '@mui/material/MenuList';
import MenuItem, { menuItemClasses } from '@mui/material/MenuItem';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { Divider } from '@mui/material';
import { QRCodeModal } from './modals/qr-code-modal';

// ----------------------------------------------------------------------

export type EquipmentProps = {
  id: string;
  brand: string;
  model: string;
  serialNo: string;
  UUID: string;
  status: 'installed' | 'created' | 'installing';
  installationData: 'available' | 'missing';
  installerName: string;
  actions: string;
};

type EquipmentTableRowProps = {
  row: EquipmentProps;
  selected: boolean;
  onSelectRow: () => void;
  onViewDetail: (
    uuid: string,
    section: 'productInfo' | 'installationProcess' | 'maintenanceLog' | 'startInstallation'
  ) => void;
};

export function EquipmentTableRow({
  row,
  selected,
  onSelectRow,
  onViewDetail,
}: EquipmentTableRowProps) {
  
  const [openPopover, setOpenPopover] = useState<HTMLButtonElement | null>(null);
  
  const [qrModalOpen, setQrModalOpen] = useState(false);

  const handleOpenPopover = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    setOpenPopover(event.currentTarget);
  }, []);

  const handleClosePopover = useCallback(() => {
    setOpenPopover(null);
  }, []);

  const handleViewDetail = useCallback(
    (section: 'productInfo' | 'installationProcess' | 'maintenanceLog' | 'startInstallation') => {
      onViewDetail(row.UUID, section);
      handleClosePopover();
    },
    [row.UUID, onViewDetail, handleClosePopover]
  );

  const handleShowQRCode = useCallback(() => {
    setQrModalOpen(true);
    handleClosePopover();
  }, [handleClosePopover]);

  return (
    <>
      <TableRow hover tabIndex={-1} role="checkbox" selected={selected}>
        <TableCell padding="checkbox">
          <Checkbox disableRipple checked={selected} onChange={onSelectRow} />
        </TableCell>

        <TableCell>{row.brand}</TableCell>
        <TableCell>{row.model}</TableCell>
        <TableCell>{row.serialNo}</TableCell>
        <TableCell>{row.UUID}</TableCell>
        <TableCell>
          <Label
            color={
              row.status === 'installed'
                ? 'success'
                : row.status === 'installing'
                  ? 'warning'
                  : 'error'
            }
          >
            {row.status}
          </Label>
        </TableCell>
        <TableCell>
          <Label color={row.installationData === 'available' ? 'success' : 'error'}>
            {row.installationData}
          </Label>
        </TableCell>
        <TableCell>{row.installerName}</TableCell>
        <TableCell align="right">
          <IconButton onClick={handleOpenPopover}>
            <Iconify icon="eva:more-vertical-fill" />
          </IconButton>
        </TableCell>
      </TableRow>

      <Popover
        open={!!openPopover}
        anchorEl={openPopover}
        onClose={handleClosePopover}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuList
          disablePadding
          sx={{
            p: 0.5,
            gap: 0.5,
            width: 200,
            display: 'flex',
            flexDirection: 'column',
            [`& .${menuItemClasses.root}`]: {
              px: 1,
              gap: 2,
              borderRadius: 0.75,
              [`&.${menuItemClasses.selected}`]: { bgcolor: 'action.selected' },
            },
          }}
        >
          <MenuItem onClick={() => handleViewDetail('productInfo')}>
            <Iconify icon="mdi:information" />
            View Product Info
          </MenuItem>

          <MenuItem onClick={() => handleViewDetail('installationProcess')}>
            <Iconify icon="mdi:tools" />
            View Installation
          </MenuItem>

          <MenuItem onClick={() => handleViewDetail('maintenanceLog')}>
            <Iconify icon="mdi:notebook" />
            View Maintenance
          </MenuItem>

          <Divider sx={{ my: 0.5 }} />
          <MenuItem onClick={handleShowQRCode}>
            <Iconify icon="mdi:qrcode" />
            Show QR Code
          </MenuItem>

          {/* <MenuItem onClick={handleClosePopover}>
            <Iconify icon="solar:pen-bold" />
            Edit
          </MenuItem> */}

          {/* <MenuItem onClick={handleClosePopover} sx={{ color: 'error.main' }}>
            <Iconify icon="solar:trash-bin-trash-bold" />
            Delete
          </MenuItem> */}
        </MenuList>
      </Popover>

      <QRCodeModal open={qrModalOpen} onClose={() => setQrModalOpen(false)} uuid={row.UUID} />
    </>
  );
}
