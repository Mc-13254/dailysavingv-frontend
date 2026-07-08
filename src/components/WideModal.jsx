export default function WideModal({ title, onClose, children, footer }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[2000] p-4 normal-case" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl w-[92vw] max-w-[1400px] max-h-[92vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-gray-200 flex-shrink-0">
          <h3 className="text-base font-bold text-gray-800 m-0">{title}</h3>
          <button className="btn-icon" onClick={onClose} aria-label="Fermer">✕</button>
        </div>

        {/* Body: fills remaining space, grid layout keeps it compact enough to avoid scrolling on desktop */}
        <div className="px-6 py-4 overflow-y-auto">{children}</div>

        {/* Sticky footer */}
        {footer && (
          <div className="px-6 py-3 border-t border-gray-200 flex justify-end gap-2 flex-shrink-0 bg-gray-50 rounded-b-xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
