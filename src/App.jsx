import React, { useState } from 'react';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import MapLive from './pages/MapLive';
import Users from './pages/Users';
import Vehicles from './pages/Vehicles';
import FuelConsumption from './pages/FuelConsumption';

function App() {
  const hasToken = !!localStorage.getItem('admin_token');
  const adminName = localStorage.getItem('admin_name') || 'Quản trị viên';
  
  const [activeTab, setActiveTab] = useState('overview');
  
  // 🌟 GIAO DIỆN CHỦ ĐẠO: 'dark-blue' (Đen Xanh) hoặc 'white-yellow' (Trắng Vàng)
  const [theme, setTheme] = useState('dark-blue');

  // 🌟 KHU VỰC DÁN LINK ẢNH LOGO TỪ MẠNG (Bạn hãy thay các link dưới bằng ảnh của bạn)
  const FOOTER_LOGOS = {
    overview: "https://cdn-icons-png.flaticon.com/512/1828/1828884.png",          // Ảnh Tổng Quan
    users: "https://cdn-icons-png.flaticon.com/512/681/681494.png",               // Ảnh Người Dùng
    vehicles: "https://cdn-icons-png.flaticon.com/512/743/743131.png",            // Ảnh Phương Tiện
    map_routes: "https://cdn-icons-png.flaticon.com/512/854/854878.png",          // Ảnh Bản Đồ
    fuel_consumption: "https://cdn-icons-png.flaticon.com/512/483/483632.png",    // Ảnh Lít Xăng
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.reload();
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark-blue' ? 'white-yellow' : 'dark-blue');
  };

  if (!hasToken) {
    return <Login />;
  }

  // Định nghĩa màu sắc động theo Theme cho khung nền ngoài
  const isDark = theme === 'dark-blue';
  const pageBgClass = isDark ? 'bg-[#0a0f1d] text-slate-100' : 'bg-[#fdfbf7] text-slate-800';
  const headerBgClass = isDark ? 'bg-[#111827] border-slate-800' : 'bg-white border-amber-200';
  const cardBgClass = isDark ? 'bg-[#111827] border-slate-800 text-slate-300' : 'bg-white border-amber-200 text-slate-600';
  const footerBgClass = isDark ? 'bg-[#111827]/90 border-slate-800' : 'bg-white/90 border-amber-200';

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <Dashboard theme={theme} />; // Truyền theme xuống Dashboard con
        
      case 'users':
        // Đã đấu nối trang thật, truyền theme xuống để đổi màu
        return <Users theme={theme} />;
        
      case 'vehicles':
          // Đã kích hoạt trang quản lý danh mục xe thật
        return <Vehicles theme={theme} />;
        
      case 'map_routes':
        return <MapLive theme={theme} />;
        
      case 'fuel_consumption':
        // Đã kích hoạt khung biểu đồ Recharts tự động cập nhật số liệu
        return <FuelConsumption theme={theme} />;
        
      default:
        return <Dashboard theme={theme} />;
    }
  };

  return (
    <div className={`App font-sans min-h-screen pb-24 transition-colors duration-300 ${pageBgClass}`}>
      
      {/* TOPBAR ĐỘNG THEO THEME */}
      <header className={`border-b px-8 py-4 flex justify-between items-center shadow-md transition-colors duration-300 ${headerBgClass}`}>
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full animate-pulse ${isDark ? 'bg-cyan-400' : 'bg-amber-500'}`}></div>
          <span className="font-bold tracking-wide uppercase text-sm">Smart Fuel Console</span>
        </div>
        
        <div className="flex items-center gap-6">
          {/* 🌟 NÚT SWITCH ĐỔI THEME CAO CẤP */}
          <div className="flex items-center gap-2 bg-slate-800/10 dark:bg-slate-100/10 p-1 rounded-full border border-slate-300/30">
            <span className="text-xs font-bold px-2 text-slate-400">Trắng Vàng</span>
            <button
              onClick={toggleTheme}
              className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 focus:outline-none ${isDark ? 'bg-cyan-500' : 'bg-amber-500'}`}
            >
              <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${isDark ? 'translate-x-6' : 'translate-x-0'}`}></div>
            </button>
            <span className="text-xs font-bold px-2 text-slate-400">Đen Xanh</span>
          </div>

          <span className="text-sm font-medium">Xin chào, <strong className={isDark ? 'text-cyan-400' : 'text-amber-600'}>{adminName}</strong></span>
          <button 
            onClick={handleLogout}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg border transition-colors ${isDark ? 'bg-red-950/40 hover:bg-red-900/60 text-red-400 border-red-900/50' : 'bg-red-50 hover:bg-red-100 text-red-600 border-red-200'}`}
          >
            Đăng Xuất
          </button>
        </div>
      </header>

      {/* VÙNG NỘI DUNG CHÍNH */}
      <main>{renderContent()}</main>

      {/* 🌟 FOOTER CHỨA LOGO ẢNH NHỎ THAY CHO EMOJI */}
      <footer className={`fixed bottom-0 left-0 right-0 backdrop-blur-md border-t py-2 px-6 shadow-2xl flex justify-around items-center z-50 transition-colors duration-300 ${footerBgClass}`}>
        
        {/* Mục 1: Tổng Quan */}
        <button 
          onClick={() => setActiveTab('overview')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'overview' ? (isDark ? 'text-cyan-400 scale-105 font-bold' : 'text-amber-600 scale-105 font-bold') : 'text-slate-400 hover:text-slate-500'}`}
        >
          <img src={FOOTER_LOGOS.overview} alt="Overview" className="w-5 h-5 object-contain" />
          <span className="text-[11px]">Tổng Quan</span>
        </button>

        {/* Mục 2: Tài Khoản */}
        <button 
          onClick={() => setActiveTab('users')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'users' ? (isDark ? 'text-blue-400 scale-105 font-bold' : 'text-yellow-600 scale-105 font-bold') : 'text-slate-400 hover:text-slate-500'}`}
        >
          <img src={FOOTER_LOGOS.users} alt="Users" className="w-5 h-5 object-contain" />
          <span className="text-[11px]">Tài Khoản Người Dùng</span>
        </button>

        {/* Mục 3: Phương Tiện */}
        <button 
          onClick={() => setActiveTab('vehicles')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'vehicles' ? (isDark ? 'text-emerald-400 scale-105 font-bold' : 'text-emerald-600 scale-105 font-bold') : 'text-slate-400 hover:text-slate-500'}`}
        >
          <img src={FOOTER_LOGOS.vehicles} alt="Vehicles" className="w-5 h-5 object-contain" />
          <span className="text-[11px]">Phương Tiện</span>
        </button>

        {/* Mục 4: Đoạn Đường Bản Đồ */}
        <button 
          onClick={() => setActiveTab('map_routes')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'map_routes' ? (isDark ? 'text-purple-400 scale-105 font-bold' : 'text-amber-700 scale-105 font-bold') : 'text-slate-400 hover:text-slate-500'}`}
        >
          <img src={FOOTER_LOGOS.map_routes} alt="Map Routes" className="w-5 h-5 object-contain" />
          <span className="text-[11px]">Phương Tiện Trên Bản Đồ</span>
        </button>

        {/* Mục 5: Lít Xăng Tiêu Thụ */}
        <button 
          onClick={() => setActiveTab('fuel_consumption')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'fuel_consumption' ? (isDark ? 'text-orange-400 scale-105 font-bold' : 'text-orange-600 scale-105 font-bold') : 'text-slate-400 hover:text-slate-500'}`}
        >
          <img src={FOOTER_LOGOS.fuel_consumption} alt="Fuel" className="w-5 h-5 object-contain" />
          <span className="text-[11px]">Lít Xăng Mỗi Xe</span>
        </button>

      </footer>
    </div>
  );
}

export default App;