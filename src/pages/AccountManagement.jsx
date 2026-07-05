import { useEffect, useState } from 'react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import { AccountAPI } from '../api/endpoints';

const emptyForm = { clientID: '', numCarnet: '' };

export default function AccountManagement() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await AccountAPI.list(search);
      setRows(data);
    } catch { setRows([]); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [search]);

  const handleCreate = async (e) => {
    e.preventDefault();
    await AccountAPI.create(form);
    setShowModal(false);
    setForm(emptyForm);
    load();
  };

  const fmt = (n) => new Intl.NumberFormat('fr-FR').format(n || 0);

  const columns = [
    { key: 'accountID', label: 'Account ID' },
    { key: 'clientID', label: 'Client ID' },
    { key: 'numCarnet', label: 'Num Carnet' },
    { key: 'balance', label: 'Balance', render: (r) => fmt(r.balance) },
    { key: 'active', label: 'Active', render: (r) => <StatusBadge status={r.active ? 'ACTIVE' : 'INACTIVE'} /> },
    { key: 'createdBy', label: 'Created By' },
    { key: 'createDate', label: 'Create Date', render: (r) => r.createDate ? new Date(r.createDate).toLocaleDateString('fr-FR') : '—' },
    {
      key: 'actions', label: 'Actions', render: () => (
        <div style={{ display: 'flex', gap: 4 }}>
          <button className="btn-icon">👁️</button>
          <button className="btn-icon">✏️</button>
          <button className="btn-icon">⏻</button>
        </div>
      )
    },
  ];

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <div className="panel-title">Account Management</div>
          <div className="panel-subtitle">Manage client accounts and balances</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add Account</button>
      </div>

      <div className="toolbar">
        <input className="search-input" placeholder="Search accounts (ID, Carnet, Client)…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <button className="btn btn-outline">⬇ Export</button>
      </div>

      <DataTable columns={columns} rows={rows} loading={loading} totalLabel={`TOTAL ACCOUNTS: ${rows.length}`} />

      {showModal && (
        <Modal title="Add Account" onClose={() => setShowModal(false)} footer={
          <>
            <button className="btn btn-outline" onClick={() => setShowModal(false)}>Annuler</button>
            <button className="btn btn-primary" form="account-form" type="submit">Créer</button>
          </>
        }>
          <form id="account-form" onSubmit={handleCreate} style={{ display: 'contents' }}>
            <div className="form-group"><label>Client ID</label><input required value={form.clientID} onChange={(e) => setForm({ ...form, clientID: e.target.value })} placeholder="CL-00001" /></div>
            <div className="form-group"><label>Numéro Carnet</label><input value={form.numCarnet} onChange={(e) => setForm({ ...form, numCarnet: e.target.value })} /></div>
          </form>
        </Modal>
      )}
    </div>
  );
}
