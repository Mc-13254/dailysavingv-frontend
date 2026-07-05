import { useEffect, useState } from 'react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import { ContractAPI } from '../api/endpoints';

const emptyForm = { contractNumber: '', startDate: '', endDate: '', contractType: '', description: '' };

export default function ContractManagement() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');

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

  const handleCreate = async (e) => {
    e.preventDefault();
    await ContractAPI.create(form);
    setShowModal(false);
    setForm(emptyForm);
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
  ];

  return (
    <div className="panel">
      <div className="panel-header">
        <div className="panel-title">Contract Management</div>
        <button className="btn btn-teal" onClick={() => setShowModal(true)}>+ Add Contract</button>
      </div>

      <div className="toolbar">
        <input className="search-input" placeholder="Search contracts…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <button className="btn btn-outline">⬇ Export</button>
      </div>

      <DataTable columns={columns} rows={filtered} loading={loading} totalLabel={`TOTAL CONTRACTS: ${filtered.length}`} />

      {showModal && (
        <Modal title="Add Contract" onClose={() => setShowModal(false)} footer={
          <>
            <button className="btn btn-outline" onClick={() => setShowModal(false)}>Annuler</button>
            <button className="btn btn-teal" form="contract-form" type="submit">Créer</button>
          </>
        }>
          <form id="contract-form" onSubmit={handleCreate} style={{ display: 'contents' }}>
            <div className="form-group"><label>Numéro de contrat</label><input required value={form.contractNumber} onChange={(e) => setForm({ ...form, contractNumber: e.target.value })} placeholder="CT-2026-001" /></div>
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
