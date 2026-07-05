import { useEffect, useState } from 'react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import { AgencyAPI } from '../api/endpoints';

const emptyForm = { codeAgence: '', nom: '', location: '', contactInfo: '', codeIMF: '' };

export default function AgencyManagement() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');

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

  const handleCreate = async (e) => {
    e.preventDefault();
    await AgencyAPI.create(form);
    setShowModal(false);
    setForm(emptyForm);
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
  ];

  return (
    <div className="panel">
      <div className="panel-header">
        <div className="panel-title">Agency Management</div>
        <button className="btn btn-teal" onClick={() => setShowModal(true)}>+ Add Agency</button>
      </div>

      <div className="toolbar">
        <input className="search-input" placeholder="Search agencies…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <button className="btn btn-outline">⬇ Export</button>
      </div>

      <DataTable columns={columns} rows={filtered} loading={loading} totalLabel={`TOTAL AGENCIES: ${filtered.length}`} />

      {showModal && (
        <Modal title="Add Agency" onClose={() => setShowModal(false)} footer={
          <>
            <button className="btn btn-outline" onClick={() => setShowModal(false)}>Annuler</button>
            <button className="btn btn-teal" form="agency-form" type="submit">Créer</button>
          </>
        }>
          <form id="agency-form" onSubmit={handleCreate} style={{ display: 'contents' }}>
            <div className="form-group"><label>Code Agence</label><input required value={form.codeAgence} onChange={(e) => setForm({ ...form, codeAgence: e.target.value })} placeholder="AG-2026-001" /></div>
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
