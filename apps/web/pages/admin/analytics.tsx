import { AdminLayout } from '../../src/components/admin/AdminLayout';

export default function AdminAnalytics() {
  return (
    <AdminLayout title="Analytics Dashboard">
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Analytics Dashboard</h2>
          <p className="text-gray-600 mb-4">
            Comprehensive analytics and reporting for your SaaS business.
          </p>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">$24,680</div>
              <div className="text-sm text-gray-600">Monthly Recurring Revenue</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">1,247</div>
              <div className="text-sm text-gray-600">Active Customers</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">4.2%</div>
              <div className="text-sm text-gray-600">Churn Rate</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">$198</div>
              <div className="text-sm text-gray-600">Average Revenue Per User</div>
            </div>
          </div>

          <div className="text-sm text-gray-500">
            💡 <strong>Integration Note:</strong> Connect this to your analytics API endpoints:
            <ul className="mt-2 ml-4 space-y-1">
              <li>• GET /api/v1/analytics/dashboard</li>
              <li>• GET /api/v1/analytics/revenue/mrr</li>
              <li>• GET /api/v1/analytics/customers/churn</li>
              <li>• GET /api/v1/analytics/timeseries</li>
            </ul>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
