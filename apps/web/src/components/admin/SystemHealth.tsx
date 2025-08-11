import { useState, useEffect } from 'react';

interface SystemMetrics {
  uptime: number;
  apiResponseTime: number;
  errorRate: number;
  activeUsers: number;
  databaseConnections: number;
  memoryUsage: number;
  cpuUsage: number;
}

interface ServiceStatus {
  name: string;
  status: 'healthy' | 'warning' | 'error';
  responseTime: number;
  lastChecked: string;
}

export function SystemHealth() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSystemHealth();
    const interval = setInterval(fetchSystemHealth, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchSystemHealth = async () => {
    try {
      // Mock data - replace with actual API calls to /api/v1/analytics/realtime and health endpoints
      setMetrics({
        uptime: 99.94,
        apiResponseTime: 142,
        errorRate: 0.02,
        activeUsers: 1247,
        databaseConnections: 12,
        memoryUsage: 68,
        cpuUsage: 23,
      });

      setServices([
        {
          name: 'API Server',
          status: 'healthy',
          responseTime: 145,
          lastChecked: new Date().toISOString(),
        },
        {
          name: 'Database',
          status: 'healthy',
          responseTime: 8,
          lastChecked: new Date().toISOString(),
        },
        {
          name: 'Redis Cache',
          status: 'healthy',
          responseTime: 2,
          lastChecked: new Date().toISOString(),
        },
        {
          name: 'Stripe API',
          status: 'warning',
          responseTime: 890,
          lastChecked: new Date().toISOString(),
        },
        {
          name: 'Email Service',
          status: 'healthy',
          responseTime: 234,
          lastChecked: new Date().toISOString(),
        },
      ]);
    } catch (error) {
      console.error('Failed to fetch system health:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      default:
        return '❓';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getMetricColor = (value: number, type: 'uptime' | 'response' | 'error' | 'usage') => {
    switch (type) {
      case 'uptime':
        return value >= 99.5 ? 'text-green-600' : value >= 99 ? 'text-yellow-600' : 'text-red-600';
      case 'response':
        return value <= 200 ? 'text-green-600' : value <= 500 ? 'text-yellow-600' : 'text-red-600';
      case 'error':
        return value <= 0.1 ? 'text-green-600' : value <= 1 ? 'text-yellow-600' : 'text-red-600';
      case 'usage':
        return value <= 70 ? 'text-green-600' : value <= 85 ? 'text-yellow-600' : 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading system health...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* System Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className={`text-2xl font-bold ${getMetricColor(metrics?.uptime || 0, 'uptime')}`}>
            {metrics?.uptime.toFixed(2)}%
          </div>
          <div className="text-sm text-gray-600">Uptime</div>
          <div className="text-xs text-gray-500 mt-1">Last 30 days</div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div
            className={`text-2xl font-bold ${getMetricColor(
              metrics?.apiResponseTime || 0,
              'response',
            )}`}
          >
            {metrics?.apiResponseTime}ms
          </div>
          <div className="text-sm text-gray-600">Avg Response Time</div>
          <div className="text-xs text-gray-500 mt-1">Last hour</div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className={`text-2xl font-bold ${getMetricColor(metrics?.errorRate || 0, 'error')}`}>
            {metrics?.errorRate.toFixed(2)}%
          </div>
          <div className="text-sm text-gray-600">Error Rate</div>
          <div className="text-xs text-gray-500 mt-1">Last hour</div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-2xl font-bold text-blue-600">
            {metrics?.activeUsers.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600">Active Users</div>
          <div className="text-xs text-gray-500 mt-1">Right now</div>
        </div>
      </div>

      {/* Resource Usage */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Memory Usage</span>
            <span
              className={`text-sm font-bold ${getMetricColor(metrics?.memoryUsage || 0, 'usage')}`}
            >
              {metrics?.memoryUsage}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${
                metrics && metrics.memoryUsage <= 70
                  ? 'bg-green-500'
                  : metrics && metrics.memoryUsage <= 85
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
              }`}
              style={{ width: `${metrics?.memoryUsage}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">CPU Usage</span>
            <span
              className={`text-sm font-bold ${getMetricColor(metrics?.cpuUsage || 0, 'usage')}`}
            >
              {metrics?.cpuUsage}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${
                metrics && metrics.cpuUsage <= 70
                  ? 'bg-green-500'
                  : metrics && metrics.cpuUsage <= 85
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
              }`}
              style={{ width: `${metrics?.cpuUsage}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">DB Connections</span>
            <span className="text-sm font-bold text-blue-600">
              {metrics?.databaseConnections}/50
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="h-2 rounded-full bg-blue-500"
              style={{ width: `${((metrics?.databaseConnections || 0) / 50) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Service Status */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Service Status</h3>
        </div>

        <div className="divide-y divide-gray-200">
          {services.map(service => (
            <div key={service.name} className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-lg mr-3">{getStatusIcon(service.status)}</span>
                <div>
                  <div className="text-sm font-medium text-gray-900">{service.name}</div>
                  <div className="text-xs text-gray-500">
                    Last checked: {new Date(service.lastChecked).toLocaleTimeString()}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className={`text-sm font-medium ${getStatusColor(service.status)}`}>
                    {service.status.toUpperCase()}
                  </div>
                  <div className="text-xs text-gray-500">{service.responseTime}ms</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
            Restart Services
          </button>
          <button className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors">
            Clear Cache
          </button>
          <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">
            Run Health Check
          </button>
          <button className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors">
            View Logs
          </button>
        </div>
      </div>
    </div>
  );
}
