import React, { useState } from 'react';
import { useMutation } from '@apollo/client/react/index.js';
import { LOGIN_MUTATION } from '../graphql/mutations';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [loginFn, { loading }] = useMutation(LOGIN_MUTATION, {
    onCompleted: (data) => {
      if (data?.login?.token) {
        localStorage.setItem('admin_token', data.login.token);
        localStorage.setItem('admin_name', data.login.user.full_name);
        window.location.reload();
      }
    },
    onError: (error) => {
      setErrorMessage(error.message || 'Tài khoản hoặc mật khẩu không chính xác!');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (!email || !password) {
      setErrorMessage('Vui lòng điền đầy đủ thông tin!');
      return;
    }
    loginFn({ variables: { email, password } });
  };

  return (
    // Đổi sang nền Đen Xanh Vũ Trụ
    <div className="min-h-screen flex items-center justify-center bg-[#0a0f1d] px-4">
      <div className="max-w-md w-full bg-[#111827] p-8 rounded-2xl shadow-2xl border border-slate-800">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
            Smart Fuel Tracker
          </h2>
          <p className="text-sm text-slate-400 mt-2">Hệ thống Quản trị trung tâm điều hành Admin</p>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 bg-red-950/50 border border-red-800 text-red-400 text-sm rounded-lg text-center font-medium">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-300">
              Email quản trị <span className="text-red-500 font-bold">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mt-1 px-4 py-3 bg-[#1f2937] border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all placeholder-slate-500"
              placeholder="admin@domain.com"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300">
              Mật khẩu <span className="text-red-500 font-bold">*</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full mt-1 px-4 py-3 bg-[#1f2937] border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all placeholder-slate-500"
              placeholder="123456"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold rounded-xl shadow-lg shadow-blue-900/30 transform hover:-translate-y-0.5 transition-all disabled:opacity-50"
          >
            {loading ? 'Đang xác thực hệ thống...' : 'Đăng Nhập Hệ Thống'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;