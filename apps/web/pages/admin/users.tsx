import { AdminLayout } from '../../src/components/admin/AdminLayout';
import { UsersManagement } from '../../src/components/admin/UsersManagement';

export default function AdminUsers() {
  return (
    <AdminLayout title="Users Management">
      <UsersManagement />
    </AdminLayout>
  );
}
