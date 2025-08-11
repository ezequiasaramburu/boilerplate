interface AdminOverlayProps {
  isVisible: boolean;
  onClick: () => void;
}

export function AdminOverlay({ isVisible, onClick }: AdminOverlayProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-40 lg:hidden" onClick={onClick}>
      <div className="absolute inset-0 bg-gray-600 opacity-75"></div>
    </div>
  );
}
