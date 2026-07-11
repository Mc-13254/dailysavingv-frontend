import { useEffect, useState } from 'react';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import ExportDropdown from '../components/ExportDropdown';
import { RoleAPI } from '../api/endpoints';

const emptyForm = { libelle: '', description: '', roleType: 'CUSTOM', statut: true };

// mode: 'create' | 'edit' | 'view' | null
export default function RoleManagement() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [mode, setMode] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await RoleAPI.list();
      setRows(data);
    } catch { setRows([]); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const filtered = rows.filter((r) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return [r.code, r.libelle, r.description].some((v) => String(v || '').toLowerCase().includes(term));
  });

  const openCreate = () => { setMode('create'); setForm(emptyForm); setError(''); };
  const openView = (row) => { setMode('view'); setForm(mapRowToForm(row)); };
  const openEdit = (row) => { setMode('edit'); setForm(mapRowToForm(row)); setError(''); };
  const close = () => setMode(null);

  function mapRowToForm(row) {
    return {
      __id: row.roleID, code: row.code, libelle: row.libelle, description: row.description || '', roleType: row.roleType || 'CUSTOM',
      statut: row.statut, usersCount: row.usersCount, createdBy: row.createdBy, createdDate: row.createdDate,
    };
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (mode === 'create') {
        await RoleAPI.create({ libelle: form.libelle, description: form.description, roleType: form.roleType });
        setNotice('Rôle soumis pour validation.');
      } else if (mode === 'edit') {
        await RoleAPI.update(form.__id, { libelle: form.libelle, description: form.description, roleType: form.roleType, statut: form.statut });
        setNotice('Modification soumise pour validation.');
      }
      close();
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de l'enregistrement.");
    }
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Voulez-vous vraiment supprimer le rôle ${row.libelle} ?`)) return;
    try {
      await RoleAPI.remove(row.roleID);
      setNotice('Suppression soumise pour validation.');
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de la suppression.');
    }
  };

  const columns = [
    { key: 'code', label: 'Code' },
    { key: 'libelle', label: 'Role Name' },
    { key: 'roleType', label: 'Type', render: (r) => r.roleType || 'CUSTOM' },
    { key: 'description', label: 'Description', render: (r) => r.description || '—' },
    { key: 'usersCount', label: 'Users' },
    { key: 'statut', label: 'Status', render: (r) => <StatusBadge status={r.statut ? 'ACTIVE' : 'INACTIVE'} /> },
    { key: 'createdDate', label: 'Created', render: (r) => r.createdDate ? new Date(r.createdDate).toLocaleDateString('fr-FR') : '—' },
    {
      key: 'actions', label: 'Actions', sortable: false, render: (r) => (
        <div className="flex items-center gap-2">
          <button className="btn-icon" title="Voir" onClick={() => openView(r)}><Eye size={15} /></button>
          <button className="btn-icon" title="Modifier" onClick={() => openEdit(r)}><Pencil size={15} /></button>
          <button className="btn-icon text-red-500" title="Supprimer" onClick={() => handleDelete(r)}><Trash2 size={15} /></button>
        </div>
      )
    },
  ];

  const readOnly = mode === 'view';

  return (
    <div className="panel">
      <div className="panel-header">
        <div className="panel-title">Role Management</div>
        <button className="btn btn-primary" onClick={openCreate}>+ Create Role</button>
      </div>

      {notice && <div className="error-banner" style={{ background: '#dcfce7', color: '#16a34a' }}>{notice}</div>}

      <div className="toolbar">
        <input className="search-input" placeholder="Search Role (code, nom, description)…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <ExportDropdown filename="ROLES" columns={columns.filter((c) => c.key !== 'actions')} rows={filtered} />
      </div>

      <DataTable columns={columns} rows={filtered} loading={loading} totalLabel={`TOTAL ROLES: ${filtered.length}`} />

      {mode && (
        <Modal
          title={mode === 'create' ? 'Create Role' : mode === 'edit' ? 'Edit Role' : 'View Role'}
          onClose={close}
          footer={
            readOnly
              ? <button className="btn btn-outline" onClick={close}>Fermer</button>
              : (
                <>
                  <button className="btn btn-outline" onClick={close}>Cancel</button>
                  <button className="btn btn-primary" form="role-form" type="submit">{mode === 'create' ? 'Save' : 'Update'}</button>
                </>
              )
          }
        >
          {error && <div className="error-banner">{error}</div>}
          <form id="role-form" onSubmit={handleSubmit} style={{ display: 'contents' }}>
            <div className="text-xs font-bold text-brand-blue uppercase mt-1">General Information</div>
            {mode !== 'create' && (
              <div className="form-group"><label>Role Code</label><input disabled value={form.code || ''} /></div>
            )}
            <div className="form-group"><label>Role Name *</label><input required disabled={readOnly} value={form.libelle} onChange={(e) => setForm({ ...form, libelle: e.target.value })} placeholder="Manager" /></div>
            <div className="form-group">
              <label>Type de rôle * (détermine les droits d'accès réels)</label>
              <select disabled={readOnly} value={form.roleType} onChange={(e) => setForm({ ...form, roleType: e.target.value })}>
                <option value="ADMIN">Administrateur (accès total)</option>
                <option value="SUPERVISOR">Superviseur</option>
                <option value="MANAGER">Manager</option>
                <option value="CASHIER">Caissier</option>
                <option value="COLLECTOR">Collecteur</option>
                <option value="CUSTOM">Personnalisé (aucun droit par défaut)</option>
              </select>
            </div>
            <div className="form-group"><label>Description</label><textarea rows={2} disabled={readOnly} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Responsible for managing one or more agencies." /></div>

            <div className="text-xs font-bold text-brand-blue uppercase mt-2">Status</div>
            {mode === 'edit' ? (
              <div className="form-group">
                <select value={form.statut ? 'true' : 'false'} onChange={(e) => setForm({ ...form, statut: e.target.value === 'true' })}>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            ) : mode === 'view' ? (
              <StatusBadge status={form.statut ? 'ACTIVE' : 'INACTIVE'} />
            ) : (
              <div className="text-[11px] text-gray-400">Statut initial : Active</div>
            )}

            {mode !== 'create' && (
              <>
                <div className="text-xs font-bold text-brand-blue uppercase mt-2">Audit</div>
                <div className="form-row">
                  <div className="form-group"><label>Created By</label><input disabled value={form.createdBy || ''} /></div>
                  <div className="form-group"><label>Created Date</label><input disabled value={form.createdDate ? new Date(form.createdDate).toLocaleDateString('fr-FR') : ''} /></div>
                </div>
              </>
            )}
          </form>
        </Modal>
      )}
    </div>
  );
}
