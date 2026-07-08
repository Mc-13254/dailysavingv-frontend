export default function WizardStepper({ steps, current, onJump }) {
  return (
    <div className="flex flex-wrap gap-1 mb-4 border-b border-gray-200 pb-3">
      {steps.map((label, i) => (
        <button
          key={label}
          type="button"
          onClick={() => onJump?.(i)}
          className={`px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-colors
            ${i === current ? 'bg-brand-blue text-white' : i < current ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}
        >
          {i + 1}. {label}
        </button>
      ))}
    </div>
  );
}
