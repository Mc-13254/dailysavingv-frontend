import { useEffect, useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import ExportDropdown from '../components/ExportDropdown';
import { ContractAPI } from '../api/endpoints';

const emptyForm = { contractNumber: '', clientID: '', startDate: '', endDate: '', contractType: '', description: '' };

export default function ContractManagement() {
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
      const { data } = await ContractAPI.list();
      setRows(data);
    } catch { setRows([]); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const filtered = rows.filter(r => !search || r.contractNumber?.toLowerCase().includes(search.toLowerCase()));

  const openCreate = () => { setEditing(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (row) => {
    setEditing(row);
    setForm({
      contractNumber: row.contractNumber, clientID: row.clientID || '',
      startDate: row.startDate ? row.startDate.slice(0, 10) : '', endDate: row.endDate ? row.endDate.slice(0, 10) : '',
      contractType: row.contractType || '', description: row.description || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editing) {
      await ContractAPI.update(editing.contractID, form);
      setNotice('Modification soumise pour validation.');
    } else {
      await ContractAPI.create(form);
      setNotice('Contrat soumis pour validation.');
    }
    setShowModal(false);
    setForm(emptyForm);
    setEditing(null);
    load();
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Supprimer le contrat ${row.contractNumber} ? (soumis pour validation)`)) return;
    await ContractAPI.remove(row.contractID);
    setNotice('Suppression soumise pour validation.');
    load();
  };

  const columns = [
    { key: 'contractID', label: 'ContractID' },
    { key: 'contractNumber', label: 'Contract Number' },
    { key: 'startDate', label: 'Start Date', render: (r) => r.startDate ? new Date(r.startDate).toLocaleDateString('fr-FR') : '—' },
    { key: 'endDate', label: 'EndDate', render: (r) => r.endDate ? new Date(r.endDate).toLocaleDateString('fr-FR') : '—' },
    { key: 'contractType', label: 'Contract Type' },
    { key: 'description', label: 'Description' },
    { key: 'statut', label: 'Status', render: (r) => <StatusBadge status={r.statut} /> },
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
        <div className="panel-title">Contract Management</div>
        <button className="btn btn-teal" onClick={openCreate}>+ Add Contract</button>
      </div>

      {notice && <div className="error-banner" style={{ background: '#dcfce7', color: '#16a34a' }}>{notice}</div>}

      <div className="toolbar">
        <input className="search-input" placeholder="Search contracts…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <ExportDropdown filename="CONTRACTS" columns={columns.filter((c) => c.key !== 'actions')} rows={filtered} />
      </div>

      <DataTable columns={columns} rows={filtered} loading={loading} totalLabel={`TOTAL CONTRACTS: ${filtered.length}`} />

      {showModal && (
        <Modal title={editing ? 'Edit Contract' : 'Add Contract'} onClose={() => setShowModal(false)} footer={
          <>
            <button className="btn btn-outline" onClick={() => setShowModal(false)}>Annuler</button>
            <button className="btn btn-teal" form="contract-form" type="submit">Créer</button>
          </>
        }>
          <form id="contract-form" onSubmit={handleSubmit} style={{ display: 'contents' }}>
            <div className="form-group"><label>Numéro de contrat</label><input required value={form.contractNumber} onChange={(e) => setForm({ ...form, contractNumber: e.target.value })} placeholder="CT-2026-001" /></div>
            <div className="form-group"><label>Client ID (optionnel)</label><input value={form.clientID} onChange={(e) => setForm({ ...form, clientID: e.target.value })} placeholder="CL-00001" /></div>
            <div className="form-row">
              <div className="form-group"><label>Date de début</label><input type="date" required value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></div>
              <div className="form-group"><label>Date de fin</label><input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></div>
            </div>
            <div className="form-group"><label>Type de contrat</label><input value={form.contractType} onChange={(e) => setForm({ ...form, contractType: e.target.value })} /></div>
            <div className="form-group"><label>Description</label><textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          </form>
        </Modal>
      )}
    </div>
  );
}
