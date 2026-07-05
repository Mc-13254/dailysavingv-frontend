export default function StatusBadge({ status }) {
  const normalized = (status || '').toUpperCase();

  const map = {
    ACTIVE: { cls: 'badge-success', label: 'ACTIVE' },
    ACTIF: { cls: 'badge-success', label: 'ACTIF' },
    VALIDATED: { cls: 'badge-success', label: 'VALIDATED' },
    VALIDÉ: { cls: 'badge-success', label: 'VALIDÉ' },
    INACTIVE: { cls: 'badge-danger', label: 'INACTIVE' },
    INACTIF: { cls: 'badge-danger', label: 'INACTIF' },
    REJECTED: { cls: 'badge-danger', label: 'REJECTED' },
    PENDING: { cls: 'badge-warning', label: 'PENDING' },
    'EN ATTENTE': { cls: 'badge-warning', label: 'EN ATTENTE' },
  };

  const entry = map[normalized] || { cls: 'badge-warning', label: status || '—' };

  return <span className={`badge ${entry.cls}`}>{entry.label}</span>;
}
