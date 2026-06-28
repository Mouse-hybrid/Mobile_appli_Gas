import React from 'react';
import { useQuery } from '@apollo/client/react/index.js';
import { GET_ALL_USERS } from '../graphql/queries';

const Users = ({ theme }) => {
  const isDark = theme === 'dark-blue';
  
  // Gọi API lấy toàn bộ dữ liệu người dùng và xe từ Backend về
  const { data, loading, error } = useQuery(GET_ALL_USERS);

  if (loading) return <div className="p-8 text-center text-slate-400">Đang đồng bộ danh sách tài khoản...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Lỗi kết nối: {error.message}</div>;

  const usersList = data?.getAllUsers || [];

  // Thiết lập CSS linh hoạt theo Nút Switch Đen Xanh / Trắng Vàng
  const tableHeaderBg = isDark ? 'bg-[#1f2937] text-slate-300' : 'bg-amber-100 text-amber-900';
  const rowBorderColor = isDark ? 'border-slate-800' : 'border-amber-100';
  const cardBg = isDark ? 'bg-[#111827] border-slate-800' : 'bg-white border-amber-200 shadow-md';

  return (
    <div className="p-8 transition-colors duration-300">
      <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
        Quản Lý Tài Khoản Người Dùng
      </h1>
      <p className={`text-sm mb-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
        Danh sách thành viên thuộc hệ thống điều hành PentaDevs kèm mã định danh phương tiện.
      </p>

      {/* BẢNG DỮ LIỆU CHUYÊN NGHIỆP */}
      <div className={`overflow-hidden rounded-xl border ${cardBg}`}>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className={`text-xs font-bold uppercase tracking-wider ${tableHeaderBg}`}>
              <th className="p-4">ID Thành viên</th>
              <th className="p-4">Họ và Tên</th>
              <th className="p-4">Địa chỉ Email</th>
              <th className="p-4">Phương tiện đang sở hữu (ID Xe | Tên | Biển số)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {usersList.map((user) => (
              <tr key={user.id} className={`hover:bg-slate-500/5 text-sm transition-colors ${rowBorderColor}`}>
                {/* ID Người dùng */}
                <td className="p-4 font-mono text-xs text-slate-500">#USR-{user.id}</td>
                
                {/* Tên người dùng */}
                <td className="p-4 font-semibold">{user.full_name}</td>
                
                {/* Email */}
                <td className="p-4 text-slate-400">{user.email}</td>
                
                {/* Ô hiển thị danh sách xe chứa ID XE bốc từ Backend */}
                <td className="p-4">
                  {user.vehicles && user.vehicles.length > 0 ? (
                    <div className="flex flex-col gap-1.5">
                      {user.vehicles.map((vh) => (
                        <div 
                          key={vh.id} 
                          className={`text-xs px-2.5 py-1 rounded border flex items-center gap-2 max-w-md ${
                            isDark 
                              ? 'bg-[#1f2937]/50 border-slate-700 text-cyan-400' 
                              : 'bg-amber-50 border-amber-200 text-amber-800'
                          }`}
                        >
                          {/* 🌟 IN TẬN MẮT ID XE LÊN GIAO DIỆN ĐỂ KIỂM TRA */}
                          <span className="font-mono bg-slate-800 text-slate-300 px-1 rounded text-[10px]">
                            ID: {vh.id}
                          </span>
                          <span className="font-medium">{vh.vehicle_name}</span>
                          <span className="text-slate-500">|</span>
                          <span className="font-bold tracking-wider">{vh.plate_number}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-500 italic">Chưa đăng ký phương tiện</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Users;