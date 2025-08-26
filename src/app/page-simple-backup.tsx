export default function SimplePage() {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-blue-600">سیستم مدیریت پارکینگ هوشمند</h1>
        <p className="text-gray-600 mt-4">این یک نسخه ساده برای تست است.</p>
        
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold">ظرفیت کل</h2>
            <p className="text-2xl font-bold mt-2">۱۰۰</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold">فضای اشغالی</h2>
            <p className="text-2xl font-bold text-orange-500 mt-2">۶۷</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold">درآمد امروز</h2>
            <p className="text-2xl font-bold text-green-600 mt-2">۱,۲۵۰,۰۰۰ تومان</p>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">منوی دسترسی</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <a href="/tariffs" className="bg-blue-500 text-white p-4 rounded-lg text-center hover:bg-blue-600">
              تعرفه‌ها
            </a>
            <a href="/pos" className="bg-green-500 text-white p-4 rounded-lg text-center hover:bg-green-600">
              دستگاه‌های POS
            </a>
            <a href="/shifts" className="bg-purple-500 text-white p-4 rounded-lg text-center hover:bg-purple-600">
              شیفت‌ها
            </a>
            <a href="/users" className="bg-red-500 text-white p-4 rounded-lg text-center hover:bg-red-600">
              کاربران
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}