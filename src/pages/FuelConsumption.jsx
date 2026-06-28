import React, { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client/react/index.js';
import { GET_VEHICLE_FUEL_REPORT } from '../graphql/queries';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import StatCard from '../components/StatCard';
import ChartBox from '../components/ChartBox';

const FuelConsumption = ({ theme }) => {
  const isDark = theme === 'dark-blue';
  const { data, loading, error } = useQuery(GET_VEHICLE_FUEL_REPORT, { pollInterval: 5000 });
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);

  const reportData = data?.getVehicleFuelReport || [];
  useEffect(() => {
    if (reportData.length > 0 && !selectedVehicleId) setSelectedVehicleId(reportData[0].vehicle_id);
  }, [reportData, selectedVehicleId]);

  if (loading) return <div className="p-8 text-center text-slate-400">Đang tổng hợp số liệu tiêu thụ...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Lỗi kết nối API: {error.message}</div>;

  const activeVehicle = reportData.find(v => v.vehicle_id === selectedVehicleId);
  const miniChartData = activeVehicle ? [
    { name: 'Quãng đường (Km)', value: activeVehicle.total_distance_km, unit: 'Km' },
    { name: 'Nhiên liệu (Lít)', value: activeVehicle.total_fuel_consumed, unit: 'L' }
  ] : [];

  const cardBg = isDark ? 'bg-[#111827] border-slate-800 text-slate-100' : 'bg-white border-amber-200 text-slate-800 shadow-md';

  return (
    <div className="p-8 transition-colors duration-300">
      <h1 className="text-3xl font-bold mb-2"> Thống Kê Tiêu Thụ Nhiên Liệu</h1>
      <p className="text-sm text-slate-500 mb-8">Chọn phương tiện để kiểm tra chi tiết chủ tài khoản, quãng đường và lượng xăng hao hụt.</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className={`rounded-xl border overflow-hidden ${cardBg}`}>
          <div className={`p-4 font-bold text-xs uppercase ${isDark ? 'bg-[#1f2937] text-slate-300' : 'bg-amber-100 text-amber-900'}`}>Danh Sách Xe Hệ Thống ({reportData.length})</div>
          <div className="divide-y divide-slate-800/40 max-h-[450px] overflow-y-auto">
            {reportData.map(item => (
              <div key={item.vehicle_id} onClick={() => setSelectedVehicleId(item.vehicle_id)} className={`p-4 cursor-pointer flex justify-between items-center ${selectedVehicleId === item.vehicle_id ? (isDark ? 'bg-cyan-950/30 border-l-4 border-cyan-400' : 'bg-amber-50 border-l-4 border-amber-500') : (isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50')}`}>
                <div><h4 className="font-bold text-sm">{item.vehicle_name}</h4><p className="text-xs font-mono text-slate-500">{item.plate_number}</p></div>
                <span className="text-xs font-mono font-bold bg-slate-500/10 px-2 py-0.5 rounded">ID: {item.vehicle_id}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {activeVehicle && (
            <div className={`p-6 rounded-xl border ${cardBg}`}>
              <div className="border-b border-slate-800/20 dark:border-slate-100/10 pb-4 mb-6 flex justify-between items-end">
                <h2 className="text-2xl font-extrabold">{activeVehicle.vehicle_name}</h2>
                <span className="text-xl font-mono font-bold text-slate-400 tracking-wider bg-slate-500/5 px-3 py-1 rounded-lg border">{activeVehicle.plate_number}</span>
              </div>

              {/* SỬ DỤNG LẠI STATCARD CON CHO TRANG TIÊU THỤ */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <StatCard title="Chủ Tài Khoản" value={activeVehicle.owner_name} unit="" colorClass="text-blue-500" isDark={isDark} />
                <StatCard title="Quãng Đường" value={activeVehicle.total_distance_km} unit="Km" colorClass="text-emerald-500" isDark={isDark} />
                <StatCard title="Xăng Tiêu Thụ" value={activeVehicle.total_fuel_consumed} unit="Lít" colorClass="text-orange-500" isDark={isDark} />
              </div>

              {/* DÙNG CHARTBOX ĐỂ BỌC BIỂU ĐỒ */}
              <ChartBox title="Tương quan Quãng đường & Xăng tiêu thụ" icon="📊" isDark={isDark}>
                <div className="w-full h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={miniChartData} layout="vertical" margin={{ top: 5, right: 30, left: 45, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1f2937' : '#f3f4f6'} />
                      <XAxis type="number" stroke="#94a3b8" />
                      <YAxis dataKey="name" type="category" stroke="#94a3b8" style={{ fontSize: '11px', fontWeight: 'bold' }} />
                      <Tooltip contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#fff', borderRadius: '10px' }} formatter={(value, name, props) => [`${value} ${props.payload.unit}`, 'Giá trị thực tế']} />
                      <Bar dataKey="value" fill={isDark ? '#22d3ee' : '#d97706'} radius={[0, 4, 4, 0]} barSize={25} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </ChartBox>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FuelConsumption;