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

  const { setEquipmentList, getEmptySerialEquipment } = useEquipmentStore();
  const equipmentList = getEmptySerialEquipment();

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedUUID, setSelectedUUID] = useState('');
  const [selectedSection, setSelectedSection] = useState<
    'productInfo' | 'installationProcess' | 'maintenanceLog' | 'startInstallation'
  >('productInfo');

  const baseStructure =
    '{"schema":{"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"https://example.com/my-data-wizard-schema.json","title":"Data & Wizard Structure Schema","type":"object","description":"A schema that validates sections of type \'data\' or \'wizard\'.","patternProperties":{"^.+$":{"$ref":"#/$defs/Section"}},"additionalProperties":false,"$defs":{"Section":{"type":"object","required":["id","title","description","type"],"properties":{"id":{"type":"string","description":"Unique identifier of this section."},"title":{"type":"string","description":"i18n key for the section title."},"description":{"type":"string","description":"i18n key for the section description."},"type":{"type":"string","enum":["data","wizard"],"description":"Defines whether this section is a \'data\' section or a \'wizard\' section."},"icon":{"type":"string","description":"Optional icon for visual representation."},"children":{"type":"array","description":"List of data items if this section is type \'data\'.","items":{"$ref":"#/$defs/DataItem"}},"questions":{"type":"array","description":"List of wizard questions if this section is type \'wizard\'.","items":{"$ref":"#/$defs/WizardQuestion"}}},"allOf":[{"if":{"properties":{"type":{"const":"data"}}},"then":{"required":["children"],"properties":{"questions":{"maxItems":0}}}},{"if":{"properties":{"type":{"const":"wizard"}}},"then":{"required":["questions"],"properties":{"children":{"maxItems":0}}}}]},"DataItem":{"type":"object","required":["label","value"],"properties":{"icon":{"type":"string","description":"Optional icon (emoji or string) to display next to the data."},"label":{"type":"string","description":"i18n key describing what this field represents."},"value":{"type":"string","description":"Reference or actual string to store the data."}},"additionalProperties":false},"WizardQuestion":{"type":"object","required":["id","type","question"],"properties":{"id":{"type":"string","description":"Unique identifier for this question."},"type":{"type":"string","enum":["text","select","multiselect","photo","multiphoto"],"description":"Question type."},"question":{"type":"string","description":"i18n key for the question text."},"options":{"type":"array","description":"List of choices (only required for \'select\' or \'multiselect\').","items":{"type":"string"}},"refId":{"type":"string","description":"Pointer to the data field where this answer should be stored."},"conditions":{"type":"array","description":"Optional array describing conditional logic for this question.","items":{"$ref":"#/$defs/Condition"}}},"allOf":[{"if":{"properties":{"type":{"enum":["select","multiselect"]}}},"then":{"required":["options"]}}],"additionalProperties":false},"Condition":{"type":"object","required":["questionId","operator","value","action"],"properties":{"questionId":{"type":"string","description":"ID of another question on which this question depends."},"operator":{"type":"string","enum":["equals","notEquals","in","notIn","greaterThan","lessThan"],"description":"Operator to evaluate."},"value":{"type":["string","number","boolean","array"],"description":"Value to compare against the answer of questionId."},"action":{"type":"string","enum":["show","hide","enable","disable","require","optional"],"description":"Action to perform if condition is met."}},"additionalProperties":false}}},"data":{"productInfo":{"id":"product-info","title":"PRODUCT_INFO_TITLE","description":"PRODUCT_INFO_DESCRIPTION","type":"data","icon":"info","children":[{"icon":"📏","label":"DIMENSIONS_LABEL","value":"#/values/productInfo/dimensions"},{"icon":"🔢","label":"MODEL_NUMBER_LABEL","value":"#/values/productInfo/modelNumber"},{"icon":"🏗️","label":"MATERIAL_TYPE_LABEL","value":"#/values/productInfo/materialType"},{"icon":"🪟","label":"GLASS_TYPE_LABEL","value":"#/values/productInfo/glassType"},{"icon":"⚡","label":"ENERGY_RATING_LABEL","value":"#/values/productInfo/energyRating"},{"icon":"📅","label":"MANUFACTURING_DATE_LABEL","value":"#/values/productInfo/manufacturingDate"},{"icon":"🔢","label":"SERIAL_NUMBER_LABEL","value":"#/values/productInfo/serialNumber"},{"icon":"📋","label":"INSTALLATION_STATUS_LABEL","value":"#/values/productInfo/installationStatus"},{"icon":"🪟","label":"WINDOW_TYPE_LABEL","value":"#/values/productInfo/windowType"}]},"installationProcess":{"id":"installation-process","title":"INSTALLATION_PROCESS_TITLE","description":"INSTALLATION_PROCESS_DESCRIPTION","type":"data","icon":"download","children":[{"icon":"📅","label":"SCHEDULED_DATE_LABEL","value":"#/values/installationProcess/scheduledDate"},{"icon":"👤","label":"INSTALLER_LABEL","value":"#/values/installationProcess/installer"},{"icon":"⏱️","label":"DURATION_LABEL","value":"#/values/installationProcess/duration"},{"icon":"📋","label":"STATUS_LABEL","value":"#/values/installationProcess/status"},{"icon":"🔧","label":"TOOLS_REQUIRED_LABEL","value":"#/values/installationProcess/toolsRequired"},{"icon":"👤","label":"INSTALLER_NAME_LABEL","value":"#/values/installationProcess/installerName"},{"icon":"🧰","label":"TOOLS_NEEDED_LABEL","value":"#/values/installationProcess/toolsNeeded"},{"icon":"📝","label":"INSTALLATION_NOTES_LABEL","value":"#/values/installationProcess/installationNotes"},{"icon":"📷","label":"WINDOW_PHOTO_LABEL","value":"#/values/installationProcess/windowPhoto"},{"icon":"📷","label":"INSTALLATION_PHOTOS_LABEL","value":"#/values/installationProcess/installationPhotos"}]},"maintenanceLog":{"id":"maintenance-log","title":"MAINTENANCE_LOG_TITLE","description":"MAINTENANCE_LOG_DESCRIPTION","type":"data","icon":"build","children":[{"icon":"🔧","label":"LAST_SERVICE_LABEL","value":"#/values/maintenanceLog/lastService"},{"icon":"📝","label":"SERVICE_TYPE_LABEL","value":"#/values/maintenanceLog/serviceType"},{"icon":"👤","label":"TECHNICIAN_LABEL","value":"#/values/maintenanceLog/technician"},{"icon":"📅","label":"NEXT_SERVICE_DUE_LABEL","value":"#/values/maintenanceLog/nextServiceDue"}]},"startInstallation":{"id":"wizard","title":"START_INSTALLATION_TITLE","description":"START_INSTALLATION_DESCRIPTION","type":"wizard","icon":"build","questions":[{"id":"scheduled_date","type":"text","question":"SCHEDULED_DATE_QUESTION","refId":"#/values/installationProcess/scheduledDate"},{"id":"installer","type":"text","question":"INSTALLER_QUESTION","refId":"#/values/installationProcess/installer"},{"id":"duration","type":"text","question":"DURATION_QUESTION","refId":"#/values/installationProcess/duration"},{"id":"status","type":"select","question":"STATUS_QUESTION","options":["Pending","In Progress","Completed","Delayed"],"refId":"#/values/installationProcess/status"},{"id":"tools_required","type":"multiselect","question":"TOOLS_REQUIRED_QUESTION","options":["Drill","Level","Tape Measure","Screwdriver","Caulk Gun","Safety Glasses","Work Gloves"],"refId":"#/values/installationProcess/toolsRequired"},{"id":"installer_name","type":"text","question":"INSTALLER_NAME_QUESTION","refId":"#/values/installationProcess/installerName"},{"id":"tools_needed","type":"multiselect","question":"TOOLS_NEEDED_QUESTION","options":["Drill","Level","Tape Measure","Screwdriver","Caulk Gun","Safety Glasses","Work Gloves"],"refId":"#/values/installationProcess/toolsNeeded"},{"id":"installation_notes","type":"text","question":"INSTALLATION_NOTES_QUESTION","refId":"#/values/installationProcess/installationNotes"},{"id":"window_photo","type":"photo","question":"WINDOW_PHOTO_QUESTION","refId":"#/values/installationProcess/windowPhoto"},{"id":"installation_photos","type":"multiphoto","question":"INSTALLATION_PHOTOS_QUESTION","refId":"#/values/installationProcess/installationPhotos"}]}}}';

  const handleCreateEquipment = async (productInfo: ProductInfo) => {
    try {
      setModalLoading(true);

      const principal = await authService.getPrincipal();

      if (!principal) {
        throw new Error('You must be authenticated to create equipment');
      }

      const newUuid = `${uuidv4()}`;

      // Insert base structure
      await insertUUIDStructure(newUuid, baseStructure);

      // Update serial number

      const requests = [
        updateValue(newUuid, 'productInfo.serialNumber', productInfo.serialNumber),
        updateValue(newUuid, 'productInfo.dimensions', productInfo.dimensions),
        updateValue(newUuid, 'productInfo.modelNumber', productInfo.modelNumber),
        updateValue(newUuid, 'productInfo.materialType', productInfo.materialType),
        updateValue(newUuid, 'productInfo.glassType', productInfo.glassType),
        updateValue(newUuid, 'productInfo.energyRating', productInfo.energyRating),
        updateValue(newUuid, 'productInfo.manufacturingDate', productInfo.manufacturingDate),
        updateValue(newUuid, 'productInfo.windowType', productInfo.windowType),
      ];
      await Promise.all(requests);
      // Refresh equipment list
      const allUUIDs = await getAllUUIDsWithInfo();
      setEquipmentList(allUUIDs as unknown as EquipmentProps[]);

      setModalOpen(false);
    } catch (error) {
      console.error('Error creating equipment:', error);
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
          installerName: getValue('INSTALLER_NAME_LABEL'),
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
          onClick={() => setModalOpen(true)}
        >
          New Equipment
        </Button>
      </Box>

      <NewEquipmentModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreateEquipment}
        loading={modalLoading}
        refreshData={fetchEquipment}
      />

      <Card>
        <Scrollbar>
          <EquipmentTable
            equipmentList={equipmentList}
            isLoading={isLoading}
            onViewDetail={(uuid, section) => handleOpenDetail(uuid, section)}
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
