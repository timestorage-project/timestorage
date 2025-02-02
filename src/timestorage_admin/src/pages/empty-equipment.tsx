import { Helmet } from 'react-helmet-async';
import { CONFIG } from 'src/config-global';
import { EmptyEquipmentView } from 'src/sections/equipment/empty-equipment-view';

// ----------------------------------------------------------------------

export default function EmptyEquipmentPage() {
  return (
    <>
      <Helmet>
        <title>{`Empty Equipment - ${CONFIG.appName}`}</title>
      </Helmet>

      <EmptyEquipmentView />
    </>
  );
}
