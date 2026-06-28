// src/pages/Vehicles.jsx
import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react/index.js';
import { GET_ALL_VEHICLES } from '../graphql/queries';
import { UPDATE_VEHICLE, DELETE_VEHICLE } from '../graphql/mutations';

const Vehicles = ({ theme }) => {
  const isDark = theme === 'dark-blue';
  
  const { data, loading, error, refetch } = useQuery(GET_ALL_VEHICLES);
  const [updateVehicleFn] = useMutation(UPDATE_VEHICLE, { onCompleted: () => { refetch(); setIsOpenModal(false); } });
  const [deleteVehicleFn] = useMutation(DELETE_VEHICLE, { onCompleted: () => refetch() });

  const [isOpenModal, setIsOpenModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);

  if (loading) return <div className="p-8 text-center text-slate-400">Đang tải danh mục phương tiện...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Lỗi kết nối: {error.message}</div>;

  const vehicles = data?.getAllVehicles || [];

  const handleOpenEdit = (v) => {
    setEditingVehicle({
      id: v.id,
      vehicle_name: v.vehicle_name || '',
      plate_number: v.plate_number || '',
      current_odo_km: v.current_odo_km,
      standard_consumption: v.model?.standard_consumption || 2.0,
      fuel_tank_capacity: v.model?.fuel_tank_capacity || 5.0,
      fuel_type: v.model?.fuel_type || 'Xăng',
      image_url: v.image_url || '',
      engine_cc: v.model?.engine_cc || '' // 🌟 MỚI: Bốc dữ liệu phân khối cc hiện tại vào Form
    });
    setIsOpenModal(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    updateVehicleFn({
      variables: {
        ...editingVehicle,
        current_odo_km: parseFloat(editingVehicle.current_odo_km),
        standard_consumption: parseFloat(editingVehicle.standard_consumption),
        fuel_tank_capacity: parseFloat(editingVehicle.fuel_tank_capacity),
        engine_cc: editingVehicle.engine_cc ? parseInt(editingVehicle.engine_cc, 10) : null // 🌟 MỚI: Ép kiểu nguyên Int gửi lên API
      }
    });
  };

  const handleDelete = (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa phương tiện này khỏi hệ thống điều hành?")) {
      deleteVehicleFn({ variables: { id } });
    }
  };

  const cardBg = isDark ? 'bg-[#111827] border-slate-800 text-slate-100' : 'bg-white border-amber-200 text-slate-800 shadow-md';
  const inputBg = isDark ? 'bg-[#1f2937] border-slate-700 text-white' : 'bg-slate-50 border-gray-300 text-slate-900';

  return (
    <div className="p-8 transition-colors duration-300">
      <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
         Quản Lý Danh Mục Phương Tiện
      </h1>
      <p className={`text-sm mb-8 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
        Hệ thống điều hành xe toàn diện. Admin có thể bổ sung link ảnh mẫu xe hoặc hiệu chỉnh thông số tiêu hao nhiên liệu.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vehicles.map((v) => (
          <div key={v.id} className={`rounded-xl border overflow-hidden flex flex-col justify-between transition-transform hover:-translate-y-1 ${cardBg}`}>
            
            <div className="h-44 w-full bg-slate-900/40 relative flex items-center justify-center border-b border-inherit">
              {v.image_url ? (
                <img src={v.image_url} alt={v.vehicle_name} className="w-full h-full object-cover" />
              ) : (
                <div className="text-center p-4">
                  <span className="text-3xl block mb-1">📷</span>
                  <span className="text-xs text-slate-500 italic">Chưa cập nhật ảnh mẫu xe</span>
                </div>
              )}
              <span className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-sm text-cyan-400 font-mono text-xs px-2 py-0.5 rounded font-bold">
                ID XE: {v.id}
              </span>
            </div>

            <div className="p-5 flex-grow">
              <h2 className="text-xl font-bold mb-1">{v.vehicle_name || 'Chưa đặt tên dòng xe'}</h2>
              <p className="text-sm font-mono text-cyan-400 tracking-wider font-bold mb-4">{v.plate_number}</p>
              
              <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs text-slate-400">
                <div> Nhiên liệu: <strong className="text-slate-200 font-medium">{v.model?.fuel_type || 'Xăng'}</strong></div>
                {/* 🌟 MỚI: Hiển thị phân khối động cơ ra màn hình chính của Card xe */}
                <div> Phân khối: <strong className="text-slate-200 font-medium">{v.model?.engine_cc ? `${v.model.engine_cc} cc` : '---'}</strong></div>
                <div> Định mức: <strong className="text-slate-200 font-medium">{v.model?.standard_consumption}L/100km</strong></div>
                <div> Bình chứa: <strong className="text-slate-200 font-medium">{v.model?.fuel_tank_capacity} Lít</strong></div>
                <div className="col-span-2 mt-1"> Số ODO: <strong className="text-slate-200 font-medium">{v.current_odo_km} Km</strong></div>
              </div>
            </div>

            <div className="p-4 bg-slate-500/5 border-t border-inherit flex gap-3">
              <button onClick={() => handleOpenEdit(v)} className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-colors">✏️ Hiệu Chỉnh / Thêm Ảnh</button>
              <button onClick={() => handleDelete(v.id)} className="px-3 py-1.5 bg-red-950/40 hover:bg-red-900/50 text-red-400 border border-red-900/50 rounded-lg text-xs font-bold transition-colors">Xóa</button>
            </div>
          </div>
        ))}
      </div>

      {/* 🌟 FORM CHỈNH SỬA POP-UP (MODAL - KHỚP 100% VỚI ẢNH GIAO DIỆN image_fd86c1.png CỦA BẠN) */}
      {isOpenModal && editingVehicle && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`max-w-md w-full p-6 rounded-2xl border ${isDark ? 'bg-[#111827] border-slate-800 text-white' : 'bg-white border-amber-200 text-slate-900'}`}>
            <h2 className="text-xl font-bold mb-4 flex justify-between items-center">
              <span>✏️ Hiệu chỉnh thông tin xe ID: {editingVehicle.id}</span>
              <button onClick={() => setIsOpenModal(false)} className="text-slate-500 text-sm hover:text-red-500">✕ Đóng</button>
            </h2>

            <form onSubmit={handleSave} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Tên dòng xe <span className="text-red-500">*</span></label>
                <input type="text" value={editingVehicle.vehicle_name} onChange={e => setEditingVehicle({...editingVehicle, vehicle_name: e.target.value})} className={`w-full px-3 py-2 rounded-lg outline-none border ${inputBg}`} required />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Biển kiểm soát <span className="text-red-500">*</span></label>
                <input type="text" value={editingVehicle.plate_number} onChange={e => setEditingVehicle({...editingVehicle, plate_number: e.target.value})} className={`w-full px-3 py-2 rounded-lg outline-none border ${inputBg}`} required />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Đường dẫn Link Ảnh Mẫu Xe</label>
                <input type="text" placeholder="https://example.com/xe.png" value={editingVehicle.image_url} onChange={e => setEditingVehicle({...editingVehicle, image_url: e.target.value})} className={`w-full px-3 py-2 rounded-lg outline-none border text-xs ${inputBg}`} />
              </div>

              {/* 🌟 MỚI & MỞ RỘNG GRID 3 CỘT: Xếp 3 thông số kỹ thuật nằm ngang cực kỳ cân đối và gọn gàng */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Phân khối (cc)</label>
                  <input type="number" placeholder="150" value={editingVehicle.engine_cc} onChange={e => setEditingVehicle({...editingVehicle, engine_cc: e.target.value})} className={`w-full px-2 py-2 rounded-lg outline-none border ${inputBg}`} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Tiêu hao (L/100k)</label>
                  <input type="number" step="0.01" value={editingVehicle.standard_consumption} onChange={e => setEditingVehicle({...editingVehicle, standard_consumption: e.target.value})} className={`w-full px-2 py-2 rounded-lg outline-none border ${inputBg}`} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Bình xăng (L)</label>
                  <input type="number" step="0.1" value={editingVehicle.fuel_tank_capacity} onChange={e => setEditingVehicle({...editingVehicle, fuel_tank_capacity: e.target.value})} className={`w-full px-2 py-2 rounded-lg outline-none border ${inputBg}`} />
                </div>
              </div>

              <button type="submit" className="w-full mt-4 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-900/20">
                 Lưu Lại Thay Đổi
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Vehicles;