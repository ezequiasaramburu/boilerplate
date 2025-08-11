import { useState, useEffect } from 'react';

interface SubscriptionStats {
  total: number;
  active: number;
  canceled: number;
  trialing: number;
  pastDue: number;
  totalMRR: number;
  totalARR: number;
}

interface Subscription {
  id: string;
  user: { email: string; name?: string };
  plan: { name: string; amount: number };
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  createdAt: string;
}

export function SubscriptionOverview() {
  const [stats, setStats] = useState<SubscriptionStats | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Mock data - replace with actual API calls
      setStats({
        total: 248,
        active: 195,
        canceled: 32,
        trialing: 15,
        pastDue: 6,
        totalMRR: 24680,
        totalARR: 296160,
      });

      setSubscriptions([
        {
          id: 'sub_1',
          user: { email: 'user1@example.com', name: 'John Doe' },
          plan: { name: 'Pro Plan', amount: 2900 },
          status: 'ACTIVE',
          currentPeriodStart: '2024-01-01T00:00:00Z',
          currentPeriodEnd: '2024-02-01T00:00:00Z',
          createdAt: '2024-01-01T00:00:00Z',
        },
        {
          id: 'sub_2',
          user: { email: 'user2@example.com', name: 'Jane Smith' },
          plan: { name: 'Enterprise', amount: 9900 },
          status: 'ACTIVE',
          currentPeriodStart: '2024-01-15T00:00:00Z',
          currentPeriodEnd: '2024-02-15T00:00:00Z',
          createdAt: '2024-01-15T00:00:00Z',
        },
      ]);
    } catch (error) {
      console.error('Failed to fetch subscription data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'CANCELED':
        return 'bg-red-100 text-red-800';
      case 'TRIALING':
        return 'bg-blue-100 text-blue-800';
      case 'PAST_DUE':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading subscriptions...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Revenue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-3xl font-bold text-green-600">
            ${stats?.totalMRR.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600">Monthly Recurring Revenue</div>
          <div className="text-xs text-gray-500 mt-1">+12.5% from last month</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-3xl font-bold text-blue-600">
            ${stats?.totalARR.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600">Annual Recurring Revenue</div>
          <div className="text-xs text-gray-500 mt-1">+15.8% from last year</div>
        </div>
      </div>

      {/* Subscription Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <div className="text-2xl font-bold text-gray-900">{stats?.total}</div>
          <div className="text-sm text-gray-600">Total</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <div className="text-2xl font-bold text-green-600">{stats?.active}</div>
          <div className="text-sm text-gray-600">Active</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <div className="text-2xl font-bold text-blue-600">{stats?.trialing}</div>
          <div className="text-sm text-gray-600">Trialing</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <div className="text-2xl font-bold text-yellow-600">{stats?.pastDue}</div>
          <div className="text-sm text-gray-600">Past Due</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <div className="text-2xl font-bold text-red-600">{stats?.canceled}</div>
          <div className="text-sm text-gray-600">Canceled</div>
        </div>
      </div>

      {/* Recent Subscriptions */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Subscriptions</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Period
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {subscriptions.map(subscription => (
                <tr key={subscription.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {subscription.user.name || 'No name'}
                      </div>
                      <div className="text-sm text-gray-500">{subscription.user.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {subscription.plan.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                        subscription.status,
                      )}`}
                    >
                      {subscription.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${(subscription.plan.amount / 100).toFixed(2)}/mo
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(subscription.currentPeriodStart).toLocaleDateString()} -{' '}
                    {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(subscription.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
