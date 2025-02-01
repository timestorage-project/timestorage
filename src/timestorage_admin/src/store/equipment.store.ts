import { create } from 'zustand';
import { EquipmentProps } from 'src/sections/equipment/equipment-table-row';

interface EquipmentStore {
  equipmentList: EquipmentProps[];
  setEquipmentList: (list: EquipmentProps[]) => void;
  getEmptySerialEquipment: () => EquipmentProps[];
  getNonEmptySerialEquipment: () => EquipmentProps[];
}

export const useEquipmentStore = create<EquipmentStore>((set, get) => ({
  equipmentList: [],
  setEquipmentList: (list) => set({ equipmentList: list }),
  getEmptySerialEquipment: () =>
    get().equipmentList.filter((equipment) => !equipment.serialNo || equipment.serialNo === '-'),
  getNonEmptySerialEquipment: () =>
    get().equipmentList.filter((equipment) => equipment.serialNo && equipment.serialNo !== '-'),
}));
