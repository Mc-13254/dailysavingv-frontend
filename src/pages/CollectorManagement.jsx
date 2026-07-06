import { useEffect, useState } from 'react';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import ExportDropdown from '../components/ExportDropdown';
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
  const [editing, setEditing] = useState(null); // collector being edited, or null for create
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

  const openCreate = () => { setEditing(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (row) => {
    setEditing(row);
    setForm({
      codeUser: row.codeUser, name: row.name, phoneNumber: row.phoneNumber || '',
      contactType: row.contactType || '', codeTerminal: row.codeTerminal || '',
      plafond: row.plafond || 0, dateEmploi: row.dateEmploi ? row.dateEmploi.slice(0, 10) : '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editing) {
        await CollectorAPI.update(editing.collectorID, {
          name: form.name, phoneNumber: form.phoneNumber, isActive: true,
          contactType: form.contactType, codeTerminal: form.codeTerminal, plafond: Number(form.plafond),
        });
        setNotice('Modification soumise pour validation.');
      } else {
        await CollectorAPI.create(form);
        setNotice('Collecteur soumis pour validation (Maker-Checker).');
      }
      setShowModal(false);
      setForm(emptyForm);
      setEditing(null);
      loadAll();
    } catch (err) {
      setNotice(err.response?.data?.message || "Erreur lors de l'enregistrement.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Supprimer le collecteur ${row.collectorID} ? (soumis pour validation)`)) return;
    await CollectorAPI.remove(row.collectorID);
    setNotice('Suppression soumise pour validation.');
    loadAll();
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
    {
      key: 'actions', label: 'Actions', sortable: false, render: (r) => (
        <div className="flex items-center gap-2">
          <button className="btn-icon" title="Modifier" onClick={() => openEdit(r)}><Pencil size={15} /></button>
          <button className="btn-icon text-red-500" title="Supprimer" onClick={() => handleDelete(r)}><Trash2 size={15} /></button>
        </div>
      )
    },
  ];

  const pendingColumns = [
    { key: 'pendingID', label: 'Pending ID' },
    { key: 'actionType', label: 'Action' },
    { key: 'name', label: 'Name' },
    { key: 'requestUser', label: 'Demandé par' },
    { key: 'requestDate', label: 'Date', render: (r) => new Date(r.requestDate).toLocaleString('fr-FR') },
    {
      key: 'actions', label: 'Actions', sortable: false, render: (r) => (
        <div className="flex items-center gap-2">
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
        <button className="btn btn-primary" onClick={openCreate}>+ Add Collector</button>
      </div>

      {notice && <div className="error-banner" style={{ background: '#dcfce7', color: '#16a34a' }}>{notice}</div>}

      <div className="toolbar">
        <input className="search-input" placeholder="Search collectors…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="toggle-group">
          <button className={`toggle-btn${tab === 'validated' ? ' active' : ''}`} onClick={() => setTab('validated')}>Validated</button>
          <button className={`toggle-btn${tab === 'pending' ? ' active' : ''}`} onClick={() => setTab('pending')}>Pending</button>
        </div>
        {tab === 'validated' && (
          <ExportDropdown
            filename="COLLECTORS"
            columns={validatedColumns.filter((c) => c.key !== 'actions' && c.key !== 'isActive').concat([{ key: 'isActive', label: 'IsActive', format: (r) => (r.isActive ? 'ACTIVE' : 'INACTIVE') }])}
            rows={rows}
          />
        )}
      </div>

      {tab === 'validated' ? (
        <DataTable columns={validatedColumns} rows={rows} loading={loading} totalLabel={`TOTAL COLLECTORS: ${rows.length}`} />
      ) : (
        <DataTable columns={pendingColumns} rows={pendingRows} loading={loading} totalLabel={`EN ATTENTE: ${pendingRows.length}`} />
      )}

      {showModal && (
        <Modal title={editing ? 'Edit Collector' : 'Add Collector'} onClose={() => setShowModal(false)} footer={
          <>
            <button className="btn btn-outline" onClick={() => setShowModal(false)}>Annuler</button>
            <button className="btn btn-primary" form="collector-form" type="submit" disabled={submitting}>
              {submitting ? 'Envoi…' : 'Soumettre pour validation'}
            </button>
          </>
        }>
          <form id="collector-form" onSubmit={handleSubmit} style={{ display: 'contents' }}>
            <div className="form-group">
              <label>Code Utilisateur (existant)</label>
              <input required disabled={!!editing} value={form.codeUser} onChange={(e) => setForm({ ...form, codeUser: e.target.value })} placeholder="U-001" />
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
