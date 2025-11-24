export default function DebugPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="text-white text-center">
        <h1 className="text-4xl font-bold mb-4">Debug Page</h1>
        <p className="text-xl mb-4">This page is working! 🎉</p>
        <div className="space-y-2">
          <a href="/" className="block text-blue-400 hover:text-blue-300">Go to Login</a>
          <a href="/register" className="block text-blue-400 hover:text-blue-300">Go to Register</a>
          <a href="/dashboard" className="block text-blue-400 hover:text-blue-300">Go to Dashboard</a>
        </div>
      </div>
    </div>
  );
}

