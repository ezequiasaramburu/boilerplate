interface AdminTopBarProps {
  title?: string;
  onMenuClick: () => void;
}

export function AdminTopBar({ title, onMenuClick }: AdminTopBarProps) {
  return (
    <div className="sticky top-0 z-10 flex items-center justify-between h-16 bg-white border-b border-gray-200 px-6">
      <div className="flex items-center">
        <button onClick={onMenuClick} className="lg:hidden text-gray-400 hover:text-gray-600 mr-4">
          ☰
        </button>
        {title && <h2 className="text-2xl font-semibold text-gray-900">{title}</h2>}
      </div>

      <div className="flex items-center space-x-4">
        <div className="text-sm text-gray-600">Admin User</div>
      </div>
    </div>
  );
}
