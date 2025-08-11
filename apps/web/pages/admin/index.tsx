import { AdminLayout } from '../../src/components/admin/AdminLayout';
import { SubscriptionOverview } from '../../src/components/admin/SubscriptionOverview';

export default function AdminDashboard() {
  return (
    <AdminLayout title="Dashboard">
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Admin Dashboard</h2>
          <p className="text-gray-600">
            Welcome to the admin panel. Monitor users, subscriptions, and system health from here.
          </p>
        </div>

        <SubscriptionOverview />
      </div>
    </AdminLayout>
  );
}
