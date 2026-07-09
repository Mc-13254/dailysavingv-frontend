import { useEffect, useState } from 'react';
import { Eye } from 'lucide-react';
import DataTable from '../components/DataTable';
import WideModal from '../components/WideModal';
import StatusBadge from '../components/StatusBadge';
import ExportDropdown from '../components/ExportDropdown';
import { ReportsAPI } from '../api/endpoints';

const fmtDate = (d) => d ? new Date(d).toLocaleString('fr-FR') : '—';

export default function AuditReports() {
  const [tab, setTab] = useState('trail'); // trail | logins
  const [rows, setRows] = useState([]);
  const [logins, setLogins] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [entityType, setEntityType] = useState('');
  const [status, setStatus] = useState('');
  const [detail, setDetail] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (entityType) params.entityType = entityType;
      if (status) params.status = status;
      const [{ data: trail }, { data: st }, { data: lg }] = await Promise.all([
        ReportsAPI.audit(params),
        ReportsAPI.auditStats(),
        ReportsAPI.loginHistory({}),
      ]);
      setRows(trail); setStats(st); setLogins(lg);
    } catch { setRows([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line

  const openDetail = async (row) => {
    const { data } = await ReportsAPI.auditDetail(row.entityType, row.pendingID);
    setDetail(data);
  };

  const trailColumns = [
    { key: 'entityType', label: 'Module' },
    { key: 'label', label: 'Élément', render: (r) => r.label || `#${r.pendingID}` },
    { key: 'actionType', label: 'Action' },
    { key: 'requestUser', label: 'Demandé par' },
    { key: 'requestDate', label: 'Date demande', render: (r) => fmtDate(r.requestDate) },
    { key: 'validationUser', label: 'Traité par', render: (r) => r.validationUser || '—' },
    { key: 'pendingStatus', label: 'Statut', render: (r) => <StatusBadge status={r.pendingStatus} /> },
    { key: 'actions', label: 'Actions', sortable: false, render: (r) => <button className="btn-icon" onClick={() => openDetail(r)}><Eye size={15} /></button> },
  ];

  const loginColumns = [
    { key: 'codeUser', label: 'Utilisateur', render: (r) => r.codeUser || '—' },
    { key: 'action', label: 'Action' },
    { key: 'description', label: 'Description', render: (r) => r.description || '—' },
    { key: 'adresseIP', label: 'Adresse IP', render: (r) => r.adresseIP || '—' },
    { key: 'dateAction', label: 'Date', render: (r) => fmtDate(r.dateAction) },
  ];

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <div className="panel-title">Audit Reports</div>
          <div className="panel-subtitle">Piste d'audit Maker-Checker (créations/modifications/suppressions demandées et validées) + historique de connexion.</div>
        </div>
      </div>

      {stats && (
        <div className="kpi-grid mb-4">
          <div className="kpi-card"><div className="kpi-label">Aujourd'hui</div><div className="kpi-value">{stats.todayEvents}</div></div>
          <div className="kpi-card"><div className="kpi-label">Créations</div><div className="kpi-value">{stats.createCount}</div></div>
          <div className="kpi-card"><div className="kpi-label">Modifications</div><div className="kpi-value">{stats.updateCount}</div></div>
          <div className="kpi-card"><div className="kpi-label">Suppressions</div><div className="kpi-value">{stats.deleteCount}</div></div>
          <div className="kpi-card"><div className="kpi-label">Approuvées</div><div className="kpi-value text-emerald-600">{stats.approvedCount}</div></div>
          <div className="kpi-card"><div className="kpi-label">Rejetées</div><div className="kpi-value text-red-600">{stats.rejectedCount}</div></div>
          <div className="kpi-card"><div className="kpi-label">En attente</div><div className="kpi-value">{stats.pendingCount}</div></div>
        </div>
      )}

      <div className="toggle-group mb-3">
        <button className={`toggle-btn${tab === 'trail' ? ' active' : ''}`} onClick={() => setTab('trail')}>Piste d'audit (Maker-Checker)</button>
        <button className={`toggle-btn${tab === 'logins' ? ' active' : ''}`} onClick={() => setTab('logins')}>Historique de connexion</button>
      </div>

      {tab === 'trail' ? (
        <>
          <div className="toolbar flex-wrap gap-2">
            <select value={entityType} onChange={(e) => setEntityType(e.target.value)}>
              <option value="">Tous les modules</option>
              {['Users', 'Collectors', 'Clients', 'Accounts', 'Contracts', 'CommissionTypes', 'CommissionRanges', 'Agencies', 'Roles', 'Departments', 'ContractTypes', 'IMF'].map((e) => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">Tous les statuts</option>
              <option value="PENDING">En attente</option>
              <option value="APPROVED">Approuvé</option>
              <option value="REJECTED">Rejeté</option>
            </select>
            <button className="btn btn-outline" onClick={load}>Filtrer</button>
            <ExportDropdown filename="AUDIT_TRAIL" columns={trailColumns.filter((c) => c.key !== 'actions')} rows={rows} />
          </div>
          <DataTable columns={trailColumns} rows={rows} loading={loading} totalLabel={`TOTAL: ${rows.length}`} />
        </>
      ) : (
        <>
          <div className="toolbar">
            <ExportDropdown filename="LOGIN_HISTORY" columns={loginColumns} rows={logins} />
          </div>
          <DataTable columns={loginColumns} rows={logins} loading={loading} totalLabel={`TOTAL: ${logins.length}`} />
        </>
      )}

      {detail && (
        <WideModal title={`${detail.entityType} #${detail.pendingID} — ${detail.actionType}`} onClose={() => setDetail(null)}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="form-card">
              <div className="form-card-title">Demande</div>
              <p className="text-xs normal-case space-y-1">
                <div>Demandé par: {detail.requestUser}</div>
                <div>Le: {fmtDate(detail.requestDate)}</div>
                <div>Statut: <StatusBadge status={detail.pendingStatus} /></div>
                {detail.validationUser && <div>Traité par: {detail.validationUser} le {fmtDate(detail.validationDate)}</div>}
                {detail.rejectionReason && <div>Motif de rejet: {detail.rejectionReason}</div>}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="form-card">
              <div className="form-card-title">Avant</div>
              <pre className="text-[10px] normal-case whitespace-pre-wrap break-all bg-gray-50 p-2 rounded">{detail.previousDataJson ? JSON.stringify(JSON.parse(detail.previousDataJson), null, 2) : '—'}</pre>
            </div>
            <div className="form-card">
              <div className="form-card-title">Après / Demandé</div>
              <pre className="text-[10px] normal-case whitespace-pre-wrap break-all bg-gray-50 p-2 rounded">{detail.newDataJson ? JSON.stringify(JSON.parse(detail.newDataJson), null, 2) : '—'}</pre>
            </div>
          </div>
        </WideModal>
      )}
    </div>
  );
}
