import { Helmet } from 'react-helmet-async';
import { CONFIG } from 'src/config-global';
import { EquipmentView } from 'src/sections/equipment/equipment-view';

// ----------------------------------------------------------------------

export default function EquipmentPage() {
  return (
    <>
      <Helmet>
        <title>{`Equipment - ${CONFIG.appName}`}</title>
      </Helmet>

      <EquipmentView />
    </>
  );
}
