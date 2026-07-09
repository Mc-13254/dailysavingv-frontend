import { useEffect, useState } from 'react';
import { LogOut } from 'lucide-react';
import DataTable from '../components/DataTable';
import ExportDropdown from '../components/ExportDropdown';
import { SecurityAPI } from '../api/endpoints';

const fmtDate = (d) => d ? new Date(d).toLocaleString('fr-FR') : '—';

function duration(created) {
  const ms = Date.now() - new Date(created).getTime();
  const hours = Math.floor(ms / 3600000);
  const mins = Math.floor((ms % 3600000) / 60000);
  return hours > 0 ? `${hours}h ${mins}min` : `${mins}min`;
}

export default function ActiveSessions() {
  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [{ data: list }, { data: st }] = await Promise.all([SecurityAPI.sessions(), SecurityAPI.sessionStats()]);
      setRows(list);
      setStats(st);
    } catch { setRows([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const terminate = async (row) => {
    const reason = window.prompt(`Motif de déconnexion forcée pour ${row.username} ?`);
    if (reason === null) return;
    if (!reason.trim()) { alert('Un motif est requis.'); return; }
    await SecurityAPI.terminateSession(row.tokenID, reason);
    load();
  };

  const columns = [
    { key: 'username', label: "Nom d'utilisateur" },
    { key: 'fullName', label: 'Nom complet', render: (r) => r.fullName || '—' },
    { key: 'roleCode', label: 'Rôle', render: (r) => r.roleCode || '—' },
    { key: 'agenceNom', label: 'Agence', render: (r) => r.agenceNom || '—' },
    { key: 'ipAddress', label: 'Adresse IP', render: (r) => r.ipAddress || '—' },
    { key: 'userAgent', label: 'Appareil / Navigateur', render: (r) => r.userAgent ? r.userAgent.slice(0, 40) + (r.userAgent.length > 40 ? '…' : '') : '—' },
    { key: 'createdDate', label: 'Connecté depuis', render: (r) => fmtDate(r.createdDate) },
    { key: 'duration', label: 'Durée', render: (r) => duration(r.createdDate) },
    { key: 'expiryDate', label: 'Expire le', render: (r) => fmtDate(r.expiryDate) },
    {
      key: 'actions', label: 'Actions', sortable: false, render: (r) => (
        <button className="btn btn-danger btn-sm" onClick={() => terminate(r)}><LogOut size={13} /> Déconnecter</button>
      )
    },
  ];

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <div className="panel-title">Active Sessions</div>
          <div className="panel-subtitle">Toutes les sessions actuellement connectées, avec possibilité de déconnexion forcée.</div>
        </div>
        <button className="btn btn-outline" onClick={load}>Actualiser</button>
      </div>

      {stats && (
        <div className="kpi-grid mb-4">
          <div className="kpi-card"><div className="kpi-label">Sessions actives</div><div className="kpi-value">{stats.totalActiveSessions}</div></div>
          <div className="kpi-card"><div className="kpi-label">Collecteurs en ligne</div><div className="kpi-value">{stats.collectorsOnline}</div></div>
          <div className="kpi-card"><div className="kpi-label">Caissiers en ligne</div><div className="kpi-value">{stats.cashiersOnline}</div></div>
          <div className="kpi-card"><div className="kpi-label">Managers en ligne</div><div className="kpi-value">{stats.managersOnline}</div></div>
          <div className="kpi-card"><div className="kpi-label">Administrateurs en ligne</div><div className="kpi-value">{stats.administratorsOnline}</div></div>
        </div>
      )}

      <div className="toolbar">
        <ExportDropdown filename="ACTIVE_SESSIONS" columns={columns.filter((c) => c.key !== 'actions')} rows={rows} />
      </div>

      <DataTable columns={columns} rows={rows} loading={loading} totalLabel={`TOTAL: ${rows.length}`} />
    </div>
  );
}
