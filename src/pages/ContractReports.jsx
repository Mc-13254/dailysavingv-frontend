import { useEffect, useState } from 'react';
import { Eye } from 'lucide-react';
import DataTable from '../components/DataTable';
import WideModal from '../components/WideModal';
import StatusBadge from '../components/StatusBadge';
import ExportDropdown from '../components/ExportDropdown';
import { ReportsAPI } from '../api/endpoints';

const fmt = (n) => new Intl.NumberFormat('fr-FR').format(n || 0);
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';

export default function ContractReports() {
  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [detail, setDetail] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (status) params.status = status;
      const [{ data: list }, { data: st }] = await Promise.all([ReportsAPI.contracts(params), ReportsAPI.contractStats()]);
      setRows(list);
      setStats(st);
    } catch { setRows([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line

  const openDetail = async (row) => {
    const { data } = await ReportsAPI.contractDetail(row.contractID);
    setDetail(data);
  };

  const columns = [
    { key: 'contractNumber', label: 'N° Contrat' },
    { key: 'clientName', label: 'Client' },
    { key: 'agenceNom', label: 'Agence' },
    { key: 'collectorName', label: 'Collecteur', render: (r) => r.collectorName || '—' },
    { key: 'contractTypeName', label: 'Type', render: (r) => r.contractTypeName || '—' },
    { key: 'commissionTypeName', label: 'Commission', render: (r) => r.commissionTypeName || '—' },
    { key: 'accountBalance', label: 'Solde compte', render: (r) => r.accountBalance != null ? fmt(r.accountBalance) : '—' },
    { key: 'commissionGenerated', label: 'Commission générée', render: (r) => fmt(r.commissionGenerated) },
    { key: 'statut', label: 'Statut', render: (r) => <StatusBadge status={r.statut} /> },
    { key: 'endDate', label: 'Échéance', render: (r) => fmtDate(r.endDate) },
    { key: 'actions', label: 'Actions', sortable: false, render: (r) => <button className="btn-icon" onClick={() => openDetail(r)}><Eye size={15} /></button> },
  ];

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <div className="panel-title">Contract Reports</div>
          <div className="panel-subtitle">Analyse et rentabilité de chaque contrat client.</div>
        </div>
      </div>

      {stats && (
        <div className="kpi-grid mb-4">
          <div className="kpi-card"><div className="kpi-label">Total contrats</div><div className="kpi-value">{stats.totalContracts}</div></div>
          <div className="kpi-card"><div className="kpi-label">Actifs</div><div className="kpi-value text-emerald-600">{stats.activeContracts}</div></div>
          <div className="kpi-card"><div className="kpi-label">Résiliés</div><div className="kpi-value">{stats.terminatedContracts}</div></div>
          <div className="kpi-card"><div className="kpi-label">Échéance &lt; 30j</div><div className="kpi-value text-amber-600">{stats.expiringSoon}</div></div>
          <div className="kpi-card"><div className="kpi-label">Commission totale générée</div><div className="kpi-value accent">{fmt(stats.totalCommissionGenerated)}</div></div>
        </div>
      )}

      <div className="toolbar flex-wrap gap-2">
        <input className="search-input" placeholder="N° contrat, client…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Tous les statuts</option>
          <option value="ACTIVE">Actif</option>
          <option value="TERMINATED">Résilié</option>
        </select>
        <button className="btn btn-outline" onClick={load}>Filtrer</button>
        <ExportDropdown filename="CONTRACT_REPORTS" columns={columns.filter((c) => c.key !== 'actions')} rows={rows} />
      </div>

      <DataTable columns={columns} rows={rows} loading={loading} totalLabel={`TOTAL: ${rows.length}`} />

      {detail && (
        <WideModal title={`Contrat ${detail.contractNumber}`} onClose={() => setDetail(null)}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="form-card">
              <div className="form-card-title">Profil</div>
              <p className="text-xs normal-case space-y-1">
                <div>Client: <strong>{detail.clientName}</strong> ({detail.clientID})</div>
                <div>Agence: {detail.agenceNom}</div>
                <div>Collecteur: {detail.collectorName || '—'}</div>
                <div>Type: {detail.contractTypeName || '—'}</div>
                <div>Commission: {detail.commissionTypeName || '—'}</div>
                <div>Début: {fmtDate(detail.startDate)} — Fin: {fmtDate(detail.endDate)}</div>
                <div>Statut: <StatusBadge status={detail.statut} /></div>
                {detail.terminationReason && <div>Motif résiliation: {detail.terminationReason}</div>}
              </p>
            </div>
            <div className="form-card">
              <div className="form-card-title">Compte lié</div>
              <p className="text-xs normal-case space-y-1">
                <div>Compte: {detail.accountID || '—'}</div>
                <div>Solde: {detail.accountBalance != null ? fmt(detail.accountBalance) : '—'}</div>
              </p>
            </div>
            <div className="form-card">
              <div className="form-card-title">Rentabilité</div>
              <p className="text-xs normal-case space-y-1">
                <div>Total collecté: <strong>{fmt(detail.totalCollected)}</strong></div>
                <div>Nombre de collectes: {detail.collectionCount}</div>
                <div>Collecte moyenne: {fmt(detail.averageCollection)}</div>
                <div>Commission générée: {fmt(detail.commissionGenerated)}</div>
                <div>Rendement estimé: {detail.estimatedProfitability != null ? `${detail.estimatedProfitability.toFixed(2)}%` : '—'}</div>
              </p>
            </div>
          </div>
        </WideModal>
      )}
    </div>
  );
}
