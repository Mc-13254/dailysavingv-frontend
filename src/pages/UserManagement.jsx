import { useEffect, useState } from 'react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import { UserAPI } from '../api/endpoints';

const emptyForm = { username: '', email: '', phone: '', adresse: '', cni: '', roleID: '', password: '' };

export default function UserManagement() {
  const [tab, setTab] = useState('validated');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await UserAPI.list();
      setRows(data);
    } catch { setRows([]); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const filtered = rows
    .filter(r => tab === 'validated' ? r.validationStatus === 'VALIDATED' : r.validationStatus === 'PENDING')
    .filter(r => !search || r.username?.toLowerCase().includes(search.toLowerCase()));

  const handleCreate = async (e) => {
    e.preventDefault();
    await UserAPI.create(form);
    setShowModal(false);
    setForm(emptyForm);
    load();
  };

  const columns = [
    { key: 'codeUser', label: 'CodeUser' },
    { key: 'username', label: 'Username' },
    { key: 'photo', label: 'Photo', render: () => '🖼️' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'adresse', label: 'Adresse' },
    { key: 'cni', label: 'CNI' },
    { key: 'roleCode', label: 'RoleID' },
    { key: 'agenceID', label: 'Agence' },
  ];

  return (
    <div className="panel">
      <div className="panel-header">
        <div className="panel-title">Validated Users</div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add User</button>
      </div>

      <div className="toolbar">
        <input className="search-input" placeholder="Search users…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="toggle-group">
          <button className={`toggle-btn${tab === 'validated' ? ' active' : ''}`} onClick={() => setTab('validated')}>Validated</button>
          <button className={`toggle-btn${tab === 'pending' ? ' active' : ''}`} onClick={() => setTab('pending')}>Pending</button>
        </div>
        <button className="btn btn-outline">⬇ Export</button>
      </div>

      <DataTable columns={columns} rows={filtered} loading={loading} totalLabel={`TOTAL VALIDATED USERS: ${filtered.length}`} />

      {showModal && (
        <Modal title="Add User" onClose={() => setShowModal(false)} footer={
          <>
            <button className="btn btn-outline" onClick={() => setShowModal(false)}>Annuler</button>
            <button className="btn btn-primary" form="user-form" type="submit">Soumettre pour validation</button>
          </>
        }>
          <form id="user-form" onSubmit={handleCreate} style={{ display: 'contents' }}>
            <div className="form-row">
              <div className="form-group"><label>Username</label><input required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></div>
              <div className="form-group"><label>Mot de passe</label><input type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Email</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div className="form-group"><label>Téléphone</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            </div>
            <div className="form-group"><label>Adresse</label><input value={form.adresse} onChange={(e) => setForm({ ...form, adresse: e.target.value })} /></div>
            <div className="form-row">
              <div className="form-group"><label>CNI</label><input value={form.cni} onChange={(e) => setForm({ ...form, cni: e.target.value })} /></div>
              <div className="form-group">
                <label>Rôle</label>
                <select value={form.roleID} onChange={(e) => setForm({ ...form, roleID: e.target.value })}>
                  <option value="">—</option>
                  <option value="1">ADMIN</option>
                  <option value="2">SUPERVISOR</option>
                  <option value="3">COLLECTOR</option>
                </select>
              </div>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
