import { useEffect, useState } from 'react';
import { Eye, Pencil, Trash2, Upload, User, Phone, Briefcase, Wallet, ImageIcon, BadgeCheck } from 'lucide-react';
import DataTable from '../components/DataTable';
import WideModal from '../components/WideModal';
import StatusBadge from '../components/StatusBadge';
import ExportDropdown from '../components/ExportDropdown';
import SearchableSelect from '../components/SearchableSelect';
import { UserAPI, RoleAPI, IMFAPI, AgencyAPI } from '../api/endpoints';

const TYPE_USER_OPTIONS = ['Administrator', 'Manager', 'Cashier', 'Collector', 'Supervisor', 'Auditor'];

const emptyForm = {
  username: '', password: '', confirmPassword: '', roleID: '', typeUser: '',
  firstName: '', lastName: '', email: '', phone: '', secondaryPhone: '', adresse: '', cni: '',
  photo: '', signe: '',
  codeIMF: '', agenceID: '',
  debitMax: '', creditMax: '', validationMax: '', plafondCollect: '', caution: '',
  statut: 'ACTIVE',
};

// mode: 'create' | 'edit' | 'view' | null
export default function UserManagement() {
  const [tab, setTab] = useState('validated');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [mode, setMode] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [roles, setRoles] = useState([]);
  const [imfs, setImfs] = useState([]);
  const [agencies, setAgencies] = useState([]);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await UserAPI.list();
      setRows(data);
    } catch { setRows([]); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  useEffect(() => {
    RoleAPI.active().then(({ data }) => setRoles(data)).catch(() => {});
    IMFAPI.list().then(({ data }) => setImfs(data.filter((i) => i.statut === 'ACTIVE'))).catch(() => {});
    AgencyAPI.list().then(({ data }) => setAgencies(data.filter((a) => a.statut === 'ACTIVE'))).catch(() => {});
  }, []);

  const roleOptions = roles.map((r) => ({ value: r.roleID, label: r.libelle }));
  const imfOptions = imfs.map((i) => ({ value: i.codeIMF, label: `${i.codeIMF} — ${i.libelle}` }));
  const agencyOptionsForIMF = agencies.filter((a) => a.codeIMF === form.codeIMF).map((a) => ({ value: a.agenceID, label: a.nom }));

  const filtered = rows
    .filter((r) => tab === 'validated' ? r.validationStatus === 'VALIDATED' : r.validationStatus === 'PENDING')
    .filter((r) => {
      if (!search) return true;
      const term = search.toLowerCase();
      return [r.codeUser, r.username, r.firstName, r.lastName, r.email, r.phone, r.agenceNom, r.roleNom]
        .some((v) => String(v || '').toLowerCase().includes(term));
    });

  const openCreate = () => { setMode('create'); setForm(emptyForm); setError(''); };
  const openView = (row) => { setMode('view'); setForm(mapRowToForm(row)); };
  const openEdit = (row) => { setMode('edit'); setForm(mapRowToForm(row)); setError(''); };
  const close = () => setMode(null);

  function mapRowToForm(row) {
    return {
      __codeUser: row.codeUser, username: row.username, password: '', confirmPassword: '',
      roleID: row.roleID, typeUser: row.typeUser || '',
      firstName: row.firstName || '', lastName: row.lastName || '', email: row.email || '',
      phone: row.phone || '', secondaryPhone: '', adresse: row.adresse || '', cni: row.cni || '',
      photo: row.photo || '', signe: row.signe || '',
      codeIMF: row.codeIMF || '', agenceID: row.agenceID || '',
      debitMax: row.debitMax ?? '', creditMax: row.creditMax ?? '', validationMax: row.validationMax ?? '',
      plafondCollect: row.plafondCollect ?? '', caution: row.caution ?? '',
      statut: row.statut, createdBy: row.createdBy, createdDate: row.createdDate,
      userValidation: row.userValidation, dateValidation: row.dateValidation,
      lastUserModif: row.lastUserModif, dateModification: row.dateModification, lastLogin: row.lastLogin,
    };
  }

  const handleUpload = (field) => (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, [field]: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (mode === 'create' && form.password !== form.confirmPassword) {
      setError('Le mot de passe et sa confirmation ne correspondent pas.');
      return;
    }
    try {
      if (mode === 'create') {
        await UserAPI.create({
          username: form.username, password: form.password, confirmPassword: form.confirmPassword,
          email: form.email, phone: form.phone, secondaryPhone: form.secondaryPhone,
          adresse: form.adresse, cni: form.cni, roleID: form.roleID, typeUser: form.typeUser,
          firstName: form.firstName, lastName: form.lastName, photo: form.photo, signe: form.signe,
          agenceID: form.agenceID || null,
          debitMax: form.debitMax || null, creditMax: form.creditMax || null, validationMax: form.validationMax || null,
          plafondCollect: form.plafondCollect || null, caution: form.caution || null,
        });
        setNotice('Utilisateur soumis pour validation.');
      } else if (mode === 'edit') {
        await UserAPI.update(form.__codeUser, {
          email: form.email, phone: form.phone, adresse: form.adresse, cni: form.cni,
          roleID: form.roleID, agenceID: form.agenceID || null, typeUser: form.typeUser, statut: form.statut,
          newPassword: form.password || null,
          firstName: form.firstName, lastName: form.lastName, photo: form.photo, signe: form.signe,
          debitMax: form.debitMax || null, creditMax: form.creditMax || null, validationMax: form.validationMax || null,
          plafondCollect: form.plafondCollect || null, caution: form.caution || null,
        });
        setNotice('Modification soumise pour validation.');
      }
      close();
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de l'enregistrement.");
    }
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Désactiver l'utilisateur ${row.username} ?`)) return;
    try {
      await UserAPI.remove(row.codeUser);
      setNotice('Suppression soumise pour validation.');
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de la suppression.');
    }
  };

  const columns = [
    { key: 'codeUser', label: 'User Code' },
    { key: 'photo', label: 'Photo', render: (r) => r.photo ? <img src={r.photo} alt="" className="w-7 h-7 rounded-full object-cover" /> : <div className="w-7 h-7 rounded-full bg-gray-200" /> },
    { key: 'fullName', label: 'Full Name', render: (r) => `${r.firstName || ''} ${r.lastName || ''}`.trim() || '—' },
    { key: 'username', label: 'Username' },
    { key: 'roleNom', label: 'Role', render: (r) => r.roleNom || '—' },
    { key: 'typeUser', label: 'User Type', render: (r) => r.typeUser || '—' },
    { key: 'agenceNom', label: 'Agency', render: (r) => r.agenceNom || 'SIÈGE' },
    { key: 'phone', label: 'Phone', render: (r) => r.phone || '—' },
    { key: 'statut', label: 'Status', render: (r) => <StatusBadge status={r.statut} /> },
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
        <div className="panel-title">User Management</div>
        <button className="btn btn-primary" onClick={openCreate}>+ Create User</button>
      </div>

      {notice && <div className="error-banner" style={{ background: '#dcfce7', color: '#16a34a' }}>{notice}</div>}

      <div className="toolbar">
        <input className="search-input" placeholder="Search users (code, nom, email, tél, agence, rôle)…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="toggle-group">
          <button className={`toggle-btn${tab === 'validated' ? ' active' : ''}`} onClick={() => setTab('validated')}>Validated</button>
          <button className={`toggle-btn${tab === 'pending' ? ' active' : ''}`} onClick={() => setTab('pending')}>Pending</button>
        </div>
        <ExportDropdown filename="USERS" columns={columns.filter((c) => c.key !== 'actions' && c.key !== 'photo')} rows={filtered} />
      </div>

      <DataTable columns={columns} rows={filtered} loading={loading} totalLabel={`TOTAL USERS: ${filtered.length}`} />

      {mode && (
        <WideModal
          title={mode === 'create' ? 'Create User' : mode === 'edit' ? 'Edit User' : 'View User'}
          onClose={close}
          footer={
            readOnly
              ? <button className="btn btn-outline" onClick={close}>Fermer</button>
              : (
                <>
                  <button className="btn btn-outline" onClick={close}>Cancel</button>
                  <button className="btn btn-primary" form="user-form" type="submit">{mode === 'create' ? 'Save' : 'Update'}</button>
                </>
              )
          }
        >
          {error && <div className="error-banner mb-3">{error}</div>}
          <form id="user-form" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 items-start">

              {/* General Information */}
              <div className="form-card lg:col-span-2">
                <div className="form-card-title"><User size={12} /> General Information</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {mode !== 'create' && <div className="form-group"><label>User Code</label><input disabled value={form.__codeUser || ''} /></div>}
                  <div className="form-group"><label>Username *</label><input required disabled={mode !== 'create'} value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></div>
                  <div className="form-group">
                    <label>Role *</label>
                    <SearchableSelect options={roleOptions} value={form.roleID} isDisabled={readOnly}
                      onChange={(v) => setForm({ ...form, roleID: v })} placeholder="Choisir…" />
                  </div>
                  {mode === 'create' && (
                    <>
                      <div className="form-group"><label>Password *</label><input type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
                      <div className="form-group"><label>Confirm Password *</label><input type="password" required value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} /></div>
                    </>
                  )}
                  {mode === 'edit' && <div className="form-group"><label>New Password</label><input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Laisser vide pour ne pas changer" /></div>}
                  <div className="form-group">
                    <label>User Type *</label>
                    <select required disabled={readOnly} value={form.typeUser} onChange={(e) => setForm({ ...form, typeUser: e.target.value })}>
                      <option value="">—</option>
                      {TYPE_USER_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Attachments */}
              <div className="form-card">
                <div className="form-card-title"><ImageIcon size={12} /> Attachments</div>
                <div className="flex items-center gap-3">
                  {form.photo ? <img src={form.photo} alt="" className="h-12 w-12 rounded-full object-cover border" /> : <div className="h-12 w-12 rounded-full border border-dashed flex items-center justify-center text-gray-300"><User size={18} /></div>}
                  {!readOnly && <label className="flex items-center gap-1.5 border border-dashed rounded px-2 py-1.5 text-[11px] cursor-pointer">
                    <Upload size={12} /> Photo<input type="file" accept="image/*" className="hidden" onChange={handleUpload('photo')} />
                  </label>}
                </div>
                <div className="flex items-center gap-3 mt-2">
                  {form.signe ? <img src={form.signe} alt="" className="h-10 w-16 object-contain border rounded bg-white" /> : <div className="h-10 w-16 border border-dashed rounded flex items-center justify-center text-gray-300 text-[9px]">Signature</div>}
                  {!readOnly && <label className="flex items-center gap-1.5 border border-dashed rounded px-2 py-1.5 text-[11px] cursor-pointer">
                    <Upload size={12} /> Signature<input type="file" accept="image/*" className="hidden" onChange={handleUpload('signe')} />
                  </label>}
                </div>
              </div>

              {/* Personal Information */}
              <div className="form-card lg:col-span-2">
                <div className="form-card-title"><Phone size={12} /> Personal Information</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="form-group"><label>First Name *</label><input required disabled={readOnly} value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} /></div>
                  <div className="form-group"><label>Last Name *</label><input required disabled={readOnly} value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} /></div>
                  <div className="form-group"><label>Email *</label><input type="email" required disabled={readOnly} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                  <div className="form-group"><label>Primary Phone *</label><input required disabled={readOnly} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                  <div className="form-group"><label>Secondary Phone</label><input disabled={readOnly} value={form.secondaryPhone} onChange={(e) => setForm({ ...form, secondaryPhone: e.target.value })} /></div>
                  <div className="form-group"><label>National ID (CNI)</label><input disabled={readOnly} value={form.cni} onChange={(e) => setForm({ ...form, cni: e.target.value })} /></div>
                  <div className="form-group sm:col-span-3"><label>Address</label><input disabled={readOnly} value={form.adresse} onChange={(e) => setForm({ ...form, adresse: e.target.value })} /></div>
                </div>
              </div>

              {/* Organization */}
              <div className="form-card">
                <div className="form-card-title"><Briefcase size={12} /> Organization</div>
                <div className="form-group">
                  <label>Institution (IMF)</label>
                  <SearchableSelect options={imfOptions} value={form.codeIMF} isDisabled={readOnly}
                    onChange={(v) => setForm({ ...form, codeIMF: v, agenceID: '' })} placeholder="Choisir une IMF…" />
                </div>
                <div className="form-group">
                  <label>Agency</label>
                  <SearchableSelect options={agencyOptionsForIMF} value={form.agenceID} isDisabled={readOnly || !form.codeIMF}
                    onChange={(v) => setForm({ ...form, agenceID: v })} placeholder="Choisir une agence…" />
                </div>
              </div>

              {/* Financial Settings */}
              <div className="form-card lg:col-span-2">
                <div className="form-card-title"><Wallet size={12} /> Financial Settings</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="form-group"><label>Maximum Debit</label><input type="number" disabled={readOnly} value={form.debitMax} onChange={(e) => setForm({ ...form, debitMax: e.target.value })} /></div>
                  <div className="form-group"><label>Maximum Credit</label><input type="number" disabled={readOnly} value={form.creditMax} onChange={(e) => setForm({ ...form, creditMax: e.target.value })} /></div>
                  <div className="form-group"><label>Validation Limit</label><input type="number" disabled={readOnly} value={form.validationMax} onChange={(e) => setForm({ ...form, validationMax: e.target.value })} /></div>
                  <div className="form-group"><label>Collection Ceiling</label><input type="number" disabled={readOnly} value={form.plafondCollect} onChange={(e) => setForm({ ...form, plafondCollect: e.target.value })} /></div>
                  <div className="form-group"><label>Security Deposit (Caution)</label><input type="number" disabled={readOnly} value={form.caution} onChange={(e) => setForm({ ...form, caution: e.target.value })} /></div>
                </div>
              </div>

              {/* Status + Audit */}
              <div className="form-card">
                <div className="form-card-title"><BadgeCheck size={12} /> Status & Audit</div>
                {mode === 'edit' ? (
                  <div className="form-group">
                    <label>Status</label>
                    <select value={form.statut} onChange={(e) => setForm({ ...form, statut: e.target.value })}>
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                    </select>
                  </div>
                ) : mode === 'view' ? (
                  <div className="form-group"><label>Status</label><StatusBadge status={form.statut} /></div>
                ) : (
                  <div className="text-[11px] text-gray-400">Statut initial : ACTIVE</div>
                )}
                {mode !== 'create' && (
                  <>
                    <div className="form-group"><label>Created By / Date</label><input disabled value={`${form.createdBy || ''} — ${form.createdDate ? new Date(form.createdDate).toLocaleDateString('fr-FR') : ''}`} /></div>
                    <div className="form-group"><label>Validated By / Date</label><input disabled value={`${form.userValidation || '—'} — ${form.dateValidation ? new Date(form.dateValidation).toLocaleDateString('fr-FR') : '—'}`} /></div>
                    <div className="form-group"><label>Last Modified By / Date</label><input disabled value={`${form.lastUserModif || '—'} — ${form.dateModification ? new Date(form.dateModification).toLocaleDateString('fr-FR') : '—'}`} /></div>
                    <div className="form-group"><label>Last Login</label><input disabled value={form.lastLogin ? new Date(form.lastLogin).toLocaleString('fr-FR') : '—'} /></div>
                  </>
                )}
              </div>
            </div>
          </form>
        </WideModal>
      )}
    </div>
  );
}
