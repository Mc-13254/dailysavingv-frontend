import { useEffect, useState } from 'react';
import { Eye } from 'lucide-react';
import DataTable from '../components/DataTable';
import WideModal from '../components/WideModal';
import StatusBadge from '../components/StatusBadge';
import ExportDropdown from '../components/ExportDropdown';
import { ReportsAPI } from '../api/endpoints';

const fmt = (n) => new Intl.NumberFormat('fr-FR').format(n || 0);
const fmtDate = (d) => d ? new Date(d).toLocaleString('fr-FR') : '—';

export default function CashSessionReports() {
  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', balanced: '', from: '', to: '' });
  const [detail, setDetail] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''));
      const [{ data: list }, { data: st }] = await Promise.all([
        ReportsAPI.cashSessions(params),
        ReportsAPI.cashSessionStats(),
      ]);
      setRows(list);
      setStats(st);
    } catch { setRows([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line

  const openDetail = async (row) => {
    const { data } = await ReportsAPI.cashSessionDetail(row.cashSessionID);
    setDetail(data);
  };

  const columns = [
    { key: 'sessionNumber', label: 'N° Session' },
    { key: 'userFullName', label: 'Utilisateur' },
    { key: 'agenceNom', label: 'Agence' },
    { key: 'openingDate', label: 'Ouverture', render: (r) => fmtDate(r.openingDate) },
    { key: 'closingDate', label: 'Clôture', render: (r) => fmtDate(r.closingDate) },
    { key: 'openingCash', label: 'Caisse ouv.', render: (r) => fmt(r.openingCash) },
    { key: 'expectedCash', label: 'Attendu', render: (r) => r.expectedCash != null ? fmt(r.expectedCash) : '—' },
    { key: 'physicalCash', label: 'Physique', render: (r) => r.physicalCash != null ? fmt(r.physicalCash) : '—' },
    {
      key: 'cashDifference', label: 'Écart', render: (r) => r.cashDifference != null ? (
        <span className={r.cashDifference === 0 ? 'text-emerald-600' : 'text-red-600'}>{fmt(r.cashDifference)}</span>
      ) : '—'
    },
    { key: 'status', label: 'Statut', render: (r) => <StatusBadge status={r.status} /> },
    {
      key: 'actions', label: 'Actions', sortable: false, render: (r) => (
        <button className="btn-icon" title="Voir" onClick={() => openDetail(r)}><Eye size={15} /></button>
      )
    },
  ];

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <div className="panel-title">Cash Session Reports</div>
          <div className="panel-subtitle">Suivi et audit de toutes les sessions de caisse (ouverture/fermeture, écarts, conformité).</div>
        </div>
      </div>

      {stats && (
        <div className="kpi-grid mb-4">
          <div className="kpi-card"><div className="kpi-label">Sessions aujourd'hui</div><div className="kpi-value">{stats.todaySessions}</div></div>
          <div className="kpi-card"><div className="kpi-label">Ouvertes</div><div className="kpi-value">{stats.openSessions}</div></div>
          <div className="kpi-card"><div className="kpi-label">Clôturées</div><div className="kpi-value">{stats.closedSessions}</div></div>
          <div className="kpi-card"><div className="kpi-label">Équilibrées</div><div className="kpi-value text-emerald-600">{stats.balancedSessions}</div></div>
          <div className="kpi-card"><div className="kpi-label">Avec écart</div><div className="kpi-value text-red-600">{stats.unbalancedSessions}</div></div>
          <div className="kpi-card"><div className="kpi-label">Écart total</div><div className="kpi-value">{fmt(stats.totalVariance)}</div></div>
          <div className="kpi-card"><div className="kpi-label">Durée moyenne</div><div className="kpi-value">{stats.averageSessionDurationHours?.toFixed(1)} h</div></div>
        </div>
      )}

      <div className="toolbar flex-wrap gap-2">
        <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
          <option value="">Tous les statuts</option>
          <option value="OPEN">Ouverte</option>
          <option value="CLOSED">Clôturée</option>
        </select>
        <select value={filters.balanced} onChange={(e) => setFilters({ ...filters, balanced: e.target.value })}>
          <option value="">Équilibrée ou non</option>
          <option value="true">Équilibrées uniquement</option>
          <option value="false">Avec écart uniquement</option>
        </select>
        <input type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} />
        <input type="date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} />
        <button className="btn btn-outline" onClick={load}>Filtrer</button>
        <ExportDropdown filename="CASH_SESSION_REPORTS" columns={columns.filter((c) => c.key !== 'actions')} rows={rows} />
      </div>

      <DataTable columns={columns} rows={rows} loading={loading} totalLabel={`TOTAL: ${rows.length}`} />

      {detail && (
        <WideModal title={`Session ${detail.sessionNumber}`} onClose={() => setDetail(null)}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="form-card">
              <div className="form-card-title">Informations</div>
              <p className="text-xs normal-case space-y-1">
                <div>Utilisateur: <strong>{detail.userFullName}</strong></div>
                <div>Agence: {detail.agenceNom}</div>
                <div>Ouverture: {fmtDate(detail.openingDate)}</div>
                <div>Clôture: {fmtDate(detail.closingDate)}</div>
                <div>Statut: <StatusBadge status={detail.status} /></div>
                {detail.requiresApproval && <div>Approbation: {detail.approvalStatus} {detail.approvedBy && `par ${detail.approvedBy}`}</div>}
              </p>
            </div>
            <div className="form-card">
              <div className="form-card-title">Résumé financier</div>
              <p className="text-xs normal-case space-y-1">
                <div>Caisse d'ouverture: {fmt(detail.openingCash)}</div>
                <div>Collectes: {fmt(detail.collections)}</div>
                <div>Dépôts: {fmt(detail.deposits)}</div>
                <div>Retraits: {fmt(detail.withdrawals)}</div>
                <div>Transferts: {fmt(detail.transfers)}</div>
                <div>Commission: {fmt(detail.commission)}</div>
                <div>{detail.transactionCount} transaction(s)</div>
              </p>
            </div>
            <div className="form-card">
              <div className="form-card-title">Comptage de caisse</div>
              <p className="text-xs normal-case space-y-1">
                <div>Caisse attendue: {detail.expectedCash != null ? fmt(detail.expectedCash) : '—'}</div>
                <div>Caisse physique: {detail.physicalCash != null ? fmt(detail.physicalCash) : '—'}</div>
                <div>Écart: <span className={detail.cashDifference === 0 ? 'text-emerald-600' : 'text-red-600'}>{detail.cashDifference != null ? fmt(detail.cashDifference) : '—'}</span></div>
                {detail.varianceReason && <div>Motif: {detail.varianceReason}</div>}
                {detail.closingComment && <div>Commentaire: {detail.closingComment}</div>}
              </p>
            </div>
          </div>
        </WideModal>
      )}
    </div>
  );
}
