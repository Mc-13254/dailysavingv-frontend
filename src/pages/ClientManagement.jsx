import { useEffect, useState } from 'react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import { ClientAPI } from '../api/endpoints';

const emptyForm = { nom: '', prenom: '', sexe: '', phoneNumber: '', address: '', email: '', companyName: '', clientType: 'INDIVIDUAL', numeroCNI: '' };

export default function ClientManagement() {
  const [tab, setTab] = useState('validated');
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState([]);
  const [pendingRows, setPendingRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [{ data: list }, { data: pend }] = await Promise.all([
        ClientAPI.list(search),
        ClientAPI.pending().catch(() => ({ data: [] })),
      ]);
      setRows(list);
      setPendingRows(pend);
    } finally { setLoading(false); }
  };

  useEffect(() => { loadAll(); }, [search]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await ClientAPI.create(form);
      setShowModal(false);
      setForm(emptyForm);
      loadAll();
    } finally { setSubmitting(false); }
  };

  const handleApprove = async (id) => { await ClientAPI.approve(id); loadAll(); };
  const handleReject = async (id) => {
    const reason = window.prompt('Motif du rejet ?') || 'Non spécifié';
    await ClientAPI.reject(id, reason);
    loadAll();
  };

  const validatedColumns = [
    { key: 'clientID', label: 'ClientID' },
    { key: 'nom', label: 'Nom' },
    { key: 'prenom', label: 'Prenom' },
    { key: 'phoneNumber', label: 'PhoneNumber' },
    { key: 'email', label: 'Email' },
    { key: 'clientType', label: 'ClientType' },
    { key: 'validationStatus', label: 'ClientStatus', render: (r) => <StatusBadge status={r.validationStatus} /> },
  ];

  const pendingColumns = [
    { key: 'pendingID', label: 'Pending ID' },
    { key: 'actionType', label: 'Action' },
    { key: 'nom', label: 'Nom' },
    { key: 'requestUser', label: 'Demandé par' },
    { key: 'requestDate', label: 'Date', render: (r) => new Date(r.requestDate).toLocaleString('fr-FR') },
    {
      key: 'actions', label: 'Actions', render: (r) => (
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn btn-primary btn-sm" onClick={() => handleApprove(r.pendingID)}>Valider</button>
          <button className="btn btn-danger btn-sm" onClick={() => handleReject(r.pendingID)}>Rejeter</button>
        </div>
      )
    },
  ];

  return (
    <div className="panel">
      <div className="panel-header">
        <div className="panel-title">Client Management</div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add Client</button>
      </div>

      <div className="toolbar">
        <input className="search-input" placeholder="Search clients…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="toggle-group">
          <button className={`toggle-btn${tab === 'validated' ? ' active' : ''}`} onClick={() => setTab('validated')}>Validated</button>
          <button className={`toggle-btn${tab === 'pending' ? ' active' : ''}`} onClick={() => setTab('pending')}>Pending</button>
        </div>
        <button className="btn btn-outline">⬇ Export</button>
      </div>

      {tab === 'validated' ? (
        <DataTable columns={validatedColumns} rows={rows} loading={loading} totalLabel={`TOTAL VALIDATED CLIENTS: ${rows.length}`} />
      ) : (
        <DataTable columns={pendingColumns} rows={pendingRows} loading={loading} totalLabel={`EN ATTENTE: ${pendingRows.length}`} />
      )}

      {showModal && (
        <Modal title="Add Client" onClose={() => setShowModal(false)} footer={
          <>
            <button className="btn btn-outline" onClick={() => setShowModal(false)}>Annuler</button>
            <button className="btn btn-primary" form="client-form" type="submit" disabled={submitting}>
              {submitting ? 'Envoi…' : 'Soumettre pour validation'}
            </button>
          </>
        }>
          <form id="client-form" onSubmit={handleCreate} style={{ display: 'contents' }}>
            <div className="form-row">
              <div className="form-group"><label>Nom</label><input required value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} /></div>
              <div className="form-group"><label>Prénom</label><input value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Téléphone</label><input value={form.phoneNumber} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} /></div>
              <div className="form-group"><label>Email</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            </div>
            <div className="form-group"><label>Adresse</label><input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
            <div className="form-row">
              <div className="form-group">
                <label>Type de client</label>
                <select value={form.clientType} onChange={(e) => setForm({ ...form, clientType: e.target.value })}>
                  <option value="INDIVIDUAL">Individual</option>
                  <option value="COMPANY">Company</option>
                </select>
              </div>
              <div className="form-group"><label>N° CNI</label><input value={form.numeroCNI} onChange={(e) => setForm({ ...form, numeroCNI: e.target.value })} /></div>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
