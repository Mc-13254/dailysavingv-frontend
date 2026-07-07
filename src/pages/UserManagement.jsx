import { useEffect, useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import ExportDropdown from '../components/ExportDropdown';
import { UserAPI, RoleAPI } from '../api/endpoints';

const emptyForm = { username: '', email: '', phone: '', adresse: '', cni: '', roleID: '', password: '' };
const emptyEditForm = { email: '', phone: '', adresse: '', cni: '', roleID: '', statut: 'ACTIVE', newPassword: '' };

export default function UserManagement() {
  const [tab, setTab] = useState('validated');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [editForm, setEditForm] = useState(emptyEditForm);
  const [search, setSearch] = useState('');
  const [notice, setNotice] = useState('');
  const [roles, setRoles] = useState([]);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await UserAPI.list();
      setRows(data);
    } catch { setRows([]); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  useEffect(() => { RoleAPI.active().then(({ data }) => setRoles(data)).catch(() => {}); }, []);

  const filtered = rows
    .filter(r => tab === 'validated' ? r.validationStatus === 'VALIDATED' : r.validationStatus === 'PENDING')
    .filter(r => !search || r.username?.toLowerCase().includes(search.toLowerCase()));

  const openCreate = () => { setEditing(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (row) => {
    setEditing(row);
    setEditForm({ email: row.email || '', phone: row.phone || '', adresse: row.adresse || '', cni: row.cni || '', roleID: '', statut: row.statut || 'ACTIVE', newPassword: '' });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editing) {
      await UserAPI.update(editing.codeUser, editForm);
      setNotice('Modification soumise pour validation.');
    } else {
      await UserAPI.create(form);
      setNotice('Utilisateur soumis pour validation.');
    }
    setShowModal(false);
    setForm(emptyForm);
    setEditing(null);
    load();
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Désactiver l'utilisateur ${row.username} ? (soumis pour validation)`)) return;
    await UserAPI.remove(row.codeUser);
    setNotice('Suppression soumise pour validation.');
    load();
  };

  const columns = [
    { key: 'codeUser', label: 'CodeUser' },
    { key: 'username', label: 'Username' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'adresse', label: 'Adresse' },
    { key: 'cni', label: 'CNI' },
    { key: 'roleCode', label: 'RoleID' },
    { key: 'agenceID', label: 'Agence' },
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
        <div className="panel-title">Validated Users</div>
        <button className="btn btn-primary" onClick={openCreate}>+ Add User</button>
      </div>

      {notice && <div className="error-banner" style={{ background: '#dcfce7', color: '#16a34a' }}>{notice}</div>}

      <div className="toolbar">
        <input className="search-input" placeholder="Search users…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="toggle-group">
          <button className={`toggle-btn${tab === 'validated' ? ' active' : ''}`} onClick={() => setTab('validated')}>Validated</button>
          <button className={`toggle-btn${tab === 'pending' ? ' active' : ''}`} onClick={() => setTab('pending')}>Pending</button>
        </div>
        <ExportDropdown filename="USERS" columns={columns.filter((c) => c.key !== 'actions')} rows={filtered} />
      </div>

      <DataTable columns={columns} rows={filtered} loading={loading} totalLabel={`TOTAL VALIDATED USERS: ${filtered.length}`} />

      {showModal && (
        <Modal title={editing ? 'Edit User' : 'Add User'} onClose={() => setShowModal(false)} footer={
          <>
            <button className="btn btn-outline" onClick={() => setShowModal(false)}>Annuler</button>
            <button className="btn btn-primary" form="user-form" type="submit">Soumettre pour validation</button>
          </>
        }>
          {!editing ? (
            <form id="user-form" onSubmit={handleSubmit} style={{ display: 'contents' }}>
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
                  <select required value={form.roleID} onChange={(e) => setForm({ ...form, roleID: Number(e.target.value) })}>
                    <option value="">—</option>
                    {roles.map((r) => <option key={r.roleID} value={r.roleID}>{r.libelle}</option>)}
                  </select>
                </div>
              </div>
            </form>
          ) : (
            <form id="user-form" onSubmit={handleSubmit} style={{ display: 'contents' }}>
              <div className="form-row">
                <div className="form-group"><label>Email</label><input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} /></div>
                <div className="form-group"><label>Téléphone</label><input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} /></div>
              </div>
              <div className="form-group"><label>Adresse</label><input value={editForm.adresse} onChange={(e) => setEditForm({ ...editForm, adresse: e.target.value })} /></div>
              <div className="form-row">
                <div className="form-group"><label>CNI</label><input value={editForm.cni} onChange={(e) => setEditForm({ ...editForm, cni: e.target.value })} /></div>
                <div className="form-group">
                  <label>Statut</label>
                  <select value={editForm.statut} onChange={(e) => setEditForm({ ...editForm, statut: e.target.value })}>
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>
              <div className="form-group"><label>Nouveau mot de passe (optionnel)</label><input type="password" value={editForm.newPassword} onChange={(e) => setEditForm({ ...editForm, newPassword: e.target.value })} placeholder="Laisser vide pour ne pas changer" /></div>
            </form>
          )}
        </Modal>
      )}
    </div>
  );
}
