import { useMemo } from 'react';

// Standard FCFA (XAF/XOF) denominations. Simplification: this is a fixed list
// rather than an admin-configurable table — reasonable for now since the
// physical currency denominations themselves rarely change.
export const DENOMINATIONS = [
  { value: 10000, type: 'Billet' },
  { value: 5000, type: 'Billet' },
  { value: 2000, type: 'Billet' },
  { value: 1000, type: 'Billet' },
  { value: 500, type: 'Billet' },
  { value: 500, type: 'Pièce' },
  { value: 200, type: 'Pièce' },
  { value: 100, type: 'Pièce' },
  { value: 50, type: 'Pièce' },
  { value: 25, type: 'Pièce' },
  { value: 10, type: 'Pièce' },
  { value: 5, type: 'Pièce' },
];

const fmt = (n) => new Intl.NumberFormat('fr-FR').format(n || 0);

/**
 * counts: { [denominationValue]: quantity } — note two denominations can share
 * the same face value (500 note vs 500 coin), so keys are index-based, not
 * value-based, to stay unambiguous.
 */
export default function DenominationCounter({ counts, onChange, targetAmount }) {
  const total = useMemo(
    () => DENOMINATIONS.reduce((sum, d, i) => sum + d.value * (Number(counts?.[i]) || 0), 0),
    [counts]
  );
  const matches = targetAmount == null || total === Number(targetAmount);

  const setQty = (i, qty) => {
    onChange({ ...counts, [i]: qty === '' ? '' : Math.max(0, Number(qty)) });
  };

  return (
    <div className="form-card">
      <div className="form-card-title">Détail des espèces (billets / pièces)</div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
        {DENOMINATIONS.map((d, i) => (
          <div key={i} className="form-group">
            <label className="text-[11px]">{d.type} {fmt(d.value)}</label>
            <input
              type="number"
              min="0"
              value={counts?.[i] ?? ''}
              onChange={(e) => setQty(i, e.target.value)}
              placeholder="0"
            />
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100 text-sm">
        <span className="text-gray-500">Total compté</span>
        <span className={`font-bold ${matches ? 'text-emerald-600' : 'text-red-600'}`}>
          {fmt(total)} {targetAmount != null && !matches && ` (attendu: ${fmt(targetAmount)})`}
        </span>
      </div>
    </div>
  );
}

export function denominationTotal(counts) {
  return DENOMINATIONS.reduce((sum, d, i) => sum + d.value * (Number(counts?.[i]) || 0), 0);
}

// Converts the {index: qty} UI state into the {denominationValue: qty} shape
// the backend expects. When two denominations share a face value (500 note /
// 500 coin) their quantities are summed into that one key.
export function denominationCountsToPayload(counts) {
  const payload = {};
  DENOMINATIONS.forEach((d, i) => {
    const qty = Number(counts?.[i]) || 0;
    if (qty > 0) payload[d.value] = (payload[d.value] || 0) + qty;
  });
  return Object.keys(payload).length > 0 ? payload : null;
}
