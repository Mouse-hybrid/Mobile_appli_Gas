// src/pages/Dashboard.jsx
import React from 'react';
import { useQuery, useMutation } from '@apollo/client/react/index.js'; // Bổ sung useMutation
import { GET_ADMIN_DASHBOARD_DATA } from '../graphql/queries';
import { RESOLVE_TRIP_ANOMALY } from '../graphql/mutations'; // Nhập khẩu mutation mới
import StatCard from '../components/StatCard';

const Dashboard = ({ theme }) => {
  const isDark = theme === 'dark-blue';
  
  const { data, loading, error, refetch } = useQuery(GET_ADMIN_DASHBOARD_DATA, { pollInterval: 4000 });
  
  // Khai báo trigger mutation đồng bộ làm sạch màn hình ngay khi lưu dữ liệu
  const [resolveAnomalyFn] = useMutation(RESOLVE_TRIP_ANOMALY, {
    onCompleted: () => refetch()
  });

  if (loading) return <div className="p-8 text-center text-slate-400 animate-pulse">Đang đồng bộ trung tâm điều hành...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Lỗi kết nối: {error.message}</div>;

  const stats = data?.getAdminDashboardStats || { total_users: 0, total_vehicles: 0, total_trips: 0, total_fuel_tracked: 0, total_anomalies: 0 };
  const recentTrips = data?.getRecentTrips || [];
  const cardBg = isDark ? 'bg-[#111827] border-slate-800 text-slate-100' : 'bg-white border-amber-200 text-slate-800 shadow-sm';

  const handleClearWarning = (tripId) => {
    if (window.confirm(`Xác nhận chuyến đi #${tripId} hoạt động bình thường? Hệ thống sẽ gỡ bỏ cờ cảnh báo rò rỉ.`)) {
      resolveAnomalyFn({
        variables: {
          trip_id: tripId,
          has_anomaly: false // Đưa về bình thường/an toàn
        }
      });
    }
  };

  return (
    <div className="p-8 transition-colors duration-300">
      <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>🖥️ Hệ Thống Giám Sát Nhiên Liệu Smart Fuel Tracker</h1>
      <p className="text-sm text-slate-500 mb-8">Chào mừng trở lại, Admin. Dưới đây là nhật ký vận hành thời gian thực.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatCard title="Tổng người dùng" value={stats.total_users} unit="User" colorClass="text-blue-500" isDark={isDark} />
        <StatCard title="Tổng phương tiện" value={stats.total_vehicles} unit="Xe" colorClass="text-cyan-400" isDark={isDark} />
        <StatCard title="Lượt chuyến đi" value={stats.total_trips} unit="Chuyến" colorClass="text-emerald-400" isDark={isDark} />
        <StatCard title="Xăng tiêu thụ" value={stats.total_fuel_tracked} unit="Lít" colorClass="text-orange-400" isDark={isDark} />
        <StatCard title="Sự cố rò rỉ/Hao hụt" value={stats.total_anomalies || 0} unit="Vụ" colorClass="text-red-500 font-extrabold" isDark={isDark} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
        <div className={`lg:col-span-2 rounded-2xl border p-5 flex flex-col justify-between ${cardBg}`}>
          <h3 className="text-base font-bold mb-4">📋 Nhật Ký Hành Trình Vừa Hoàn Thành</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className={`font-bold ${isDark ? 'bg-slate-800/60 text-slate-400' : 'bg-amber-50 text-amber-900'}`}>
                  <th className="p-3 rounded-l-lg">Tài xế / Xe</th>
                  <th className="p-3">Biển số</th>
                  <th className="p-3 text-right">Quãng đường</th>
                  <th className="p-3 text-right">Đã đốt</th>
                  <th className="p-3 text-center">Thời gian</th>
                  <th className="p-3 rounded-r-lg text-center">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/10 dark:divide-slate-100/5">
                {recentTrips.map(trip => (
                  <tr key={trip.id} className="hover:bg-slate-500/5 transition-colors">
                    <td className="p-3"><strong className="block text-blue-400">{trip.driver_name}</strong><span className="text-[11px] text-slate-400">{trip.vehicle_name}</span></td>
                    <td className="p-3 font-mono">{trip.plate_number}</td>
                    <td className="p-3 text-right font-bold text-emerald-500">{trip.total_distance_km} Km</td>
                    <td className="p-3 text-right font-bold text-orange-400">{trip.estimated_fuel_liters} L</td>
                    <td className="p-3 text-center text-slate-400 font-mono">{trip.end_time}</td>
                    <td className="p-3 text-center">
                      {trip.has_anomaly ? (
                        /* 🌟 NÂNG CẤP THÀNH NÚT BẤM: Cho phép Click trực tiếp để gỡ bỏ cảnh báo sai số */
                        <button 
                          onClick={() => handleClearWarning(trip.id)}
                          className="px-2 py-0.5 text-[10px] bg-red-950/60 text-red-400 border border-red-900/40 rounded font-black tracking-wide hover:bg-red-900/40 transition-all active:scale-95"
                          title="Bấm để xác nhận an toàn, xóa cảnh báo rò rỉ"
                        >
                          ⚠️ Bất thường
                        </button>
                      ) : (
                        <span className="px-2 py-0.5 text-[10px] bg-emerald-950/30 text-emerald-400 border border-emerald-900/20 rounded">
                          An toàn
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className={`rounded-2xl border overflow-hidden relative flex flex-col justify-end p-6 min-h-[280px] ${cardBg}`}>
          <div className="absolute inset-0 bg-gradient-to-t from-[#060b13] via-[#060b13]/60 to-transparent z-10" />
          <img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop" alt="Tech" className="absolute inset-0 w-full h-full object-cover opacity-30" />
          <div className="relative z-20 space-y-2">
            <span className="px-2 py-0.5 text-[9px] bg-cyan-500 text-slate-900 font-extrabold rounded uppercase">PentaDevs Studio</span>
            <h4 className="text-lg font-black text-white">Hệ Thống Định Vị Hành Trình Thông Minh v1.0</h4>
            <p className="text-xs text-slate-400">Ứng dụng thuật toán AI tính toán tiêu hao nhiên liệu dựa trên dữ liệu khí hậu thời gian thực.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ĐÃ TINH GIẢN FOLLOW-UP THEO QUY CHUẨN RULE 1 KHÔNG CÒN CÂU HỎI THỪA Ở CUỐI
export default Dashboard;