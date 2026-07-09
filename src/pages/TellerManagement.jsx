import { useEffect, useState } from 'react';
import { Check, X, Vault as VaultIcon } from 'lucide-react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import ExportDropdown from '../components/ExportDropdown';
import { TellerAPI } from '../api/endpoints';

const fmt = (n) => new Intl.NumberFormat('fr-FR').format(n || 0);
const fmtDate = (d) => d ? new Date(d).toLocaleString('fr-FR') : '—';

const TYPE_LABELS = { SUPPLY: 'Approvisionnement (Coffre → Caissier)', RETURN: 'Retour (Caissier → Coffre)', TRANSFER: 'Transfert (Caissier → Caissier)' };

export default function TellerManagement() {
  const [vault, setVault] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');

  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ movementType: 'SUPPLY', fromCodeUser: '', toCodeUser: '', amount: '', reason: '' });
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [{ data: v }, { data: dash }, { data: mv }] = await Promise.all([
        TellerAPI.vault(), TellerAPI.dashboard(), TellerAPI.movements(status ? { status } : {}),
      ]);
      setVault(v); setDashboard(dash); setMovements(mv);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line
  useEffect(() => { TellerAPI.movements(status ? { status } : {}).then(({ data }) => setMovements(data)); }, [status]);

  const submit = async () => {
    setError('');
    try {
      await TellerAPI.requestMovement({
        movementType: form.movementType,
        fromCodeUser: form.movementType !== 'SUPPLY' ? form.fromCodeUser : null,
        toCodeUser: form.movementType !== 'RETURN' ? form.toCodeUser : null,
        amount: Number(form.amount),
        reason: form.reason || null,
      });
      setShowNew(false);
      load();
    } catch (err) {
      setError(err?.response?.data?.message || 'Échec de la soumission.');
    }
  };

  const approve = async (row) => { await TellerAPI.approveMovement(row.cashMovementID); load(); };
  const reject = async (row) => {
    const reason = window.prompt('Motif du rejet ?');
    if (!reason) return;
    await TellerAPI.rejectMovement(row.cashMovementID, reason);
    load();
  };

  const columns = [
    { key: 'movementNumber', label: 'N°' },
    { key: 'movementType', label: 'Type', render: (r) => TYPE_LABELS[r.movementType] || r.movementType },
    { key: 'fromUserName', label: 'De' },
    { key: 'toUserName', label: 'Vers' },
    { key: 'amount', label: 'Montant', render: (r) => fmt(r.amount) },
    { key: 'reason', label: 'Motif', render: (r) => r.reason || '—' },
    { key: 'status', label: 'Statut', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'requestDate', label: 'Demandé le', render: (r) => fmtDate(r.requestDate) },
    {
      key: 'actions', label: 'Actions', sortable: false, render: (r) => r.status === 'PENDING' ? (
        <div className="flex items-center gap-1">
          <button className="btn btn-primary btn-sm" onClick={() => approve(r)}><Check size={13} /></button>
          <button className="btn btn-danger btn-sm" onClick={() => reject(r)}><X size={13} /></button>
        </div>
      ) : null
    },
  ];

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <div className="panel-title">Teller Management</div>
          <div className="panel-subtitle">Coffre de l'agence et mouvements de caisse entre le coffre et les caissiers/collecteurs.</div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div className="form-card flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-blue-50 text-brand-blue flex items-center justify-center"><VaultIcon size={22} /></div>
          <div>
            <div className="text-xs text-gray-400">Solde du coffre — {vault?.agenceNom}</div>
            <div className="text-2xl font-bold">{vault ? fmt(vault.balance) : '—'}</div>
          </div>
        </div>
        {dashboard && (
          <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
            <div className="kpi-card"><div className="kpi-label">En attente</div><div className="kpi-value">{dashboard.pendingMovements}</div></div>
            <div className="kpi-card"><div className="kpi-label">Approvisionné (jour)</div><div className="kpi-value">{fmt(dashboard.suppliedToday)}</div></div>
            <div className="kpi-card"><div className="kpi-label">Retourné (jour)</div><div className="kpi-value">{fmt(dashboard.returnedToday)}</div></div>
            <div className="kpi-card"><div className="kpi-label">Transféré (jour)</div><div className="kpi-value">{fmt(dashboard.transferredToday)}</div></div>
          </div>
        )}
      </div>

      <div className="toolbar flex-wrap gap-2">
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Tous les statuts</option>
          <option value="PENDING">En attente</option>
          <option value="COMPLETED">Complété</option>
          <option value="REJECTED">Rejeté</option>
        </select>
        <button className="btn btn-primary" onClick={() => { setForm({ movementType: 'SUPPLY', fromCodeUser: '', toCodeUser: '', amount: '', reason: '' }); setError(''); setShowNew(true); }}>+ Nouveau mouvement</button>
        <ExportDropdown filename="CASH_MOVEMENTS" columns={columns.filter((c) => c.key !== 'actions')} rows={movements} />
      </div>

      <DataTable columns={columns} rows={movements} loading={loading} totalLabel={`TOTAL: ${movements.length}`} />

      {showNew && (
        <Modal title="Nouveau mouvement de caisse" onClose={() => setShowNew(false)} footer={
          <>
            <button className="btn btn-outline" onClick={() => setShowNew(false)}>Annuler</button>
            <button className="btn btn-primary" onClick={submit} disabled={!form.amount}>Soumettre</button>
          </>
        }>
          {error && <div className="error-banner mb-2">{error}</div>}
          <div className="form-group">
            <label>Type de mouvement</label>
            <select value={form.movementType} onChange={(e) => setForm({ ...form, movementType: e.target.value })}>
              <option value="SUPPLY">Approvisionnement (Coffre → Caissier)</option>
              <option value="RETURN">Retour (Caissier → Coffre)</option>
              <option value="TRANSFER">Transfert (Caissier → Caissier)</option>
            </select>
          </div>
          {form.movementType !== 'SUPPLY' && (
            <div className="form-group"><label>Code caissier source</label><input value={form.fromCodeUser} onChange={(e) => setForm({ ...form, fromCodeUser: e.target.value })} placeholder="ex: U-005" /></div>
          )}
          {form.movementType !== 'RETURN' && (
            <div className="form-group"><label>Code caissier destination</label><input value={form.toCodeUser} onChange={(e) => setForm({ ...form, toCodeUser: e.target.value })} placeholder="ex: U-007" /></div>
          )}
          <div className="form-group"><label>Montant</label><input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
          <div className="form-group"><label>Motif</label><input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></div>
        </Modal>
      )}
    </div>
  );
}
