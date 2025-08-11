import Link from 'next/link';
import { useRouter } from 'next/router';

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  navItems: NavItem[];
}

export function AdminSidebar({ isOpen, onClose, navItems }: AdminSidebarProps) {
  const router = useRouter();

  return (
    <div
      className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
        <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-gray-600">
          ✕
        </button>
      </div>

      <nav className="mt-6">
        {navItems.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center px-6 py-3 text-sm font-medium transition-colors duration-200 ${
              router.pathname === item.href
                ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <span className="mr-3 text-lg">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-200">
        <Link href="/" className="flex items-center text-sm text-gray-600 hover:text-gray-900">
          ← Back to App
        </Link>
      </div>
    </div>
  );
}
