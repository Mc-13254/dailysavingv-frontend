export default function CompletenessBar({ percent, label }) {
  const color = percent >= 90 ? 'bg-emerald-500' : percent >= 70 ? 'bg-brand-blue' : percent >= 50 ? 'bg-amber-500' : 'bg-red-500';
  const textColor = percent >= 90 ? 'text-emerald-600' : percent >= 70 ? 'text-brand-blue' : percent >= 50 ? 'text-amber-600' : 'text-red-600';

  return (
    <div className="normal-case">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Profile Completeness</span>
        <span className={`text-xs font-bold ${textColor}`}>{percent}% · {label}</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
        <div className={`h-2 rounded-full ${color} transition-all`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
