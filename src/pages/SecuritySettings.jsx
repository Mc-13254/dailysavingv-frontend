import { useEffect, useState } from 'react';
import { Copy, Ban } from 'lucide-react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { SecurityAPI } from '../api/endpoints';

const fmtDate = (d) => d ? new Date(d).toLocaleString('fr-FR') : '—';

export default function SecuritySettings() {
  const [tab, setTab] = useState('policy'); // policy | apikeys
  const [policy, setPolicy] = useState(null);
  const [keys, setKeys] = useState([]);
  const [notice, setNotice] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyDesc, setNewKeyDesc] = useState('');
  const [createdKey, setCreatedKey] = useState(null);

  const loadPolicy = () => SecurityAPI.passwordPolicy().then(({ data }) => setPolicy(data));
  const loadKeys = () => SecurityAPI.apiKeys().then(({ data }) => setKeys(data));

  useEffect(() => { loadPolicy(); loadKeys(); }, []);

  const savePolicy = async () => {
    await SecurityAPI.savePasswordPolicy(policy);
    setNotice('Politique de mot de passe enregistrée.');
    setTimeout(() => setNotice(''), 3000);
  };

  const createKey = async () => {
    const { data } = await SecurityAPI.createApiKey({ name: newKeyName, description: newKeyDesc || null, expiryDate: null });
    setCreatedKey(data.fullKey);
    setShowCreate(false);
    setNewKeyName(''); setNewKeyDesc('');
    loadKeys();
  };

  const revokeKey = async (id) => {
    if (!window.confirm('Révoquer cette clé API ? Cette action est irréversible.')) return;
    await SecurityAPI.revokeApiKey(id);
    loadKeys();
  };

  const keyColumns = [
    { key: 'name', label: 'Nom' },
    { key: 'keyPrefix', label: 'Clé (préfixe)' },
    { key: 'description', label: 'Description', render: (r) => r.description || '—' },
    { key: 'createdBy', label: 'Créée par' },
    { key: 'createdDate', label: 'Créée le', render: (r) => fmtDate(r.createdDate) },
    { key: 'lastUsedDate', label: 'Dernière utilisation', render: (r) => fmtDate(r.lastUsedDate) },
    { key: 'isActive', label: 'Statut', render: (r) => r.isActive ? <span className="badge badge-success">Active</span> : <span className="badge badge-danger">Révoquée</span> },
    {
      key: 'actions', label: 'Actions', sortable: false, render: (r) => r.isActive ? (
        <button className="btn-icon text-red-500" title="Révoquer" onClick={() => revokeKey(r.apiKeyID)}><Ban size={15} /></button>
      ) : null
    },
  ];

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <div className="panel-title">Security Settings</div>
          <div className="panel-subtitle">Politique de mot de passe applicable à tous les utilisateurs, et gestion des clés API.</div>
        </div>
      </div>

      {notice && <div className="mb-3 text-xs text-green-700 bg-green-50 px-3 py-2 rounded normal-case">{notice}</div>}

      <div className="toggle-group mb-4">
        <button className={`toggle-btn${tab === 'policy' ? ' active' : ''}`} onClick={() => setTab('policy')}>Password Policy</button>
        <button className={`toggle-btn${tab === 'apikeys' ? ' active' : ''}`} onClick={() => setTab('apikeys')}>API Management</button>
      </div>

      {tab === 'policy' && policy && (
        <div className="form-card" style={{ maxWidth: 560 }}>
          <div className="form-card-title">Complexité du mot de passe</div>
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div className="form-group">
              <label>Longueur minimale</label>
              <input type="number" value={policy.minimumLength} onChange={(e) => setPolicy({ ...policy, minimumLength: Number(e.target.value) })} />
            </div>
            <div className="form-group">
              <label>Longueur maximale</label>
              <input type="number" value={policy.maximumLength} onChange={(e) => setPolicy({ ...policy, maximumLength: Number(e.target.value) })} />
            </div>
          </div>
          {[
            ['requireUppercase', 'Majuscule requise'],
            ['requireLowercase', 'Minuscule requise'],
            ['requireNumber', 'Chiffre requis'],
            ['requireSpecialCharacter', 'Caractère spécial requis'],
          ].map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 text-sm mt-2">
              <input type="checkbox" checked={policy[key]} onChange={(e) => setPolicy({ ...policy, [key]: e.target.checked })} />
              {label}
            </label>
          ))}
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div className="form-group">
              <label>Expiration (jours, 0 = jamais)</label>
              <input type="number" value={policy.passwordExpirationDays} onChange={(e) => setPolicy({ ...policy, passwordExpirationDays: Number(e.target.value) })} />
            </div>
            <div className="form-group">
              <label>Historique (mots de passe bloqués)</label>
              <input type="number" value={policy.passwordHistoryCount} onChange={(e) => setPolicy({ ...policy, passwordHistoryCount: Number(e.target.value) })} />
            </div>
          </div>
          <button className="btn btn-primary mt-3" onClick={savePolicy}>Enregistrer la politique</button>
        </div>
      )}

      {tab === 'apikeys' && (
        <>
          <div className="toolbar">
            <button className="btn btn-primary" onClick={() => { setCreatedKey(null); setShowCreate(true); }}>+ Nouvelle clé API</button>
          </div>
          <DataTable columns={keyColumns} rows={keys} loading={false} totalLabel={`TOTAL: ${keys.length}`} />
        </>
      )}

      {showCreate && (
        <Modal title="Nouvelle clé API" onClose={() => setShowCreate(false)} footer={
          <>
            <button className="btn btn-outline" onClick={() => setShowCreate(false)}>Annuler</button>
            <button className="btn btn-primary" onClick={createKey} disabled={!newKeyName}>Générer</button>
          </>
        }>
          <div className="form-group"><label>Nom *</label><input value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} /></div>
          <div className="form-group"><label>Description</label><input value={newKeyDesc} onChange={(e) => setNewKeyDesc(e.target.value)} /></div>
        </Modal>
      )}

      {createdKey && (
        <Modal title="Clé API générée" onClose={() => setCreatedKey(null)} footer={
          <button className="btn btn-primary" onClick={() => setCreatedKey(null)}>J'ai copié la clé</button>
        }>
          <p className="text-xs text-red-600 normal-case mb-2">Cette clé ne sera plus jamais affichée. Copiez-la maintenant.</p>
          <div className="flex items-center gap-2 bg-gray-50 p-2 rounded">
            <code className="text-xs break-all flex-1">{createdKey}</code>
            <button className="btn-icon" onClick={() => navigator.clipboard.writeText(createdKey)}><Copy size={15} /></button>
          </div>
        </Modal>
      )}
    </div>
  );
}
