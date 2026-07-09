import { useEffect, useState } from 'react';
import { Unlock, Lock } from 'lucide-react';
import DataTable from '../components/DataTable';
import ExportDropdown from '../components/ExportDropdown';
import { SecurityAPI } from '../api/endpoints';

const fmtDate = (d) => d ? new Date(d).toLocaleString('fr-FR') : '—';

const RISK_COLORS = {
  LOW: 'badge-success', MEDIUM: 'badge-warning', HIGH: 'badge-danger', CRITICAL: 'badge-danger',
};

const REASON_LABELS = {
  UNKNOWN_USERNAME: "Nom d'utilisateur inconnu",
  WRONG_PASSWORD: 'Mot de passe incorrect',
  LOCKED_ACCOUNT: 'Compte verrouillé',
  INACTIVE_ACCOUNT: 'Compte inactif',
};

export default function FailedLoginAttempts() {
  const [tab, setTab] = useState('attempts'); // attempts | locked
  const [rows, setRows] = useState([]);
  const [locked, setLocked] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const params = username ? { username } : {};
      const [{ data: attempts }, { data: st }, { data: lk }] = await Promise.all([
        SecurityAPI.failedLogins(params),
        SecurityAPI.failedLoginStats(),
        SecurityAPI.lockedAccounts(),
      ]);
      setRows(attempts); setStats(st); setLocked(lk);
    } catch { setRows([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line

  const unlock = async (codeUser) => {
    if (!window.confirm(`Déverrouiller le compte ${codeUser} ?`)) return;
    await SecurityAPI.unlockAccount(codeUser);
    load();
  };

  const attemptColumns = [
    { key: 'attemptDate', label: 'Date', render: (r) => fmtDate(r.attemptDate) },
    { key: 'username', label: "Nom d'utilisateur" },
    { key: 'fullName', label: 'Nom complet', render: (r) => r.fullName || '—' },
    { key: 'failureReason', label: 'Motif', render: (r) => REASON_LABELS[r.failureReason] || r.failureReason },
    { key: 'riskLevel', label: 'Risque', render: (r) => <span className={`badge ${RISK_COLORS[r.riskLevel] || ''}`}>{r.riskLevel}</span> },
    { key: 'ipAddress', label: 'Adresse IP', render: (r) => r.ipAddress || '—' },
  ];

  const lockedColumns = [
    { key: 'codeUser', label: 'Code' },
    { key: 'username', label: "Nom d'utilisateur" },
    { key: 'fullName', label: 'Nom complet' },
    { key: 'roleCode', label: 'Rôle', render: (r) => r.roleCode || '—' },
    { key: 'agenceNom', label: 'Agence', render: (r) => r.agenceNom || '—' },
    { key: 'failedLoginAttempts', label: 'Échecs' },
    { key: 'lockReason', label: 'Motif', render: (r) => r.lockReason || '—' },
    { key: 'lockedDate', label: 'Verrouillé le', render: (r) => fmtDate(r.lockedDate) },
    {
      key: 'actions', label: 'Actions', sortable: false, render: (r) => (
        <button className="btn btn-primary btn-sm" onClick={() => unlock(r.codeUser)}><Unlock size={13} /> Déverrouiller</button>
      )
    },
  ];

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <div className="panel-title">Failed Login Attempts & Account Lockout</div>
          <div className="panel-subtitle">Détection des tentatives suspectes et gestion des comptes verrouillés (5 échecs consécutifs = verrouillage automatique).</div>
        </div>
      </div>

      {stats && (
        <div className="kpi-grid mb-4">
          <div className="kpi-card"><div className="kpi-label">Aujourd'hui</div><div className="kpi-value">{stats.today}</div></div>
          <div className="kpi-card"><div className="kpi-label">Cette semaine</div><div className="kpi-value">{stats.thisWeek}</div></div>
          <div className="kpi-card"><div className="kpi-label">Ce mois</div><div className="kpi-value">{stats.thisMonth}</div></div>
          <div className="kpi-card"><div className="kpi-label">Comptes verrouillés</div><div className="kpi-value text-red-600">{stats.lockedAccounts}</div></div>
          <div className="kpi-card"><div className="kpi-label">Tentatives à haut risque</div><div className="kpi-value text-amber-600">{stats.highRiskAttempts}</div></div>
        </div>
      )}

      <div className="toggle-group mb-3">
        <button className={`toggle-btn${tab === 'attempts' ? ' active' : ''}`} onClick={() => setTab('attempts')}>Tentatives échouées</button>
        <button className={`toggle-btn${tab === 'locked' ? ' active' : ''}`} onClick={() => setTab('locked')}><Lock size={13} /> Comptes verrouillés ({locked.length})</button>
      </div>

      {tab === 'attempts' ? (
        <>
          <div className="toolbar flex-wrap gap-2">
            <input className="search-input" placeholder="Nom d'utilisateur…" value={username} onChange={(e) => setUsername(e.target.value)} />
            <button className="btn btn-outline" onClick={load}>Filtrer</button>
            <ExportDropdown filename="FAILED_LOGIN_ATTEMPTS" columns={attemptColumns} rows={rows} />
          </div>
          <DataTable columns={attemptColumns} rows={rows} loading={loading} totalLabel={`TOTAL: ${rows.length}`} />
        </>
      ) : (
        <DataTable columns={lockedColumns} rows={locked} loading={loading} totalLabel={`VERROUILLÉS: ${locked.length}`} />
      )}
    </div>
  );
}
