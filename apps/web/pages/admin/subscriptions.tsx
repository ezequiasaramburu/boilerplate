import { AdminLayout } from '../../src/components/admin/AdminLayout';
import { SubscriptionOverview } from '../../src/components/admin/SubscriptionOverview';

export default function AdminSubscriptions() {
  return (
    <AdminLayout title="Subscription Management">
      <SubscriptionOverview />
    </AdminLayout>
  );
}
