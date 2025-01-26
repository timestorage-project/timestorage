import { useCallback, useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  styled,
  IconButton,
  Box,
} from '@mui/material';
import * as canisterService from 'src/services/canisterService';

interface DetailModalProps {
  open: boolean;
  onClose: () => void;
  uuid: string;
  section: 'productInfo' | 'installationProcess' | 'maintenanceLog' | 'startInstallation';
}

interface FileCache {
  [key: string]: string;
}

const DetailModal = ({ open, onClose, uuid, section }: DetailModalProps) => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fileCache, setFileCache] = useState<FileCache>({});
  const [loadingFiles, setLoadingFiles] = useState<string[]>([]);

  const isFileId = (value: string) => /^file-\d+$/.test(value);

  const loadFile = useCallback(
    async (fileId: string) => {
      if (fileCache[fileId] || loadingFiles.includes(fileId)) return;

      try {
        setLoadingFiles((prev) => [...prev, fileId]);
        const fileData = await canisterService.getFileByUUIDAndId(uuid, fileId);
        setFileCache((prev) => ({
          ...prev,
          [fileId]: fileData,
        }));
      } catch (errorCatched) {
        console.error(`Error loading file ${fileId}:`, errorCatched);
      } finally {
        setLoadingFiles((prev) => prev.filter((id) => id !== fileId));
      }
    },
    [fileCache, loadingFiles, uuid]
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [response] = await canisterService.getUUIDInfo(uuid);
        const parsedData = JSON.parse(response);

        // Get values object from the parsed data
        const values = parsedData.values || {};

        // Map the data with values
        const mappedData = canisterService.mapApiResponseToDataStructure({
          data: parsedData.data,
          values,
        });

        // Set the specific section data
        setData(mappedData[section]);

        // Pre-load files if any
        mappedData[section].children?.forEach((item: { value: string }) => {
          if (isFileId(item.value)) {
            loadFile(item.value);
          }
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    if (open && uuid) {
      fetchData();
    }
  }, [open, uuid, section, loadFile]);

  const renderValue = (item: { label: string; value: string }) => {
    if (isFileId(item.value)) {
      if (loadingFiles.includes(item.value)) {
        return <Typography color="text.secondary">Loading file...</Typography>;
      }
      if (fileCache[item.value]) {
        const isImage = fileCache[item.value].startsWith('data:image/');
        if (isImage) {
          return (
            <img
              src={fileCache[item.value]}
              alt={item.label}
              style={{
                maxWidth: '100%',
                maxHeight: '200px',
                objectFit: 'contain',
                borderRadius: '4px',
              }}
            />
          );
        }
        return (
          <a
            href={fileCache[item.value]}
            download={`${item.label}.${fileCache[item.value].split(';')[0].split('/')[1]}`}
          >
            Download File
          </a>
        );
      }
      return <Typography color="error">Failed to load file</Typography>;
    }
    return item.value;
  };

  if (isLoading) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>Loading...</DialogTitle>
      </Dialog>
    );
  }

  if (error) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>Error</DialogTitle>
        <DialogContent>{error}</DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">{data?.title || 'Details'}</Typography>
          <IconButton edge="end" onClick={onClose}>
            X
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <List>
          {data?.children?.map((item: any, index: number) => (
            <ListItemStyled key={index} divider>
              <ListItemIcon sx={{ minWidth: 40 }}>
                <span role="img" aria-label={item.label}>
                  {item.icon}
                </span>
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                secondary={renderValue(item)}
                secondaryTypographyProps={{
                  component: 'div',
                }}
              />
            </ListItemStyled>
          ))}
        </List>
      </DialogContent>
    </Dialog>
  );
};

const ListItemStyled = styled(ListItem)`
  background-color: white;
  border-radius: 8px;
  margin-bottom: 8px;
  padding: 12px 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

export default DetailModal;
