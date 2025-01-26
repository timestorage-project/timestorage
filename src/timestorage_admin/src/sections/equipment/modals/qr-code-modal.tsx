import { Dialog, DialogTitle, DialogContent, Box, IconButton } from '@mui/material';
import { QRCodeSVG } from 'qrcode.react';
import { Iconify } from 'src/components/iconify';
import { getAppFrontendCanisterId } from 'src/services/canisterService';

interface QRCodeModalProps {
  open: boolean;
  onClose: () => void;
  uuid: string;
}

export function QRCodeModal({ open, onClose, uuid }: QRCodeModalProps) {
  // Construct the full URL using the current hostname
  const baseURL = getAppFrontendCanisterId();
  const url = `${baseURL}/${uuid}`;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Equipment QR Code
        <IconButton onClick={onClose}>
          <Iconify icon="eva:close-fill" />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <QRCodeSVG
            value={url}
            size={256}
            level="H"
            includeMargin
            imageSettings={{
              src: '/logo.png',
              x: undefined,
              y: undefined,
              height: 24,
              width: 24,
              excavate: true,
            }}
          />
        </Box>
      </DialogContent>
    </Dialog>
  );
}
