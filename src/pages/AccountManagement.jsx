import { useEffect, useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import ExportDropdown from '../components/ExportDropdown';
import { AccountAPI } from '../api/endpoints';

const emptyForm = { clientID: '', numCarnet: '' };

export default function AccountManagement() {
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
      const { data } = await AccountAPI.list(search);
      setRows(data);
    } catch { setRows([]); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [search]);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (row) => { setEditing(row); setForm({ clientID: row.clientID, numCarnet: row.numCarnet || '' }); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editing) {
      await AccountAPI.update(editing.accountID, { numCarnet: form.numCarnet, active: true });
      setNotice('Modification soumise pour validation.');
    } else {
      await AccountAPI.create(form);
      setNotice('Compte soumis pour validation.');
    }
    setShowModal(false);
    setForm(emptyForm);
    setEditing(null);
    load();
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Désactiver le compte ${row.accountID} ? (soumis pour validation)`)) return;
    await AccountAPI.remove(row.accountID);
    setNotice('Suppression soumise pour validation.');
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
          <div className="panel-title">Account Management</div>
          <div className="panel-subtitle">Manage client accounts and balances</div>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ Add Account</button>
      </div>

      {notice && <div className="error-banner" style={{ background: '#dcfce7', color: '#16a34a' }}>{notice}</div>}

      <div className="toolbar">
        <input className="search-input" placeholder="Search accounts (ID, Carnet, Client)…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <ExportDropdown filename="ACCOUNTS" columns={columns.filter((c) => c.key !== 'actions')} rows={rows} />
      </div>

      <DataTable columns={columns} rows={rows} loading={loading} totalLabel={`TOTAL ACCOUNTS: ${rows.length}`} />

      {showModal && (
        <Modal title={editing ? 'Edit Account' : 'Add Account'} onClose={() => setShowModal(false)} footer={
          <>
            <button className="btn btn-outline" onClick={() => setShowModal(false)}>Annuler</button>
            <button className="btn btn-primary" form="account-form" type="submit">Créer</button>
          </>
        }>
          <form id="account-form" onSubmit={handleSubmit} style={{ display: 'contents' }}>
            <div className="form-group"><label>Client ID</label><input required disabled={!!editing} value={form.clientID} onChange={(e) => setForm({ ...form, clientID: e.target.value })} placeholder="CL-00001" /></div>
            <div className="form-group"><label>Numéro Carnet</label><input value={form.numCarnet} onChange={(e) => setForm({ ...form, numCarnet: e.target.value })} /></div>
          </form>
        </Modal>
      )}
    </div>
  );
}
