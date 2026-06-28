import React from 'react';

const ChartBox = ({ title, icon, isDark, children }) => {
  const cardBg = isDark ? 'bg-[#111827] border-slate-800 text-slate-100' : 'bg-white border-amber-200 text-slate-800 shadow-md';
  
  return (
    <div className={`p-6 rounded-xl border flex flex-col justify-between ${cardBg}`}>
      <h3 className="text-sm font-bold uppercase text-slate-400 tracking-wider mb-4 flex items-center gap-2">
        {icon} {title}
      </h3>
      <div className="w-full bg-slate-500/5 p-4 rounded-xl">
        {children}
      </div>
    </div>
  );
};

export default ChartBox;