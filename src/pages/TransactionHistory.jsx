import { useEffect, useState } from 'react';
import { Eye } from 'lucide-react';
import DataTable from '../components/DataTable';
import WideModal from '../components/WideModal';
import StatusBadge from '../components/StatusBadge';
import ExportDropdown from '../components/ExportDropdown';
import { ReportsAPI } from '../api/endpoints';

const fmt = (n) => new Intl.NumberFormat('fr-FR').format(n || 0);

const TYPE_LABELS = {
  DAILY_COLLECTION: 'Collecte', DEPOSIT: 'Dépôt', WITHDRAWAL: 'Retrait',
  TRANSFER: 'Transfert', LOAN_PAYMENT: 'Remb. prêt',
};

export default function TransactionHistory() {
  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', transactionType: '', status: '', from: '', to: '' });
  const [detail, setDetail] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
      const [{ data: list }, { data: st }] = await Promise.all([
        ReportsAPI.transactionHistory(params),
        ReportsAPI.transactionStats(),
      ]);
      setRows(list);
      setStats(st);
    } catch { setRows([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line

  const openDetail = async (row) => {
    const { data } = await ReportsAPI.transactionDetail(row.transactionID);
    setDetail(data);
  };

  const columns = [
    { key: 'receiptNumber', label: 'N° Reçu', render: (r) => r.receiptNumber || '—' },
    { key: 'transactionType', label: 'Type', render: (r) => TYPE_LABELS[r.transactionType] || r.transactionType },
    { key: 'clientName', label: 'Client' },
    { key: 'accountID', label: 'Compte' },
    { key: 'collectorName', label: 'Collecteur', render: (r) => r.collectorName || '—' },
    { key: 'agenceNom', label: 'Agence' },
    { key: 'montant', label: 'Montant', render: (r) => fmt(r.montant) },
    { key: 'montantCommission', label: 'Commission', render: (r) => fmt(r.montantCommission) },
    { key: 'paymentMethod', label: 'Mode', render: (r) => r.paymentMethod || '—' },
    { key: 'statut', label: 'Statut', render: (r) => <StatusBadge status={r.statut} /> },
    { key: 'dateTransaction', label: 'Date', render: (r) => new Date(r.dateTransaction).toLocaleString('fr-FR') },
    {
      key: 'fraudScore', label: 'Risque', render: (r) => r.fraudRiskLevel && r.fraudRiskLevel !== 'LOW' ? (
        <span className={`badge ${r.fraudRiskLevel === 'CRITICAL' || r.fraudRiskLevel === 'HIGH' ? 'badge-danger' : 'badge-warning'}`} title={`Score de fraude: ${r.fraudScore}/100`}>
          ⚠ {r.fraudRiskLevel}
        </span>
      ) : '—'
    },
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
          <div className="panel-title">Transaction History</div>
          <div className="panel-subtitle">Grand livre officiel — lecture seule, aucune transaction ne peut être modifiée ou supprimée ici.</div>
        </div>
      </div>

      {stats && (
        <div className="kpi-grid mb-4">
          <div className="kpi-card"><div className="kpi-label">Aujourd'hui</div><div className="kpi-value">{stats.todayCount}</div></div>
          <div className="kpi-card"><div className="kpi-label">Montant aujourd'hui</div><div className="kpi-value accent">{fmt(stats.todayAmount)}</div></div>
          <div className="kpi-card"><div className="kpi-label">Collectes</div><div className="kpi-value">{fmt(stats.totalCollections)}</div></div>
          <div className="kpi-card"><div className="kpi-label">Dépôts</div><div className="kpi-value">{fmt(stats.totalDeposits)}</div></div>
          <div className="kpi-card"><div className="kpi-label">Retraits</div><div className="kpi-value">{fmt(stats.totalWithdrawals)}</div></div>
          <div className="kpi-card"><div className="kpi-label">Transferts</div><div className="kpi-value">{fmt(stats.totalTransfers)}</div></div>
          <div className="kpi-card"><div className="kpi-label">En attente</div><div className="kpi-value">{stats.pendingCount}</div></div>
          <div className="kpi-card"><div className="kpi-label">Validées</div><div className="kpi-value">{stats.validatedCount}</div></div>
        </div>
      )}

      <div className="toolbar flex-wrap gap-2">
        <input className="search-input" placeholder="N° reçu, client, compte…" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
        <select value={filters.transactionType} onChange={(e) => setFilters({ ...filters, transactionType: e.target.value })}>
          <option value="">Tous les types</option>
          {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
          <option value="">Tous les statuts</option>
          <option value="VALIDATED">Validée</option>
          <option value="REVERSED">Annulée (reversed)</option>
          <option value="CANCELLED">Rejetée</option>
        </select>
        <input type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} />
        <input type="date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} />
        <button className="btn btn-outline" onClick={load}>Filtrer</button>
        <ExportDropdown filename="TRANSACTION_HISTORY" columns={columns.filter((c) => c.key !== 'actions')} rows={rows} />
      </div>

      <DataTable columns={columns} rows={rows} loading={loading} totalLabel={`TOTAL: ${rows.length}`} />

      {detail && (
        <WideModal title={`Transaction ${detail.receiptNumber || '#' + detail.transactionID}`} onClose={() => setDetail(null)}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="form-card">
              <div className="form-card-title">Client & Compte</div>
              <p className="text-xs normal-case space-y-1">
                <div>Client: <strong>{detail.clientName}</strong> ({detail.clientID})</div>
                <div>Compte: {detail.accountID} {detail.accountType && `(${detail.accountType})`}</div>
                {detail.toClientID && <div>Bénéficiaire: {detail.toClientName} — Compte {detail.toAccountID}</div>}
                {detail.contractNumber && <div>Contrat: {detail.contractNumber}</div>}
                <div>Collecteur: {detail.collectorName || '—'}</div>
                <div>Agence: {detail.agenceNom}</div>
              </p>
            </div>
            <div className="form-card">
              <div className="form-card-title">Financier</div>
              <p className="text-xs normal-case space-y-1">
                <div>Montant: <strong>{fmt(detail.montant)}</strong></div>
                <div>Solde avant: {fmt(detail.openingBalance)}</div>
                <div>Solde après: {fmt(detail.closingBalance)}</div>
                <div>Commission: {fmt(detail.montantCommission)}</div>
                <div>Mode de paiement: {detail.paymentMethod || '—'}</div>
                {detail.remitterName && <div>Remettant: {detail.remitterName}</div>}
                {detail.beneficiaryName && <div>Bénéficiaire: {detail.beneficiaryName}</div>}
              </p>
            </div>
            <div className="form-card">
              <div className="form-card-title">Audit</div>
              <p className="text-xs normal-case space-y-1">
                <div>Statut: <StatusBadge status={detail.statut} /></div>
                <div>Date: {new Date(detail.dateTransaction).toLocaleString('fr-FR')}</div>
                <div>Créé par: {detail.createdBy || '—'}</div>
                <div>Validé par: {detail.validatedBy || '—'}</div>
                {detail.cashSessionNumber && <div>Session de caisse: {detail.cashSessionNumber}</div>}
                {detail.referenceNumber && <div>Référence: {detail.referenceNumber}</div>}
                {detail.comment && <div>Commentaire: {detail.comment}</div>}
              </p>
            </div>
          </div>
        </WideModal>
      )}
    </div>
  );
}
