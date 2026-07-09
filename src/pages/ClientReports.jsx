import { useEffect, useState } from 'react';
import { Eye } from 'lucide-react';
import DataTable from '../components/DataTable';
import WideModal from '../components/WideModal';
import StatusBadge from '../components/StatusBadge';
import ExportDropdown from '../components/ExportDropdown';
import { ReportsAPI } from '../api/endpoints';

const fmt = (n) => new Intl.NumberFormat('fr-FR').format(n || 0);
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';

export default function ClientReports() {
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
      const [{ data: list }, { data: st }] = await Promise.all([
        ReportsAPI.clients(params),
        ReportsAPI.clientStats(),
      ]);
      setRows(list);
      setStats(st);
    } catch { setRows([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line

  const openDetail = async (row) => {
    const { data } = await ReportsAPI.clientDetail(row.clientID);
    setDetail(data);
  };

  const columns = [
    { key: 'clientID', label: 'Code' },
    { key: 'clientName', label: 'Nom' },
    { key: 'phoneNumber', label: 'Téléphone', render: (r) => r.phoneNumber || '—' },
    { key: 'agenceNom', label: 'Agence' },
    { key: 'collectorName', label: 'Collecteur', render: (r) => r.collectorName || '—' },
    { key: 'accountCount', label: 'Comptes' },
    { key: 'totalBalance', label: 'Solde total', render: (r) => fmt(r.totalBalance) },
    { key: 'contractCount', label: 'Contrats' },
    { key: 'collectionCount', label: 'Collectes' },
    { key: 'lastTransactionDate', label: 'Dernière opération', render: (r) => r.lastTransactionDate ? new Date(r.lastTransactionDate).toLocaleDateString('fr-FR') : '—' },
    { key: 'validationStatus', label: 'Statut', render: (r) => r.isBlacklisted ? <span className="badge badge-danger">LISTE NOIRE</span> : <StatusBadge status={r.validationStatus} /> },
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
          <div className="panel-title">Client Reports</div>
          <div className="panel-subtitle">Vue 360° de chaque client : comptes, contrats, collectes, activité.</div>
        </div>
      </div>

      {stats && (
        <div className="kpi-grid mb-4">
          <div className="kpi-card"><div className="kpi-label">Total clients</div><div className="kpi-value">{stats.totalClients}</div></div>
          <div className="kpi-card"><div className="kpi-label">Actifs</div><div className="kpi-value text-emerald-600">{stats.activeClients}</div></div>
          <div className="kpi-card"><div className="kpi-label">En attente</div><div className="kpi-value">{stats.pendingClients}</div></div>
          <div className="kpi-card"><div className="kpi-label">Liste noire</div><div className="kpi-value text-red-600">{stats.blockedClients}</div></div>
          <div className="kpi-card"><div className="kpi-label">Nouveaux ce mois</div><div className="kpi-value accent">{stats.newThisMonth}</div></div>
          <div className="kpi-card"><div className="kpi-label">Avec compte(s)</div><div className="kpi-value">{stats.clientsWithAccounts}</div></div>
          <div className="kpi-card"><div className="kpi-label">Avec contrat(s)</div><div className="kpi-value">{stats.clientsWithContracts}</div></div>
        </div>
      )}

      <div className="toolbar flex-wrap gap-2">
        <input className="search-input" placeholder="Code, nom, téléphone…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Tous les statuts</option>
          <option value="VALIDATED">Validé</option>
          <option value="PENDING">En attente</option>
          <option value="REJECTED">Rejeté</option>
        </select>
        <button className="btn btn-outline" onClick={load}>Filtrer</button>
        <ExportDropdown filename="CLIENT_REPORTS" columns={columns.filter((c) => c.key !== 'actions')} rows={rows} />
      </div>

      <DataTable columns={columns} rows={rows} loading={loading} totalLabel={`TOTAL: ${rows.length}`} />

      {detail && (
        <WideModal title={`Dossier client — ${detail.clientName}`} onClose={() => setDetail(null)}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div className="form-card">
              <div className="form-card-title">Profil</div>
              <p className="text-xs normal-case space-y-1">
                <div>{detail.clientID} — {detail.sexe === 'M' ? 'Homme' : detail.sexe === 'F' ? 'Femme' : '—'}</div>
                <div>Né(e) le {fmtDate(detail.dateOfBirth)}</div>
                <div>{detail.nationality} · {detail.occupation || '—'}</div>
                <div>{detail.phoneNumber} {detail.email && `· ${detail.email}`}</div>
                <div>{detail.address || '—'}</div>
              </p>
            </div>
            <div className="form-card">
              <div className="form-card-title">Rattachement</div>
              <p className="text-xs normal-case space-y-1">
                <div>Agence: {detail.agenceNom}</div>
                <div>Collecteur: {detail.collectorName || '—'}</div>
                <div>Zone: {detail.zoneNom || '—'}</div>
                <div>Statut: <StatusBadge status={detail.validationStatus} /></div>
                {detail.isBlacklisted && <div className="text-red-600 font-semibold">LISTE NOIRE</div>}
                <div>Risque: {detail.riskLevel || '—'}</div>
                <div>Client depuis: {fmtDate(detail.createdDate)}</div>
              </p>
            </div>
            <div className="form-card">
              <div className="form-card-title">Activité financière</div>
              <p className="text-xs normal-case space-y-1">
                <div>Collectes: {fmt(detail.totalCollections)}</div>
                <div>Dépôts: {fmt(detail.totalDeposits)}</div>
                <div>Retraits: {fmt(detail.totalWithdrawals)}</div>
                <div>Transferts: {fmt(detail.totalTransfers)}</div>
                <div>{detail.transactionCount} transaction(s)</div>
                <div>Dernière: {detail.lastTransactionDate ? new Date(detail.lastTransactionDate).toLocaleString('fr-FR') : '—'}</div>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="form-card">
              <div className="form-card-title">Comptes ({detail.accounts.length})</div>
              {detail.accounts.length === 0 ? <p className="text-xs text-gray-400 normal-case">Aucun compte.</p> : (
                <table className="w-full text-xs">
                  <thead><tr className="text-left text-gray-400"><th>Compte</th><th>Type</th><th>Solde</th><th>Statut</th></tr></thead>
                  <tbody>
                    {detail.accounts.map((a) => (
                      <tr key={a.accountID}><td>{a.accountID}</td><td>{a.accountType || '—'}</td><td>{fmt(a.balance)}</td><td><StatusBadge status={a.status} /></td></tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="form-card">
              <div className="form-card-title">Contrats ({detail.contracts.length})</div>
              {detail.contracts.length === 0 ? <p className="text-xs text-gray-400 normal-case">Aucun contrat.</p> : (
                <table className="w-full text-xs">
                  <thead><tr className="text-left text-gray-400"><th>N°</th><th>Type</th><th>Début</th><th>Statut</th></tr></thead>
                  <tbody>
                    {detail.contracts.map((c) => (
                      <tr key={c.contractID}><td>{c.contractNumber}</td><td>{c.contractTypeName || '—'}</td><td>{fmtDate(c.startDate)}</td><td><StatusBadge status={c.statut} /></td></tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </WideModal>
      )}
    </div>
  );
}
