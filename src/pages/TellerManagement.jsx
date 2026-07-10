import { useEffect, useState } from 'react';
import { Check, X, Vault as VaultIcon } from 'lucide-react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import ExportDropdown from '../components/ExportDropdown';
import { TellerAPI, UserAPI, AuthAPI } from '../api/endpoints';

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
  const [cashiers, setCashiers] = useState([]);

  const [confirming, setConfirming] = useState(null); // row pending password confirmation
  const [password, setPassword] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    UserAPI.list().then(({ data }) => setCashiers(data.filter((u) => (u.roleCode || '').toUpperCase().includes('CASHIER')))).catch(() => {});
  }, []);

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

  const askApprove = (row) => { setConfirming(row); setPassword(''); setConfirmError(''); };

  const confirmApprove = async () => {
    if (!password) { setConfirmError('Veuillez saisir votre mot de passe.'); return; }
    setVerifying(true);
    setConfirmError('');
    try {
      await AuthAPI.verifyPassword(password);
      await TellerAPI.approveMovement(confirming.cashMovementID);
      setConfirming(null);
      load();
    } catch (err) {
      setConfirmError(err?.response?.data?.message || 'Mot de passe incorrect.');
    } finally {
      setVerifying(false);
    }
  };
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
          <button className="btn btn-primary btn-sm" onClick={() => askApprove(r)}><Check size={13} /></button>
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
            <div className="toggle-group">
              <button type="button" className={`toggle-btn${form.movementType === 'SUPPLY' ? ' active' : ''}`} onClick={() => setForm({ ...form, movementType: 'SUPPLY' })}>Approvisionnement</button>
              <button type="button" className={`toggle-btn${form.movementType === 'RETURN' ? ' active' : ''}`} onClick={() => setForm({ ...form, movementType: 'RETURN' })}>Retour</button>
              <button type="button" className={`toggle-btn${form.movementType === 'TRANSFER' ? ' active' : ''}`} onClick={() => setForm({ ...form, movementType: 'TRANSFER' })}>Transfert</button>
            </div>
            <p className="text-[11px] text-gray-400 normal-case mt-1">
              {form.movementType === 'SUPPLY' && 'Le coffre remet des espèces à un caissier.'}
              {form.movementType === 'RETURN' && 'Un caissier remet des espèces au coffre.'}
              {form.movementType === 'TRANSFER' && "Un caissier remet des espèces à un autre caissier."}
            </p>
          </div>
          {form.movementType !== 'SUPPLY' && (
            <div className="form-group">
              <label>Caissier source</label>
              <select value={form.fromCodeUser} onChange={(e) => setForm({ ...form, fromCodeUser: e.target.value })}>
                <option value="">— Sélectionner —</option>
                {cashiers.map((u) => <option key={u.codeUser} value={u.codeUser}>{u.codeUser} — {u.firstName} {u.lastName}</option>)}
              </select>
            </div>
          )}
          {form.movementType !== 'RETURN' && (
            <div className="form-group">
              <label>Caissier destination</label>
              <select value={form.toCodeUser} onChange={(e) => setForm({ ...form, toCodeUser: e.target.value })}>
                <option value="">— Sélectionner —</option>
                {cashiers.map((u) => <option key={u.codeUser} value={u.codeUser}>{u.codeUser} — {u.firstName} {u.lastName}</option>)}
              </select>
            </div>
          )}
          <div className="form-group"><label>Montant</label><input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
          <div className="form-group"><label>Motif</label><input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></div>
        </Modal>
      )}

      {confirming && (
        <Modal
          title="Confirmer votre identité"
          onClose={() => setConfirming(null)}
          footer={
            <>
              <button className="btn btn-outline" onClick={() => setConfirming(null)}>Annuler</button>
              <button className="btn btn-primary" disabled={verifying} onClick={confirmApprove}>{verifying ? 'Vérification…' : 'Confirmer et approuver'}</button>
            </>
          }
        >
          <p className="text-xs text-gray-600 normal-case mb-3">
            Vous êtes sur le point d'approuver le mouvement <strong>{confirming.movementNumber}</strong> ({TYPE_LABELS[confirming.movementType]}, {fmt(confirming.amount)}).
            Par mesure de sécurité, saisissez votre mot de passe.
          </p>
          {confirmError && <div className="error-banner mb-2">{confirmError}</div>}
          <div className="form-group">
            <label>Votre mot de passe</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && confirmApprove()} autoFocus />
          </div>
        </Modal>
      )}
    </div>
  );
}
