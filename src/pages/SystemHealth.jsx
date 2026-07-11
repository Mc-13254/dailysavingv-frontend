import { useEffect, useState } from 'react';
import DataTable from '../components/DataTable';
import ExportDropdown from '../components/ExportDropdown';
import { SecurityAPI } from '../api/endpoints';

const fmtDate = (d) => d ? new Date(d).toLocaleString('fr-FR') : '—';

function fmtDuration(iso) {
  if (!iso) return '—';
  // TimeSpan comes back as "d.hh:mm:ss" or "hh:mm:ss"
  const parts = iso.split('.');
  return parts.length > 1 ? `${parts[0]}j ${parts[1].slice(0, 8)}` : iso.slice(0, 8);
}

export default function SystemHealth() {
  const [health, setHealth] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  const load = async () => {
    setLoading(true);
    setAccessDenied(false);
    try {
      const [{ data: h }, { data: l }] = await Promise.all([SecurityAPI.systemHealth(), SecurityAPI.errorLogs({})]);
      setHealth(h);
      setLogs(l);
    } catch (err) {
      if (err?.response?.status === 401 || err?.response?.status === 403) setAccessDenied(true);
      setLogs([]);
    }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const columns = [
    { key: 'occurredDate', label: 'Date', render: (r) => fmtDate(r.occurredDate) },
    { key: 'exceptionType', label: 'Type', render: (r) => r.exceptionType || '—' },
    { key: 'message', label: 'Message', render: (r) => <span title={r.message}>{r.message?.slice(0, 80)}{r.message?.length > 80 ? '…' : ''}</span> },
    { key: 'requestMethod', label: 'Méthode', render: (r) => r.requestMethod || '—' },
    { key: 'requestPath', label: 'Route', render: (r) => r.requestPath || '—' },
    { key: 'codeUser', label: 'Utilisateur', render: (r) => r.codeUser || '—' },
  ];

  const StatusPill = ({ ok }) => (
    <span className={`badge ${ok ? 'badge-success' : 'badge-danger'}`}>{ok ? 'OK' : 'INDISPONIBLE'}</span>
  );

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <div className="panel-title">System Health & Error Logs</div>
          <div className="panel-subtitle">État en direct de l'API et de la base de données, et journal des exceptions non gérées.</div>
        </div>
        <button className="btn btn-outline" onClick={load}>Actualiser</button>
      </div>

      {accessDenied ? (
        <div className="error-banner">Accès refusé — cette page est réservée aux administrateurs.</div>
      ) : (
        <>
      {health && (
        <div className="kpi-grid mb-4">
          <div className="kpi-card"><div className="kpi-label">API</div><div className="kpi-value"><StatusPill ok={health.apiStatus === 'OK'} /></div></div>
          <div className="kpi-card"><div className="kpi-label">Base de données</div><div className="kpi-value"><StatusPill ok={health.databaseStatus === 'OK'} /></div></div>
          <div className="kpi-card"><div className="kpi-label">Disponible depuis</div><div className="kpi-value">{fmtDuration(health.uptime)}</div></div>
          <div className="kpi-card"><div className="kpi-label">Sessions actives</div><div className="kpi-value">{health.activeSessions}</div></div>
          <div className="kpi-card"><div className="kpi-label">Erreurs (24h)</div><div className="kpi-value text-red-600">{health.errorsLast24h}</div></div>
          <div className="kpi-card"><div className="kpi-label">Heure serveur (UTC)</div><div className="kpi-value text-xs">{new Date(health.serverTimeUtc).toLocaleString('fr-FR')}</div></div>
        </div>
      )}

      <div className="toolbar">
        <ExportDropdown filename="ERROR_LOGS" columns={columns} rows={logs} />
      </div>

      <DataTable columns={columns} rows={logs} loading={loading} totalLabel={`ERREURS: ${logs.length}`} />
        </>
      )}
    </div>
  );
}
