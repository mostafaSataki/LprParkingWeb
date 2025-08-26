export default function TestPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-blue-600">Test Page</h1>
        <p className="text-gray-600 mt-4">This is a simple test page to check if the application loads properly.</p>
        <div className="mt-8 p-4 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold">Components Test</h2>
          <p className="mt-2">If you can see this page, the basic routing is working.</p>
        </div>
      </div>
    </div>
  );
}