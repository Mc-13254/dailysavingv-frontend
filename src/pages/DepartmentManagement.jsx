import { useEffect, useState } from 'react';
import { Eye, Pencil, Trash2, Building2, Briefcase, BadgeCheck } from 'lucide-react';
import DataTable from '../components/DataTable';
import WideModal from '../components/WideModal';
import StatusBadge from '../components/StatusBadge';
import ExportDropdown from '../components/ExportDropdown';
import SearchableSelect from '../components/SearchableSelect';
import { DepartmentAPI, IMFAPI, AgencyAPI, UserAPI } from '../api/endpoints';

const emptyForm = { departmentName: '', shortName: '', description: '', codeIMF: '', agenceID: '', managerId: '', statut: 'ACTIVE' };

// mode: 'create' | 'edit' | 'view' | null
export default function DepartmentManagement() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [mode, setMode] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [imfs, setImfs] = useState([]);
  const [agencies, setAgencies] = useState([]);
  const [users, setUsers] = useState([]);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await DepartmentAPI.list();
      setRows(data);
    } catch { setRows([]); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  useEffect(() => {
    IMFAPI.list().then(({ data }) => setImfs(data.filter((i) => i.statut === 'ACTIVE'))).catch(() => {});
    AgencyAPI.list().then(({ data }) => setAgencies(data.filter((a) => a.statut === 'ACTIVE'))).catch(() => {});
    UserAPI.list().then(({ data }) => setUsers(data.filter((u) => ['Manager', 'Supervisor'].includes(u.typeUser)))).catch(() => {});
  }, []);

  const imfOptions = imfs.map((i) => ({ value: i.codeIMF, label: `${i.codeIMF} — ${i.libelle}` }));
  const agencyOptionsForIMF = agencies.filter((a) => a.codeIMF === form.codeIMF).map((a) => ({ value: a.agenceID, label: a.nom }));
  const managerOptions = users.map((u) => ({ value: u.codeUser, label: `${u.codeUser} — ${u.firstName || ''} ${u.lastName || ''} (${u.typeUser})` }));

  const filtered = rows.filter((r) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return [r.departmentCode, r.departmentName, r.agenceNom, r.imfNom, r.statut]
      .some((v) => String(v || '').toLowerCase().includes(term));
  });

  const openCreate = () => { setMode('create'); setForm(emptyForm); setError(''); };
  const openView = (row) => { setMode('view'); setForm(mapRowToForm(row)); };
  const openEdit = (row) => { setMode('edit'); setForm(mapRowToForm(row)); setError(''); };
  const close = () => setMode(null);

  function mapRowToForm(row) {
    return {
      __id: row.departmentID, code: row.departmentCode, departmentName: row.departmentName,
      shortName: row.shortName || '', description: row.description || '',
      codeIMF: row.codeIMF, agenceID: row.agenceID, managerId: row.managerId || '',
      statut: row.statut, createdBy: row.createdBy, createdDate: row.createdDate,
      updatedBy: row.updatedBy, updatedDate: row.updatedDate,
    };
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.agenceID) { setError('Veuillez choisir une agence.'); return; }
    try {
      if (mode === 'create') {
        await DepartmentAPI.create({
          departmentName: form.departmentName, shortName: form.shortName, description: form.description,
          codeIMF: form.codeIMF, agenceID: form.agenceID, managerId: form.managerId || null,
        });
        setNotice('Département soumis pour validation.');
      } else if (mode === 'edit') {
        await DepartmentAPI.update(form.__id, {
          departmentName: form.departmentName, shortName: form.shortName, description: form.description,
          agenceID: form.agenceID, managerId: form.managerId || null, statut: form.statut,
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
    if (!window.confirm(`Voulez-vous vraiment supprimer le département ${row.departmentName} ?`)) return;
    try {
      await DepartmentAPI.remove(row.departmentID);
      setNotice('Suppression soumise pour validation.');
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de la suppression.');
    }
  };

  const columns = [
    { key: 'departmentCode', label: 'Code' },
    { key: 'departmentName', label: 'Department Name' },
    { key: 'agenceNom', label: 'Agency' },
    { key: 'imfNom', label: 'IMF' },
    { key: 'managerNom', label: 'Manager', render: (r) => r.managerNom || '—' },
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
        <div className="panel-title">Department Management</div>
        <button className="btn btn-primary" onClick={openCreate}>+ Create Department</button>
      </div>

      {notice && <div className="error-banner" style={{ background: '#dcfce7', color: '#16a34a' }}>{notice}</div>}

      <div className="toolbar">
        <input className="search-input" placeholder="Search Department (code, nom, agence, IMF, statut)…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <ExportDropdown filename="DEPARTMENTS" columns={columns.filter((c) => c.key !== 'actions')} rows={filtered} />
      </div>

      <DataTable columns={columns} rows={filtered} loading={loading} totalLabel={`TOTAL DEPARTMENTS: ${filtered.length}`} />

      {mode && (
        <WideModal
          title={mode === 'create' ? 'Create Department' : mode === 'edit' ? 'Edit Department' : 'View Department'}
          onClose={close}
          footer={
            readOnly
              ? <button className="btn btn-outline" onClick={close}>Fermer</button>
              : (
                <>
                  <button className="btn btn-outline" onClick={close}>Cancel</button>
                  <button className="btn btn-primary" form="department-form" type="submit">{mode === 'create' ? 'Save' : 'Update'}</button>
                </>
              )
          }
        >
          {error && <div className="error-banner mb-3">{error}</div>}
          <form id="department-form" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 items-start">

              {/* General Information */}
              <div className="form-card lg:col-span-2">
                <div className="form-card-title"><Building2 size={12} /> General Information</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {mode !== 'create' && <div className="form-group"><label>Department Code</label><input disabled value={form.code || ''} /></div>}
                  <div className="form-group sm:col-span-2"><label>Department Name *</label><input required disabled={readOnly} value={form.departmentName} onChange={(e) => setForm({ ...form, departmentName: e.target.value })} placeholder="Operations" /></div>
                  <div className="form-group"><label>Short Name</label><input disabled={readOnly} value={form.shortName} onChange={(e) => setForm({ ...form, shortName: e.target.value })} /></div>
                </div>
                <div className="form-group"><label>Description</label><textarea rows={2} disabled={readOnly} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              </div>

              {/* Organization */}
              <div className="form-card">
                <div className="form-card-title"><Briefcase size={12} /> Organization</div>
                <div className="form-group">
                  <label>Institution (IMF) *</label>
                  <SearchableSelect options={imfOptions} value={form.codeIMF} isDisabled={readOnly || mode === 'edit'}
                    onChange={(v) => setForm({ ...form, codeIMF: v, agenceID: '' })} placeholder="Choisir une IMF…" />
                </div>
                <div className="form-group">
                  <label>Agency *</label>
                  <SearchableSelect options={agencyOptionsForIMF} value={form.agenceID} isDisabled={readOnly || !form.codeIMF}
                    onChange={(v) => setForm({ ...form, agenceID: v })} placeholder="Choisir une agence…" />
                </div>
                <div className="form-group">
                  <label>Department Manager</label>
                  <SearchableSelect options={managerOptions} value={form.managerId} isDisabled={readOnly}
                    onChange={(v) => setForm({ ...form, managerId: v })} placeholder="Optionnel…" />
                  <p className="text-[10px] text-gray-400 mt-1">Seuls les utilisateurs Manager/Supervisor apparaissent.</p>
                </div>
              </div>

              {/* Status + Audit */}
              <div className="form-card lg:col-span-3">
                <div className="form-card-title"><BadgeCheck size={12} /> Status & Audit</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
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
                    <div className="text-[11px] text-gray-400 sm:col-span-3">Statut initial : ACTIVE</div>
                  )}
                  {mode !== 'create' && (
                    <>
                      <div className="form-group"><label>Created By / Date</label><input disabled value={`${form.createdBy || ''} — ${form.createdDate ? new Date(form.createdDate).toLocaleDateString('fr-FR') : ''}`} /></div>
                      <div className="form-group"><label>Updated By / Date</label><input disabled value={`${form.updatedBy || '—'} — ${form.updatedDate ? new Date(form.updatedDate).toLocaleDateString('fr-FR') : '—'}`} /></div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </form>
        </WideModal>
      )}
    </div>
  );
}
