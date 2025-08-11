import { ReactNode, useState } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { AdminTopBar } from './AdminTopBar';
import { AdminOverlay } from './AdminOverlay';

interface AdminLayoutProps {
  children: ReactNode;
  title?: string;
}

const adminNavItems = [
  { href: '/admin', label: 'Dashboard', icon: '📊' },
  { href: '/admin/users', label: 'Users', icon: '👥' },
  { href: '/admin/subscriptions', label: 'Subscriptions', icon: '💳' },
  { href: '/admin/analytics', label: 'Analytics', icon: '📈' },
  { href: '/admin/system', label: 'System Health', icon: '⚙️' },
];

export function AdminLayout({ children, title }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-screen flex bg-gray-50">
      <AdminOverlay isVisible={sidebarOpen} onClick={() => setSidebarOpen(false)} />

      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        navItems={adminNavItems}
      />

      <div className="flex-1 flex flex-col min-h-0 lg:ml-0">
        <AdminTopBar title={title} onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
