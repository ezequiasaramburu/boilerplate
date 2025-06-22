export function Footer() {
  return (
    <footer className="bg-gray-50 border-t">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            © {new Date().getFullYear()} Enterprise App. All rights reserved.
          </div>

          <div className="flex space-x-6">
            <a
              href="/privacy"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Privacy Policy
            </a>
            <a
              href="/terms"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
