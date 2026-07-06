import { useEffect, useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import ExportDropdown from '../components/ExportDropdown';
import { AgencyAPI } from '../api/endpoints';

const emptyForm = { codeAgence: '', nom: '', location: '', contactInfo: '', codeIMF: '' };

export default function AgencyManagement() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');
  const [notice, setNotice] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await AgencyAPI.list();
      setRows(data);
    } catch { setRows([]); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const filtered = rows.filter(r => !search || r.nom?.toLowerCase().includes(search.toLowerCase()) || r.codeAgence?.toLowerCase().includes(search.toLowerCase()));

  const openCreate = () => { setEditing(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (row) => {
    setEditing(row);
    setForm({ codeAgence: row.codeAgence, nom: row.nom, location: row.location || '', contactInfo: row.contactInfo || '', codeIMF: row.codeIMF });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editing) {
      await AgencyAPI.update(editing.agenceID, form);
      setNotice('Modification soumise pour validation.');
    } else {
      await AgencyAPI.create(form);
      setNotice('Agence soumise pour validation.');
    }
    setShowModal(false);
    setForm(emptyForm);
    setEditing(null);
    load();
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Désactiver l'agence ${row.codeAgence} ? (soumis pour validation)`)) return;
    await AgencyAPI.remove(row.agenceID);
    setNotice('Suppression soumise pour validation.');
    load();
  };

  const columns = [
    { key: 'codeAgence', label: 'Code Agence' },
    { key: 'nom', label: 'Name' },
    { key: 'location', label: 'Location' },
    { key: 'contactInfo', label: 'Contact Info' },
    { key: 'statut', label: 'Status', render: (r) => <StatusBadge status={r.statut} /> },
    { key: 'dateCreated', label: 'Date Created', render: (r) => r.dateCreated ? new Date(r.dateCreated).toLocaleDateString('fr-FR') : '—' },
    { key: 'createdBy', label: 'Created By' },
    { key: 'codeIMF', label: 'Code IMF' },
    {
      key: 'actions', label: 'Actions', sortable: false, render: (r) => (
        <div className="flex items-center gap-2">
          <button className="btn-icon" title="Modifier" onClick={() => openEdit(r)}><Pencil size={15} /></button>
          <button className="btn-icon text-red-500" title="Supprimer" onClick={() => handleDelete(r)}><Trash2 size={15} /></button>
        </div>
      )
    },
  ];

  return (
    <div className="panel">
      <div className="panel-header">
        <div className="panel-title">Agency Management</div>
        <button className="btn btn-teal" onClick={openCreate}>+ Add Agency</button>
      </div>

      {notice && <div className="error-banner" style={{ background: '#dcfce7', color: '#16a34a' }}>{notice}</div>}

      <div className="toolbar">
        <input className="search-input" placeholder="Search agencies…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <ExportDropdown filename="AGENCIES" columns={columns.filter((c) => c.key !== 'actions')} rows={filtered} />
      </div>

      <DataTable columns={columns} rows={filtered} loading={loading} totalLabel={`TOTAL AGENCIES: ${filtered.length}`} />

      {showModal && (
        <Modal title={editing ? 'Edit Agency' : 'Add Agency'} onClose={() => setShowModal(false)} footer={
          <>
            <button className="btn btn-outline" onClick={() => setShowModal(false)}>Annuler</button>
            <button className="btn btn-teal" form="agency-form" type="submit">Créer</button>
          </>
        }>
          <form id="agency-form" onSubmit={handleSubmit} style={{ display: 'contents' }}>
            <div className="form-group"><label>Code Agence</label><input required disabled={!!editing} value={form.codeAgence} onChange={(e) => setForm({ ...form, codeAgence: e.target.value })} placeholder="AG-2026-001" /></div>
            <div className="form-group"><label>Nom</label><input required value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} /></div>
            <div className="form-row">
              <div className="form-group"><label>Localisation</label><input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
              <div className="form-group"><label>Contact</label><input value={form.contactInfo} onChange={(e) => setForm({ ...form, contactInfo: e.target.value })} /></div>
            </div>
            <div className="form-group"><label>Code IMF</label><input required value={form.codeIMF} onChange={(e) => setForm({ ...form, codeIMF: e.target.value })} /></div>
          </form>
        </Modal>
      )}
    </div>
  );
}
