import React, { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client/react/index.js';
import { GET_LIVE_TRIPS } from '../graphql/queries';

const MapLive = ({ theme }) => {
  const isDark = theme === 'dark-blue';

  // 🌟 GỌI API CHỈ LẤY CÁC CHUYẾN ĐI ĐANG ONGOING
  const { data, loading, error, refetch } = useQuery(GET_LIVE_TRIPS, {
    pollInterval: 5000, // Tự động quét lại database mỗi 5 giây để cập nhật trạng thái kết thúc chuyến
  });

  const [selectedTripId, setSelectedTripId] = useState(null);
  const [dynamicSpeeds, setDynamicSpeeds] = useState({});
  const [dynamicFuels, setDynamicFuels] = useState({});
  const [routeProgress, setRouteProgress] = useState(30);
  const [liveLogs, setLiveLogs] = useState([]);

  const tripsList = data?.getLiveTrips || [];

  // Tự động chọn chuyến đi đầu tiên nếu có xe chạy
  useEffect(() => {
    if (tripsList.length > 0) {
      if (!selectedTripId || !tripsList.some(t => t.trip_id === selectedTripId)) {
        setSelectedTripId(tripsList[0].trip_id);
        setLiveLogs([{ time: new Date().toTimeString().split(' ')[0], info: `🖥️ Đang kết nối vào Trip ID: ${tripsList[0].trip_id}` }]);
      }
    } else {
      setSelectedTripId(null);
    }
  }, [tripsList, selectedTripId]);

  // Vòng lặp bắn Log thời gian thực
  useEffect(() => {
    if (!selectedTripId || tripsList.length === 0) return;

    const interval = setInterval(() => {
      const currentTrip = tripsList.find(t => t.trip_id === selectedTripId);
      if (!currentTrip) return;

      const baseSpeed = dynamicSpeeds[selectedTripId] || 40;
      const speedDelta = Math.floor(Math.random() * 11) - 5;
      const newSpeed = Math.max(20, Math.min(80, baseSpeed + speedDelta));

      const currentAccFuel = dynamicFuels[selectedTripId] || 0.01;
      const newFuel = parseFloat((currentAccFuel + 0.0015).toFixed(4));

      setDynamicSpeeds(prev => ({ ...prev, [selectedTripId]: newSpeed }));
      setDynamicFuels(prev => ({ ...prev, [selectedTripId]: newFuel }));
      setRouteProgress(prev => (prev >= 100 ? 10 : prev + 4));

      const now = new Date().toTimeString().split(' ')[0];
      const randomLat = (10.775 + Math.random() * 0.005).toFixed(4);
      const randomLng = (106.700 + Math.random() * 0.005).toFixed(4);

      setLiveLogs(prev => [{
        time: now,
        info: `🛰️ [TRIP:${currentTrip.trip_id} | ${currentTrip.vehicle_name}] Tọa độ: (${randomLat}, ${randomLng}) | Tốc độ: ${newSpeed} km/h | Tiêu thụ: ${newFuel} L`
      }, ...prev.slice(0, 8)]);
    }, 3000);

    return () => clearInterval(interval);
  }, [selectedTripId, tripsList, dynamicSpeeds, dynamicFuels]);

  if (loading) return <div className="p-8 text-center text-slate-400">Đang dò tìm tín hiệu GPS...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Lỗi: {error.message}</div>;

  const cardBg = isDark ? 'bg-[#111827] border-slate-800' : 'bg-white border-amber-200 shadow-sm';
  const textTitle = isDark ? 'text-cyan-400' : 'text-amber-600';

  return (
    <div className="p-8 transition-colors duration-300">
      <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
        Trung Tâm Giám Sát Tuyến Đường Live
      </h1>
      <p className="text-sm text-slate-400 mb-6">
        Hệ thống tự động lọc và chỉ hiển thị các phương tiện đang thực hiện hành trình ngoài đường.
      </p>

      {tripsList.length === 0 ? (
        // GIAO DIỆN KHI KHÔNG CÓ XE CHẠY (BẠN ĐÃ END TRIP HẾT)
        <div className={`p-12 text-center rounded-xl border border-dashed ${isDark ? 'border-slate-800 bg-[#111827]/40' : 'border-amber-300 bg-amber-50/40'}`}>
          <p className="text-xl font-bold text-slate-400 mb-2">📴 Hiện tại không có phương tiện nào di chuyển</p>
          <p className="text-xs text-slate-500">Toàn bộ đội xe đang đỗ tại bãi an toàn. Sử dụng Sandbox tạo cuộc gọi `startTrip` để kích hoạt lại trạm định vị.</p>
        </div>
      ) : (
        // GIAO DIỆN ĐIỀU HÀNH LIVE KHI CÓ XE CHẠY
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className={`p-5 rounded-xl border flex flex-col gap-4 ${cardBg}`}>
            <h2 className={`text-lg font-bold ${textTitle}`}>🚗 Đội Xe Đang Hoạt Động ({tripsList.length})</h2>
            <div className="space-y-3">
              {tripsList.map(trip => (
                <div 
                  key={trip.trip_id}
                  onClick={() => setSelectedTripId(trip.trip_id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    selectedTripId === trip.trip_id 
                      ? (isDark ? 'border-cyan-500 bg-cyan-950/20' : 'border-amber-400 bg-amber-50')
                      : (isDark ? 'border-slate-800 bg-slate-900/40' : 'border-slate-100 bg-slate-50')
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-sm">{trip.vehicle_name}</span>
                    <span className="px-2 py-0.5 text-[9px] bg-cyan-500/10 text-cyan-400 font-bold rounded border border-cyan-500/20 animate-pulse">MOVING</span>
                  </div>
                  <p className="text-xs text-slate-400">Biển số: <strong>{trip.plate_number}</strong></p>
                  <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-800/20 text-[11px] text-slate-400">
                    <div>⚡ Tốc độ: <span className="font-bold text-orange-400">{dynamicSpeeds[trip.trip_id] || 40} km/h</span></div>
                    <div>⛽ Lít tiêu thụ: <span className="font-bold text-cyan-400">{dynamicFuels[trip.trip_id] || 0.01} L</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className={`p-5 rounded-xl border flex flex-col justify-between h-[230px] relative overflow-hidden ${cardBg}`}>
              <h2 className={`text-md font-bold uppercase tracking-wider ${textTitle}`}>🗺️ Sơ đồ dòng dữ liệu tuyến đường</h2>
              <div className="w-full bg-slate-800/20 h-4 rounded-full relative mt-4">
                <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full shadow-[0_0_12px_#22d3ee]" style={{ width: `${routeProgress}%` }}></div>
                <div className="absolute top-1/2 -translate-y-1/2 w-6 h-6 bg-white border-2 border-cyan-500 rounded-full flex items-center justify-center text-xs shadow-lg" style={{ left: `calc(${routeProgress}% - 12px)` }}>🏍️</div>
              </div>
              <div className="flex justify-between items-center text-xs mt-4 text-slate-400">
                <span>Điểm xuất phát</span>
                <span className="text-cyan-400 font-bold animate-pulse">Hành trình: {routeProgress}%</span>
                <span>Điểm đích</span>
              </div>
            </div>

            <div className="bg-[#050b14] border border-slate-800 p-4 rounded-xl font-mono text-xs text-cyan-400 h-[220px] flex flex-col shadow-2xl">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2 mb-2 text-slate-500">
                <span>🖥️ LIVE MISSION CONTROL CONSOLE</span>
                <span className="text-emerald-400 flex items-center gap-1.5"><span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span> ONLINE</span>
              </div>
              <div className="overflow-y-auto flex-grow space-y-1 pr-2">
                {liveLogs.map((log, index) => (
                  <div key={index} className="flex gap-2">
                    <span className="text-slate-600">[{log.time}]</span>
                    <span className={index === 0 ? "text-slate-100 font-bold" : "text-cyan-500/80"}>{log.info}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapLive;