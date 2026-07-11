import { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { CollectorAPI, ClientAPI, CommissionAPI, AgencyAPI, AccountAPI, ContractAPI, IMFAPI, UserAPI, RoleAPI, DepartmentAPI, ContractTypeAPI, AuthAPI, TransactionAPI } from '../api/endpoints';

// Every Tmp/draft record has a different shape depending on the module, so a
// single "label" extractor tries the field names that actually carry a
// human-readable identity for that record, in priority order. Without this,
// the queue only shows a bare Pending ID, which makes it impossible to know
// what's actually being approved.
function getLabel(module, r) {
  switch (module) {
    case 'clients':
      return [r.nom, r.prenom].filter(Boolean).join(' ') || r.numeroCNI || '—';
    case 'collectors':
      return [r.name, r.surname].filter(Boolean).join(' ') || r.codeUser || '—';
    case 'users':
      return [r.firstName, r.lastName].filter(Boolean).join(' ') || r.username || '—';
    case 'contracts':
      return [r.contractNumber, r.clientID && `(Client ${r.clientID})`].filter(Boolean).join(' ') || '—';
    case 'accounts':
      return [r.clientID && `Client ${r.clientID}`, r.accountType].filter(Boolean).join(' — ') || '—';
    case 'agencies':
      return r.nom || r.codeAgence || '—';
    case 'imf':
      return r.libelle || r.targetCodeIMF || '—';
    case 'roles':
      return r.libelle || r.code || '—';
    case 'departments':
      return r.departmentName || r.shortName || '—';
    case 'contractTypes':
      return r.contractName || r.shortName || '—';
    case 'commissionRanges':
      return r.description || (r.inf != null && r.sup != null ? `${r.inf} — ${r.sup}` : '—');
    case 'transactionImports':
      return `${r.transactionType} — ${r.accountID}${r.toAccountID ? ' → ' + r.toAccountID : ''} — ${r.montant?.toLocaleString('fr-FR')}${r.refRowLabel ? ` (${r.refRowLabel})` : ''}`;
    default:
      return '—';
  }
}

export default function ValidationQueue() {
  const [module, setModule] = useState('collectors');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const [confirming, setConfirming] = useState(null); // { pendingId } while password modal is open
  const [password, setPassword] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [verifying, setVerifying] = useState(false);

  const loaders = {
    collectors: () => CollectorAPI.pending(),
    clients: () => ClientAPI.pending(),
    commissionRanges: () => CommissionAPI.pendingRanges(),
    agencies: () => AgencyAPI.pending(),
    accounts: () => AccountAPI.pending(),
    contracts: () => ContractAPI.pending(),
    imf: () => IMFAPI.pending(),
    users: () => UserAPI.pending(),
    roles: () => RoleAPI.pending(),
    departments: () => DepartmentAPI.pending(),
    contractTypes: () => ContractTypeAPI.pending(),
    transactionImports: async () => {
      const res = await TransactionAPI.pendingImportRows();
      // Import rows use rowID/no requestUser-requestDate pair; normalize to the
      // shape the shared table/columns expect.
      return { data: res.data.map((r) => ({ ...r, pendingID: r.rowID, actionType: 'IMPORT', requestUser: '—', requestDate: null })) };
    },
  };

  const approvers = {
    collectors: (id) => CollectorAPI.approve(id),
    clients: (id) => ClientAPI.approve(id),
    commissionRanges: (id) => CommissionAPI.approveRange(id),
    agencies: (id) => AgencyAPI.approve(id),
    accounts: (id) => AccountAPI.approve(id),
    contracts: (id) => ContractAPI.approve(id),
    imf: (id) => IMFAPI.approve(id),
    users: (id) => UserAPI.approve(id),
    roles: (id) => RoleAPI.approve(id),
    departments: (id) => DepartmentAPI.approve(id),
    contractTypes: (id) => ContractTypeAPI.approve(id),
    transactionImports: (id) => TransactionAPI.approveImportRow(id),
  };

  const rejecters = {
    collectors: (id, reason) => CollectorAPI.reject(id, reason),
    clients: (id, reason) => ClientAPI.reject(id, reason),
    commissionRanges: (id, reason) => CommissionAPI.rejectRange(id, reason),
    agencies: (id, reason) => AgencyAPI.reject(id, reason),
    accounts: (id, reason) => AccountAPI.reject(id, reason),
    contracts: (id, reason) => ContractAPI.reject(id, reason),
    imf: (id, reason) => IMFAPI.reject(id, reason),
    users: (id, reason) => UserAPI.reject(id, reason),
    roles: (id, reason) => RoleAPI.reject(id, reason),
    departments: (id, reason) => DepartmentAPI.reject(id, reason),
    contractTypes: (id, reason) => ContractTypeAPI.reject(id, reason),
    transactionImports: (id, reason) => TransactionAPI.rejectImportRow(id, reason),
  };

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await loaders[module]();
      setRows(data);
    } catch { setRows([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [module]);

  // Step 1: user clicks "Valider" -> just opens the password confirmation popup.
  const askApprove = (pendingId) => {
    setConfirming(pendingId);
    setPassword('');
    setConfirmError('');
  };

  // Step 2: user confirms with their own password -> verify, then actually approve.
  const confirmApprove = async () => {
    if (!password) { setConfirmError('Veuillez saisir votre mot de passe.'); return; }
    setVerifying(true);
    setConfirmError('');
    try {
      await AuthAPI.verifyPassword(password);
      await approvers[module](confirming);
      setConfirming(null);
      load();
    } catch (err) {
      setConfirmError(err.response?.data?.message || 'Mot de passe incorrect.');
    } finally {
      setVerifying(false);
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt('Motif du rejet ?') || 'Non spécifié';
    try {
      await rejecters[module](id, reason);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors du rejet.');
    }
  };

  const columns = [
    { key: 'pendingID', label: 'ID' },
    { key: 'label', label: 'Ce qui est validé', render: (r) => <strong className="normal-case">{getLabel(module, r)}</strong> },
    { key: 'actionType', label: 'Action' },
    { key: 'requestUser', label: 'Demandé par' },
    { key: 'requestDate', label: 'Date de demande', render: (r) => r.requestDate ? new Date(r.requestDate).toLocaleString('fr-FR') : '—' },
    {
      key: 'actions', label: 'Actions', render: (r) => (
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn btn-primary btn-sm" onClick={() => askApprove(r.pendingID)}>Valider</button>
          <button className="btn btn-danger btn-sm" onClick={() => handleReject(r.pendingID)}>Rejeter</button>
        </div>
      )
    },
  ];

  const MODULES = [
    ['collectors', 'Collecteurs'], ['clients', 'Clients'], ['commissionRanges', 'Commission Ranges'],
    ['agencies', 'Agences'], ['accounts', 'Comptes'], ['contracts', 'Contrats'],
    ['imf', 'IMF'], ['users', 'Utilisateurs'], ['roles', 'Rôles'], ['departments', 'Départements'], ['contractTypes', 'Types de Contrat'],
    ['transactionImports', 'Imports de transactions'],
  ];

  const confirmingRow = rows.find((r) => r.pendingID === confirming);

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <div className="panel-title">File d'attente de validation (Maker-Checker)</div>
          <div className="panel-subtitle">Toute création, modification ou suppression passe ici avant d'atteindre la production.</div>
        </div>
      </div>

      <div className="toolbar">
        <div className="toggle-group" style={{ flexWrap: 'wrap' }}>
          {MODULES.map(([key, label]) => (
            <button key={key} className={`toggle-btn${module === key ? ' active' : ''}`} onClick={() => setModule(key)}>{label}</button>
          ))}
        </div>
      </div>

      <DataTable columns={columns} rows={rows} loading={loading} totalLabel={`EN ATTENTE: ${rows.length}`} />

      {confirming != null && (
        <Modal
          title="Confirmer votre identité"
          onClose={() => setConfirming(null)}
          footer={
            <>
              <button className="btn btn-outline" onClick={() => setConfirming(null)}>Annuler</button>
              <button className="btn btn-primary" disabled={verifying} onClick={confirmApprove}>
                <ShieldCheck size={14} /> {verifying ? 'Vérification…' : 'Confirmer et valider'}
              </button>
            </>
          }
        >
          <p className="text-xs text-gray-600 normal-case mb-3">
            Vous êtes sur le point de valider : <strong>{confirmingRow ? getLabel(module, confirmingRow) : `#${confirming}`}</strong>.
            Par mesure de sécurité, saisissez votre mot de passe pour confirmer.
          </p>
          {confirmError && <div className="error-banner">{confirmError}</div>}
          <div className="form-group">
            <label>Votre mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && confirmApprove()}
              autoFocus
            />
          </div>
        </Modal>
      )}
    </div>
  );
}
