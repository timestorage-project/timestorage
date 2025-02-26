import { useState, useCallback, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import TablePagination from '@mui/material/TablePagination';
import { v4 as uuidv4 } from 'uuid';

import { DashboardContent } from 'src/layouts/dashboard';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { DataNode } from 'src/entities/icp';
import { useEquipmentStore } from 'src/store/equipment.store';
import {
  getAllUUIDsWithInfo,
  insertUUIDStructure,
  updateValue,
} from 'src/services/canisterService';

import { authService } from '../auth/auth';
import { EquipmentTable } from './equipment-table';
import type { EquipmentProps } from './equipment-table-row';
import { NewEquipmentModal } from './modals/new-equipment-modal';
import DetailModal from './modals/detail-modal';
import { BatchGenerationModal } from './modals/batch-generation-modal';
import { equipmentV1 } from 'src/constants/equipment-base-structure.constants';

export interface ProductInfo {
  serialNumber: string;
  dimensions: string;
  modelNumber: string;
  materialType: string;
  glassType: string;
  energyRating: string;
  manufacturingDate: string;
  windowType: string;
}

// ----------------------------------------------------------------------

export function EmptyEquipmentView() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [batchLoading, setBatchLoading] = useState(false);

  const { setEquipmentList, getEmptySerialEquipment } = useEquipmentStore();
  const equipmentList = getEmptySerialEquipment();

  const [selectedEmptyUUID, setSelectedEmptyUUID] = useState<string>('');

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedUUID, setSelectedUUID] = useState('');
  const [selectedSection, setSelectedSection] = useState<
    'productInfo' | 'installationProcess' | 'maintenanceLog' | 'startInstallation'
  >('productInfo');

  const baseStructure = JSON.stringify(equipmentV1);
  const handleSelectRow = (id: string) => {
    setSelectedEmptyUUID(id);
    setModalOpen(true);
  };

  const handleBatchGeneration = async (count: number) => {
    try {
      setBatchLoading(true);
      const principal = await authService.getPrincipal();

      if (!principal) {
        throw new Error('You must be authenticated to create equipment');
      }

      // Generate multiple UUIDs and insert structures
      const promises = Array.from({ length: count }, async () => {
        const newUuid = `${uuidv4()}`;
        return insertUUIDStructure(newUuid, baseStructure);
      });

      await Promise.all(promises);
      await fetchEquipment();
      setBatchModalOpen(false);
    } catch (error) {
      console.error('Error creating batch equipment:', error);
    } finally {
      setBatchLoading(false);
    }
  };

  const handleCreateEquipment = async (productInfo: ProductInfo) => {
    try {
      setModalLoading(true);
      const principal = await authService.getPrincipal();

      if (!principal) {
        throw new Error('You must be authenticated to create equipment');
      }

      const uuid = selectedEmptyUUID || `${uuidv4()}`;

      if (!selectedEmptyUUID) {
        await insertUUIDStructure(uuid, baseStructure);
      }

      const requests = [
        updateValue(uuid, 'productInfo.serialNumber', productInfo.serialNumber, true),
        updateValue(uuid, 'productInfo.dimensions', productInfo.dimensions, true),
        updateValue(uuid, 'productInfo.modelNumber', productInfo.modelNumber, true),
        updateValue(uuid, 'productInfo.materialType', productInfo.materialType, true),
        updateValue(uuid, 'productInfo.glassType', productInfo.glassType, true),
        updateValue(uuid, 'productInfo.energyRating', productInfo.energyRating, true),
        updateValue(uuid, 'productInfo.manufacturingDate', productInfo.manufacturingDate, true),
        updateValue(uuid, 'productInfo.windowType', productInfo.windowType, true),
      ];
      await Promise.all(requests);

      await fetchEquipment();
      setModalOpen(false);
      setSelectedEmptyUUID('');
    } catch (error) {
      console.error('Error updating equipment:', error);
    } finally {
      setModalLoading(false);
    }
  };

  const handleOpenDetail = (uuid: string, section: typeof selectedSection) => {
    setSelectedUUID(uuid);
    setSelectedSection(section);
    setDetailModalOpen(true);
  };

  const fetchEquipment = useCallback(async () => {
    try {
      setIsLoading(true);
      const allUUIDs = await getAllUUIDsWithInfo();

      const mappedEquipment = allUUIDs.map(({ uuid, data }) => {
        const lookArray = [data.installationProcess, data.productInfo, data.maintenanceLog];
        const merged = lookArray.reduce<DataNode>(
          (acc, curr) => {
            if (!curr) return acc;
            return {
              ...acc,
              children: [...acc.children, ...curr.children],
            };
          },
          {
            id: '',
            title: '',
            description: '',
            children: [],
            questions: [],
            isWizard: false,
          } as unknown as DataNode
        );

        // Extract values from the children array
        const getValue = (key: string) => {
          const child = merged.children.find((c: { label: string }) =>
            c.label.toLowerCase().includes(key.toLowerCase())
          );
          return child?.value || '-';
        };

        return {
          id: uuid,
          UUID: uuid,
          brand: 'FINX',
          model: getValue('model'),
          serialNo: getValue('serial'),
          status: getValue('installer') ? 'installed' : 'to be installed',
          installationData:
            getValue('INSTALLER_NAME_LABEL') && getValue('INSTALLER_NAME_LABEL') !== '-'
              ? 'available'
              : 'not available',
          installerName: getValue('INSTALLER_NAME_LABEL')?.toUpperCase(),
        };
      });

      setEquipmentList(mappedEquipment as unknown as EquipmentProps[]);
    } catch (error) {
      console.error('Error fetching equipment:', error);
    } finally {
      setIsLoading(false);
    }
  }, [setEquipmentList]);

  useEffect(() => {
    fetchEquipment();
  }, [fetchEquipment]);

  const handleChangePage = useCallback((event: unknown, newPage: number) => {
    setPage(newPage);
  }, []);

  const handleChangeRowsPerPage = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }, []);

  return (
    <DashboardContent>
      <Box display="flex" alignItems="center" mb={5}>
        <Typography variant="h4" flexGrow={1}>
          Empty Equipment
        </Typography>
        <Button
          variant="contained"
          color="inherit"
          startIcon={<Iconify icon="mingcute:add-line" />}
          onClick={() => setBatchModalOpen(true)}
          sx={{ mr: 2 }}
        >
          Batch Generate
        </Button>
        <Button
          variant="contained"
          color="inherit"
          startIcon={<Iconify icon="mingcute:add-line" />}
          onClick={() => setModalOpen(true)}
        >
          New Equipment
        </Button>
      </Box>

      <BatchGenerationModal
        open={batchModalOpen}
        onClose={() => setBatchModalOpen(false)}
        onSubmit={handleBatchGeneration}
        loading={batchLoading}
      />

      <NewEquipmentModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedEmptyUUID('');
        }}
        loading={modalLoading}
        selectedUUID={selectedEmptyUUID}
        onSubmit={handleCreateEquipment}
      />

      <Card>
        <Scrollbar>
          <EquipmentTable
            equipmentList={equipmentList}
            isLoading={isLoading}
            onSelectRow={handleSelectRow}
            onViewDetail={(uuid, section) => handleOpenDetail(uuid, section)}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Scrollbar>

        <DetailModal
          open={detailModalOpen}
          onClose={() => setDetailModalOpen(false)}
          uuid={selectedUUID}
          section={selectedSection}
        />

        <TablePagination
          component="div"
          page={page}
          count={equipmentList.length}
          rowsPerPage={rowsPerPage}
          onPageChange={handleChangePage}
          rowsPerPageOptions={[5, 10, 25]}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Card>
    </DashboardContent>
  );
}
