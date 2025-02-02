import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import LoadingButton from '@mui/lab/LoadingButton';
import Typography from '@mui/material/Typography';

interface BatchGenerationModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (count: number) => Promise<void>;
  loading: boolean;
}

export function BatchGenerationModal({
  open,
  onClose,
  onSubmit,
  loading,
}: BatchGenerationModalProps) {
  const [count, setCount] = useState<number>(1);
  const [error, setError] = useState<string>('');

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value, 10);
    setCount(value);

    if (value < 1) {
      setError('Count must be at least 1');
    } else if (value > 100) {
      setError('Maximum count is 100');
    } else {
      setError('');
    }
  };

  const handleSubmit = async () => {
    if (count >= 1 && count <= 100) {
      await onSubmit(count);
      setCount(1);
      setError('');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Batch Generate Empty Equipment</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ mb: 3, mt: 1 }}>
          Specify how many empty equipment UUIDs you want to generate. Maximum is 100 at a time.
        </Typography>
        <TextField
          autoFocus
          label="Number of UUIDs"
          type="number"
          fullWidth
          value={count}
          onChange={handleChange}
          disabled={loading}
          error={!!error}
          helperText={error}
          InputProps={{
            inputProps: { min: 1, max: 100 },
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <LoadingButton
          onClick={handleSubmit}
          loading={loading}
          variant="contained"
          disabled={!!error || count < 1 || count > 100}
        >
          Generate
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}
