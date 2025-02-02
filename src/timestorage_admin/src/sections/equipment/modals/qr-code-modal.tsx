import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  IconButton,
  Typography,
  Link,
  Tooltip,
  IconButton as MuiIconButton,
} from '@mui/material';
import { QRCodeSVG } from 'qrcode.react';
import { Iconify } from 'src/components/iconify';
import { getFrontendCanisterUrl } from 'src/services/canisterService';
import { useState } from 'react';

interface QRCodeModalProps {
  open: boolean;
  onClose: () => void;
  uuid: string;
}

export function QRCodeModal({ open, onClose, uuid }: QRCodeModalProps) {
  const [copySuccess, setCopySuccess] = useState(false);

  const baseURL = getFrontendCanisterUrl();
  const url = `${baseURL}/${uuid}`;

  const handleCopyClick = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Equipment QR Code
        <IconButton onClick={onClose}>
          <Iconify icon="eva:close-fill" />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            p: 3,
          }}
        >
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

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              maxWidth: '100%',
              width: '100%',
              bgcolor: 'background.neutral',
              p: 1,
              borderRadius: 1,
            }}
          >
            <Link
              href={url}
              target="_blank"
              rel="noopener"
              sx={{
                flex: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                color: 'text.primary',
                '&:hover': { color: 'primary.main' },
              }}
            >
              {url}
            </Link>

            <Tooltip title={copySuccess ? 'Copied!' : 'Copy URL'}>
              <MuiIconButton
                onClick={handleCopyClick}
                size="small"
                sx={{
                  color: copySuccess ? 'success.main' : 'action.active',
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                <Iconify icon={copySuccess ? 'eva:checkmark-fill' : 'eva:copy-fill'} width={16} />
              </MuiIconButton>
            </Tooltip>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
