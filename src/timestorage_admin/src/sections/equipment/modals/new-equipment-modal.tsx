import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import LoadingButton from '@mui/lab/LoadingButton';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Grid from '@mui/material/Grid';
import { v4 as uuidv4 } from 'uuid';
import { insertUUIDStructure, updateValue } from 'src/services/canisterService';

interface NewEquipmentModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (productInfo: ProductInfo) => Promise<void>;
  loading: boolean;
  selectedUUID?: string;
}

interface ProductInfo {
  serialNumber: string;
  dimensions: string;
  modelNumber: string;
  materialType: string;
  glassType: string;
  energyRating: string;
  manufacturingDate: string;
  windowType: string;
}

const dimensions = ['36" x 48" x 3"', '24" x 36" x 3"', '30" x 60" x 3"'];
const modelNumbers = ['WND-2023-X450', 'WND-2023-X350', 'WND-2023-X250'];
const materialTypes = ['Vinyl', 'Wood', 'Aluminum', 'Fiberglass'];
const glassTypes = ['Double-Pane Low-E', 'Triple-Pane', 'Single-Pane'];
const energyRatings = [
  'Energy Star Certified - A++',
  'Energy Star Certified - A+',
  'Energy Star Certified - A',
];
const windowTypes = ['Double Hung', 'Single Hung', 'Casement', 'Awning'];

export function NewEquipmentModal({
  open,
  onClose,
  onSubmit,
  loading,
  selectedUUID,
}: NewEquipmentModalProps) {
  const [productInfo, setProductInfo] = useState<ProductInfo>({
    serialNumber: '',
    dimensions: '',
    modelNumber: '',
    materialType: '',
    glassType: '',
    energyRating: '',
    manufacturingDate: '',
    windowType: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field: keyof ProductInfo) => (event: any) => {
    setProductInfo((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleSubmit = async () => {
    if (!productInfo.serialNumber.trim()) return;

    try {
      await onSubmit(productInfo);

      setProductInfo({
        serialNumber: '',
        dimensions: '',
        modelNumber: '',
        materialType: '',
        glassType: '',
        energyRating: '',
        manufacturingDate: '',
        windowType: '',
      });
    } catch (error) {
      console.error('Error submitting equipment:', error);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>New Equipment</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField
              autoFocus
              label="Serial Number"
              fullWidth
              value={productInfo.serialNumber}
              onChange={handleChange('serialNumber')}
              disabled={loading}
            />
          </Grid>

          <Grid item xs={6}>
            <FormControl fullWidth>
              <InputLabel>Dimensions</InputLabel>
              <Select
                value={productInfo.dimensions}
                label="Dimensions"
                onChange={handleChange('dimensions')}
                disabled={loading}
              >
                {dimensions.map((dim) => (
                  <MenuItem key={dim} value={dim}>
                    {dim}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={6}>
            <FormControl fullWidth>
              <InputLabel>Model Number</InputLabel>
              <Select
                value={productInfo.modelNumber}
                label="Model Number"
                onChange={handleChange('modelNumber')}
                disabled={loading}
              >
                {modelNumbers.map((model) => (
                  <MenuItem key={model} value={model}>
                    {model}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={6}>
            <FormControl fullWidth>
              <InputLabel>Material Type</InputLabel>
              <Select
                value={productInfo.materialType}
                label="Material Type"
                onChange={handleChange('materialType')}
                disabled={loading}
              >
                {materialTypes.map((material) => (
                  <MenuItem key={material} value={material}>
                    {material}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={6}>
            <FormControl fullWidth>
              <InputLabel>Glass Type</InputLabel>
              <Select
                value={productInfo.glassType}
                label="Glass Type"
                onChange={handleChange('glassType')}
                disabled={loading}
              >
                {glassTypes.map((glass) => (
                  <MenuItem key={glass} value={glass}>
                    {glass}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={6}>
            <FormControl fullWidth>
              <InputLabel>Energy Rating</InputLabel>
              <Select
                value={productInfo.energyRating}
                label="Energy Rating"
                onChange={handleChange('energyRating')}
                disabled={loading}
              >
                {energyRatings.map((rating) => (
                  <MenuItem key={rating} value={rating}>
                    {rating}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={6}>
            <TextField
              type="date"
              label="Manufacturing Date"
              fullWidth
              value={productInfo.manufacturingDate}
              onChange={handleChange('manufacturingDate')}
              disabled={loading}
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Grid>

          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Window Type</InputLabel>
              <Select
                value={productInfo.windowType}
                label="Window Type"
                onChange={handleChange('windowType')}
                disabled={loading}
              >
                {windowTypes.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSubmitting || loading}>
          Cancel
        </Button>
        <LoadingButton
          disabled={!productInfo.serialNumber.trim()}
          onClick={handleSubmit}
          loading={isSubmitting || loading}
          variant="contained"
        >
          {selectedUUID ? 'Update' : 'Create'}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}
