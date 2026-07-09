import { useEffect, useState } from 'react';
import { Eye } from 'lucide-react';
import DataTable from '../components/DataTable';
import WideModal from '../components/WideModal';
import StatusBadge from '../components/StatusBadge';
import ExportDropdown from '../components/ExportDropdown';
import { ReportsAPI } from '../api/endpoints';

const fmt = (n) => new Intl.NumberFormat('fr-FR').format(n || 0);

export default function AccountReports() {
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
      const [{ data: list }, { data: st }] = await Promise.all([ReportsAPI.accounts(params), ReportsAPI.accountStats()]);
      setRows(list);
      setStats(st);
    } catch { setRows([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line

  const openDetail = async (row) => {
    const { data } = await ReportsAPI.accountDetail(row.accountID);
    setDetail(data);
  };

  const columns = [
    { key: 'accountID', label: 'Compte' },
    { key: 'accountType', label: 'Type', render: (r) => r.accountType || '—' },
    { key: 'clientName', label: 'Client' },
    { key: 'agenceNom', label: 'Agence' },
    { key: 'collectorName', label: 'Collecteur', render: (r) => r.collectorName || '—' },
    { key: 'contractNumber', label: 'Contrat', render: (r) => r.contractNumber || '—' },
    { key: 'balance', label: 'Solde', render: (r) => fmt(r.balance) },
    { key: 'availableBalance', label: 'Disponible', render: (r) => fmt(r.availableBalance) },
    { key: 'status', label: 'Statut', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'lastTransactionDate', label: 'Dernière opération', render: (r) => r.lastTransactionDate ? new Date(r.lastTransactionDate).toLocaleDateString('fr-FR') : '—' },
    { key: 'actions', label: 'Actions', sortable: false, render: (r) => <button className="btn-icon" onClick={() => openDetail(r)}><Eye size={15} /></button> },
  ];

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <div className="panel-title">Account Reports</div>
          <div className="panel-subtitle">Analyse des comptes clients : soldes, activité, statut.</div>
        </div>
      </div>

      {stats && (
        <div className="kpi-grid mb-4">
          <div className="kpi-card"><div className="kpi-label">Total comptes</div><div className="kpi-value">{stats.totalAccounts}</div></div>
          <div className="kpi-card"><div className="kpi-label">Actifs</div><div className="kpi-value text-emerald-600">{stats.activeAccounts}</div></div>
          <div className="kpi-card"><div className="kpi-label">Gelés</div><div className="kpi-value">{stats.frozenAccounts}</div></div>
          <div className="kpi-card"><div className="kpi-label">Clôturés</div><div className="kpi-value">{stats.closedAccounts}</div></div>
          <div className="kpi-card"><div className="kpi-label">Dormants</div><div className="kpi-value">{stats.dormantAccounts}</div></div>
          <div className="kpi-card"><div className="kpi-label">Solde total</div><div className="kpi-value accent">{fmt(stats.totalBalance)}</div></div>
          <div className="kpi-card"><div className="kpi-label">Solde moyen</div><div className="kpi-value">{fmt(stats.averageBalance)}</div></div>
          <div className="kpi-card"><div className="kpi-label">Nouveaux ce mois</div><div className="kpi-value">{stats.newThisMonth}</div></div>
        </div>
      )}

      <div className="toolbar flex-wrap gap-2">
        <input className="search-input" placeholder="N° compte, client…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Tous les statuts</option>
          <option value="ACTIVE">Actif</option>
          <option value="FROZEN">Gelé</option>
          <option value="CLOSED">Clôturé</option>
          <option value="DORMANT">Dormant</option>
          <option value="PENDING">En attente</option>
        </select>
        <button className="btn btn-outline" onClick={load}>Filtrer</button>
        <ExportDropdown filename="ACCOUNT_REPORTS" columns={columns.filter((c) => c.key !== 'actions')} rows={rows} />
      </div>

      <DataTable columns={columns} rows={rows} loading={loading} totalLabel={`TOTAL: ${rows.length}`} />

      {detail && (
        <WideModal title={`Compte ${detail.accountID}`} onClose={() => setDetail(null)}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="form-card">
              <div className="form-card-title">Profil</div>
              <p className="text-xs normal-case space-y-1">
                <div>Client: <strong>{detail.clientName}</strong> ({detail.clientID})</div>
                <div>Type: {detail.accountType || '—'} · {detail.currency}</div>
                <div>Agence: {detail.agenceNom}</div>
                <div>Collecteur: {detail.collectorName || '—'}</div>
                <div>Contrat: {detail.contractNumber || '—'} {detail.contractTypeName && `(${detail.contractTypeName})`}</div>
                <div>Ouvert le: {new Date(detail.createDate).toLocaleDateString('fr-FR')}</div>
              </p>
            </div>
            <div className="form-card">
              <div className="form-card-title">Soldes</div>
              <p className="text-xs normal-case space-y-1">
                <div>Solde ouverture: {fmt(detail.openingBalance)}</div>
                <div>Solde actuel: <strong>{fmt(detail.balance)}</strong></div>
                <div>Disponible: {fmt(detail.availableBalance)}</div>
                <div>Bloqué: {fmt(detail.blockedBalance)}</div>
                <div>Min/Max: {detail.minimumBalance != null ? fmt(detail.minimumBalance) : '—'} / {detail.maximumBalance != null ? fmt(detail.maximumBalance) : '—'}</div>
                <div>Statut: <StatusBadge status={detail.status} /></div>
                {detail.freezeReason && <div>Motif gel: {detail.freezeReason}</div>}
                {detail.closeReason && <div>Motif clôture: {detail.closeReason}</div>}
              </p>
            </div>
            <div className="form-card">
              <div className="form-card-title">Activité</div>
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
        </WideModal>
      )}
    </div>
  );
}
