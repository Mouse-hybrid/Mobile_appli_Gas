import React from 'react';

const StatCard = ({ title, value, unit, colorClass, isDark }) => {
  const cardBg = isDark ? 'bg-[#111827] border-slate-800 text-slate-100' : 'bg-white border-amber-200 text-slate-800 shadow-sm';
  
  return (
    <div className={`p-6 rounded-2xl border transition-all hover:scale-[1.02] ${cardBg}`}>
      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</span>
      <p className={`text-3xl font-extrabold ${colorClass} mt-2`}>
        {value} <span className="text-xs font-normal text-slate-400">{unit}</span>
      </p>
    </div>
  );
};

export default StatCard;