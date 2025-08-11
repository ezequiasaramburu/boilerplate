import { AdminLayout } from '../../src/components/admin/AdminLayout';
import { SystemHealth } from '../../src/components/admin/SystemHealth';

export default function AdminSystem() {
  return (
    <AdminLayout title="System Health">
      <SystemHealth />
    </AdminLayout>
  );
}
