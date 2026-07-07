import { useEffect, useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import ExportDropdown from '../components/ExportDropdown';
import { CommissionAPI } from '../api/endpoints';

const emptyForm = { code: '', name: '', description: '' };

export default function CommissionTypeManagement() {
  const [types, setTypes] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await CommissionAPI.types();
      setTypes(data);
    } catch { setTypes([]); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const filtered = types.filter((t) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return [t.code, t.name, t.description].some((v) => String(v || '').toLowerCase().includes(term));
  });

  const openCreate = () => { setEditing(null); setForm(emptyForm); setError(''); setShowModal(true); };
  const openEdit = (t) => { setEditing(t); setForm({ code: t.code, name: t.name, description: t.description || '' }); setError(''); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editing) {
        await CommissionAPI.updateType(editing.commissionTypeID, form);
      } else {
        await CommissionAPI.createType(form);
      }
      setShowModal(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de l'enregistrement.");
    }
  };

  const handleDelete = async (t) => {
    if (!window.confirm(`Désactiver le type de commission "${t.name}" ?`)) return;
    try {
      await CommissionAPI.removeType(t.commissionTypeID);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de la suppression.');
    }
  };

  const columns = [
    { key: 'code', label: 'Code' },
    { key: 'name', label: 'Nom' },
    { key: 'description', label: 'Description', render: (r) => r.description || '—' },
    { key: 'statut', label: 'Statut', render: (r) => <StatusBadge status={r.statut} /> },
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
        <div>
          <div className="panel-title">Commission Type Management</div>
          <div className="panel-subtitle">Modification immédiate — ne passe pas par le circuit de validation.</div>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ Add Commission Type</button>
      </div>

      <div className="toolbar">
        <input className="search-input" placeholder="Search Commission Type…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <ExportDropdown filename="COMMISSION_TYPES" columns={columns.filter((c) => c.key !== 'actions')} rows={filtered} />
      </div>

      <DataTable columns={columns} rows={filtered} loading={loading} totalLabel={`TOTAL: ${filtered.length}`} />

      {showModal && (
        <Modal title={editing ? 'Edit Commission Type' : 'Add Commission Type'} onClose={() => setShowModal(false)} footer={
          <>
            <button className="btn btn-outline" onClick={() => setShowModal(false)}>Annuler</button>
            <button className="btn btn-primary" form="type-form" type="submit">{editing ? 'Update' : 'Save'}</button>
          </>
        }>
          {error && <div className="error-banner">{error}</div>}
          <form id="type-form" onSubmit={handleSubmit} style={{ display: 'contents' }}>
            <div className="form-group"><label>Code</label><input required disabled={!!editing} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="LOAN_PAYMENT" /></div>
            <div className="form-group"><label>Nom</label><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="form-group"><label>Description</label><textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          </form>
        </Modal>
      )}
    </div>
  );
}
