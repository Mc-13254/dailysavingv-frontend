import { useEffect, useState } from 'react';
import { Eye } from 'lucide-react';
import DataTable from '../components/DataTable';
import WideModal from '../components/WideModal';
import ExportDropdown from '../components/ExportDropdown';
import { ReportsAPI } from '../api/endpoints';

const fmt = (n) => new Intl.NumberFormat('fr-FR').format(n || 0);

export default function AgencyReports() {
  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [{ data: list }, { data: st }] = await Promise.all([ReportsAPI.agencies(), ReportsAPI.agencyStats()]);
      setRows(list);
      setStats(st);
    } catch { setRows([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openDetail = async (row) => {
    const { data } = await ReportsAPI.agencyDetail(row.agenceID);
    setDetail(data);
  };

  const columns = [
    { key: 'rank', label: '#', render: (r) => `#${r.rank}` },
    { key: 'codeAgence', label: 'Code' },
    { key: 'nom', label: 'Agence' },
    { key: 'managerName', label: 'Responsable', render: (r) => r.managerName || '—' },
    { key: 'collectorCount', label: 'Collecteurs' },
    { key: 'clientCount', label: 'Clients' },
    { key: 'accountCount', label: 'Comptes' },
    { key: 'collections', label: 'Collectes', render: (r) => fmt(r.collections) },
    { key: 'deposits', label: 'Dépôts', render: (r) => fmt(r.deposits) },
    { key: 'commission', label: 'Commission', render: (r) => fmt(r.commission) },
    { key: 'cashVarianceTotal', label: 'Écart caisse cumulé', render: (r) => fmt(r.cashVarianceTotal) },
    { key: 'actions', label: 'Actions', sortable: false, render: (r) => <button className="btn-icon" onClick={() => openDetail(r)}><Eye size={15} /></button> },
  ];

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <div className="panel-title">Agency Reports</div>
          <div className="panel-subtitle">Tableau de pilotage exécutif — comparez toutes les agences en un seul écran.</div>
        </div>
      </div>

      {stats && (
        <div className="kpi-grid mb-4">
          <div className="kpi-card"><div className="kpi-label">Total agences</div><div className="kpi-value">{stats.totalAgencies}</div></div>
          <div className="kpi-card"><div className="kpi-label">Meilleure agence</div><div className="kpi-value">{stats.topAgencyName || '—'}</div></div>
          <div className="kpi-card"><div className="kpi-label">Agence la plus faible</div><div className="kpi-value">{stats.lowestAgencyName || '—'}</div></div>
          <div className="kpi-card"><div className="kpi-label">Chiffre d'affaires total</div><div className="kpi-value accent">{fmt(stats.totalRevenue)}</div></div>
          <div className="kpi-card"><div className="kpi-label">Commission totale</div><div className="kpi-value">{fmt(stats.totalCommission)}</div></div>
          <div className="kpi-card"><div className="kpi-label">Total clients</div><div className="kpi-value">{stats.totalClients}</div></div>
          <div className="kpi-card"><div className="kpi-label">Total collecteurs</div><div className="kpi-value">{stats.totalCollectors}</div></div>
        </div>
      )}

      <div className="toolbar">
        <ExportDropdown filename="AGENCY_REPORTS" columns={columns.filter((c) => c.key !== 'actions')} rows={rows} />
      </div>

      <DataTable columns={columns} rows={rows} loading={loading} totalLabel={`TOTAL: ${rows.length}`} />

      {detail && (
        <WideModal title={`Agence — ${detail.nom}`} onClose={() => setDetail(null)}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="form-card">
              <div className="form-card-title">Profil</div>
              <p className="text-xs normal-case space-y-1">
                <div>Code: {detail.codeAgence}</div>
                <div>Responsable: {detail.managerName || '—'}</div>
                <div>Adresse: {detail.address || '—'}</div>
                <div>Tél: {detail.primaryPhone || '—'} · {detail.email || '—'}</div>
                <div>Classement: <strong>#{detail.rank}</strong> / {detail.totalAgencies}</div>
              </p>
            </div>
            <div className="form-card">
              <div className="form-card-title">Effectifs & Portefeuille</div>
              <p className="text-xs normal-case space-y-1">
                <div>Collecteurs: {detail.collectorCount}</div>
                <div>Caissiers/Utilisateurs: {detail.cashierCount}</div>
                <div>Clients: {detail.clientCount}</div>
                <div>Comptes: {detail.accountCount} (solde total {fmt(detail.totalBalance)})</div>
                <div>Contrats: {detail.contractCount}</div>
              </p>
            </div>
            <div className="form-card">
              <div className="form-card-title">Financier & Conformité</div>
              <p className="text-xs normal-case space-y-1">
                <div>Collectes: {fmt(detail.collections)}</div>
                <div>Dépôts: {fmt(detail.deposits)}</div>
                <div>Retraits: {fmt(detail.withdrawals)}</div>
                <div>Transferts: {fmt(detail.transfers)}</div>
                <div>Commission: {fmt(detail.commission)}</div>
                <div>Sessions ouvertes/clôturées: {detail.openSessions} / {detail.closedSessions}</div>
                <div>Écart de caisse cumulé: {fmt(detail.cashVarianceTotal)}</div>
              </p>
            </div>
          </div>
        </WideModal>
      )}
    </div>
  );
}
