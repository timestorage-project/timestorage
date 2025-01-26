import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import LoadingButton from '@mui/lab/LoadingButton';

interface NewEquipmentModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (serialNo: string) => Promise<void>;
  loading: boolean;
}

export function NewEquipmentModal({ open, onClose, onSubmit, loading }: NewEquipmentModalProps) {
  const [serialNo, setSerialNo] = useState('');

  const handleSubmit = async () => {
    if (serialNo.trim()) {
      await onSubmit(serialNo);
      setSerialNo('');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>New Equipment</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Serial Number"
          fullWidth
          value={serialNo}
          onChange={(e) => setSerialNo(e.target.value)}
          disabled={loading}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <LoadingButton onClick={handleSubmit} loading={loading} variant="contained">
          Create
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}
