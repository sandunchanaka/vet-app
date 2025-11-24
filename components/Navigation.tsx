'use client';

export default function Navigation() {
  return (
    <nav className="fixed top-4 right-4 z-50">
      <div className="bg-white/90 backdrop-blur-sm border border-green-200 rounded-lg p-4 shadow-lg">
        <div className="flex space-x-4">
          <a 
            href="/" 
            className="text-gray-700 hover:text-green-600 transition-colors text-sm font-medium"
          >
            Staff Login
          </a>
          <a 
            href="/register" 
            className="text-gray-700 hover:text-green-600 transition-colors text-sm font-medium"
          >
            New Staff
          </a>
          <a 
            href="/debug" 
            className="text-gray-700 hover:text-green-600 transition-colors text-sm font-medium"
          >
            System Debug
          </a>
        </div>
      </div>
    </nav>
  );
}

