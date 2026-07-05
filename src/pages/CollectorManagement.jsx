import { useEffect, useState } from 'react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import { CollectorAPI } from '../api/endpoints';

const emptyForm = {
  codeUser: '', name: '', phoneNumber: '', contactType: '', codeTerminal: '', plafond: 0, dateEmploi: '',
};

export default function CollectorManagement() {
  const [tab, setTab] = useState('validated'); // validated | pending
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState([]);
  const [pendingRows, setPendingRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState('');

  const loadAll = async () => {
    setLoading(true);
    try {
      const [{ data: list }, { data: pend }] = await Promise.all([
        CollectorAPI.list(search),
        CollectorAPI.pending().catch(() => ({ data: [] })),
      ]);
      setRows(list);
      setPendingRows(pend);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, [search]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await CollectorAPI.create(form);
      setNotice('Collecteur soumis pour validation (Maker-Checker).');
      setShowModal(false);
      setForm(emptyForm);
      loadAll();
    } catch (err) {
      setNotice(err.response?.data?.message || "Erreur lors de la création.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (pendingId) => {
    await CollectorAPI.approve(pendingId);
    loadAll();
  };
  const handleReject = async (pendingId) => {
    const reason = window.prompt('Motif du rejet ?') || 'Non spécifié';
    await CollectorAPI.reject(pendingId, reason);
    loadAll();
  };

  const validatedColumns = [
    { key: 'collectorID', label: 'CollectorID' },
    { key: 'codeUser', label: 'CodeU' },
    { key: 'name', label: 'Name' },
    { key: 'phoneNumber', label: 'PhoneNumber' },
    { key: 'agenceNom', label: 'Agence' },
    { key: 'isActive', label: 'IsActive', render: (r) => <StatusBadge status={r.isActive ? 'ACTIVE' : 'INACTIVE'} /> },
    { key: 'dateEmploi', label: 'DateEmploi', render: (r) => r.dateEmploi ? new Date(r.dateEmploi).toLocaleDateString('fr-FR') : '—' },
    { key: 'contactType', label: 'ContactType' },
    { key: 'codeTerminal', label: 'CodeTerminal' },
    { key: 'plafond', label: 'Plafond' },
  ];

  const pendingColumns = [
    { key: 'pendingID', label: 'Pending ID' },
    { key: 'actionType', label: 'Action' },
    { key: 'name', label: 'Name' },
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
        <div className="panel-title">Collector Management</div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add Collector</button>
      </div>

      {notice && <div className="error-banner" style={{ background: '#dcfce7', color: '#16a34a' }}>{notice}</div>}

      <div className="toolbar">
        <input className="search-input" placeholder="Search collectors…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="toggle-group">
          <button className={`toggle-btn${tab === 'validated' ? ' active' : ''}`} onClick={() => setTab('validated')}>Validated</button>
          <button className={`toggle-btn${tab === 'pending' ? ' active' : ''}`} onClick={() => setTab('pending')}>Pending</button>
        </div>
        <button className="btn btn-outline">⬇ Export</button>
      </div>

      {tab === 'validated' ? (
        <DataTable columns={validatedColumns} rows={rows} loading={loading} totalLabel={`TOTAL COLLECTORS: ${rows.length}`} />
      ) : (
        <DataTable columns={pendingColumns} rows={pendingRows} loading={loading} totalLabel={`EN ATTENTE: ${pendingRows.length}`} />
      )}

      {showModal && (
        <Modal title="Add Collector" onClose={() => setShowModal(false)} footer={
          <>
            <button className="btn btn-outline" onClick={() => setShowModal(false)}>Annuler</button>
            <button className="btn btn-primary" form="collector-form" type="submit" disabled={submitting}>
              {submitting ? 'Envoi…' : 'Soumettre pour validation'}
            </button>
          </>
        }>
          <form id="collector-form" onSubmit={handleCreate} style={{ display: 'contents' }}>
            <div className="form-group">
              <label>Code Utilisateur (existant)</label>
              <input required value={form.codeUser} onChange={(e) => setForm({ ...form, codeUser: e.target.value })} placeholder="U-001" />
            </div>
            <div className="form-group">
              <label>Nom complet</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Téléphone</label>
                <input value={form.phoneNumber} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Date d'embauche</label>
                <input type="date" value={form.dateEmploi} onChange={(e) => setForm({ ...form, dateEmploi: e.target.value })} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Type de contact</label>
                <input value={form.contactType} onChange={(e) => setForm({ ...form, contactType: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Code terminal</label>
                <input value={form.codeTerminal} onChange={(e) => setForm({ ...form, codeTerminal: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label>Plafond (XAF)</label>
              <input type="number" value={form.plafond} onChange={(e) => setForm({ ...form, plafond: Number(e.target.value) })} />
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
