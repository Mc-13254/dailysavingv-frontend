import { useEffect, useState } from 'react';
import { Eye, Pencil, Trash2, Upload, Building2, Phone, MapPin, Briefcase, BadgeCheck, ImageIcon } from 'lucide-react';
import DataTable from '../components/DataTable';
import WideModal from '../components/WideModal';
import StatusBadge from '../components/StatusBadge';
import ExportDropdown from '../components/ExportDropdown';
import SearchableSelect from '../components/SearchableSelect';
import { AgencyAPI, GeoAPI, IMFAPI, UserAPI } from '../api/endpoints';

const emptyForm = {
  codeAgence: '', nom: '', shortName: '', description: '', logoBase64: '',
  primaryPhone: '', secondaryPhone: '', email: '', website: '',
  paysID: '', villeID: '', address: '', postalCode: '',
  codeIMF: '', managerId: '', openingDate: '', statut: 'ACTIVE',
};

// mode: 'create' | 'edit' | 'view' | null
export default function AgencyManagement() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [mode, setMode] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [countries, setCountries] = useState([]);
  const [cities, setCities] = useState([]);
  const [imfs, setImfs] = useState([]);
  const [users, setUsers] = useState([]);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await AgencyAPI.list();
      setRows(data);
    } catch { setRows([]); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  useEffect(() => {
    GeoAPI.countries().then(({ data }) => setCountries(data)).catch(() => {});
    IMFAPI.list().then(({ data }) => setImfs(data.filter((i) => i.statut === 'ACTIVE'))).catch(() => {});
    UserAPI.list().then(({ data }) => setUsers(data)).catch(() => {});
  }, []);
  useEffect(() => {
    if (form.paysID) GeoAPI.cities(form.paysID).then(({ data }) => setCities(data)).catch(() => {});
    else setCities([]);
  }, [form.paysID]);

  const countryOptions = countries.map((c) => ({ value: c.paysID, label: c.nom }));
  const cityOptions = cities.map((c) => ({ value: c.villeID, label: c.nom }));
  const imfOptions = imfs.map((i) => ({ value: i.codeIMF, label: `${i.codeIMF} — ${i.libelle}` }));
  const managerOptions = users.map((u) => ({ value: u.codeUser, label: `${u.codeUser} — ${u.username}` }));

  const filtered = rows.filter((r) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return [r.codeAgence, r.nom, r.villeNom, r.imfNom]
      .some((v) => String(v || '').toLowerCase().includes(term));
  });

  const openCreate = () => {
    setMode('create');
    // Business rule: if exactly one active IMF exists, auto-select it.
    setForm({ ...emptyForm, codeIMF: imfs.length === 1 ? imfs[0].codeIMF : '' });
    setError('');
  };
  const openView = (row) => { setMode('view'); setForm(mapRowToForm(row)); };
  const openEdit = (row) => { setMode('edit'); setForm(mapRowToForm(row)); setError(''); };
  const close = () => { setMode(null); };

  function mapRowToForm(row) {
    return {
      __id: row.agenceID,
      codeAgence: row.codeAgence, nom: row.nom, shortName: row.shortName || '', description: row.description || '',
      logoBase64: row.logoBase64 || '',
      primaryPhone: row.primaryPhone || '', secondaryPhone: row.secondaryPhone || '', email: row.email || '', website: row.website || '',
      paysID: row.paysID || '', villeID: row.villeID || '', address: row.address || '', postalCode: row.postalCode || '',
      codeIMF: row.codeIMF, managerId: row.managerId || '', openingDate: row.openingDate ? row.openingDate.slice(0, 10) : '',
      statut: row.statut, createdBy: row.createdBy, dateCreated: row.dateCreated,
    };
  }

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, logoBase64: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (mode === 'create' && !form.codeIMF) {
      setError("Veuillez sélectionner une IMF valide et déjà validée avant de continuer.");
      return;
    }
    try {
      if (mode === 'create') {
        await AgencyAPI.create(form);
        setNotice('Agence soumise pour validation.');
      } else if (mode === 'edit') {
        await AgencyAPI.update(form.__id, form);
        setNotice('Modification soumise pour validation.');
      }
      close();
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de l'enregistrement.");
    }
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Voulez-vous vraiment supprimer l'agence ${row.codeAgence} ? Cette action est irréversible.`)) return;
    try {
      await AgencyAPI.remove(row.agenceID);
      setNotice('Suppression soumise pour validation.');
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de la suppression.');
    }
  };

  const columns = [
    { key: 'codeAgence', label: 'Code' },
    { key: 'nom', label: 'Agency' },
    { key: 'villeNom', label: 'City', render: (r) => r.villeNom || '—' },
    { key: 'managerNom', label: 'Manager', render: (r) => r.managerNom || '—' },
    { key: 'statut', label: 'Status', render: (r) => <StatusBadge status={r.statut} /> },
    { key: 'dateCreated', label: 'Created', render: (r) => r.dateCreated ? new Date(r.dateCreated).toLocaleDateString('fr-FR') : '—' },
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
        <div className="panel-title">Agency Management</div>
        <button className="btn btn-teal" onClick={openCreate}>+ Create Agency</button>
      </div>

      {notice && <div className="error-banner" style={{ background: '#dcfce7', color: '#16a34a' }}>{notice}</div>}

      <div className="toolbar">
        <input className="search-input" placeholder="Search Agency (code, nom, ville, IMF)…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <ExportDropdown filename="AGENCIES" columns={columns.filter((c) => c.key !== 'actions')} rows={filtered} />
      </div>

      <DataTable columns={columns} rows={filtered} loading={loading} totalLabel={`TOTAL AGENCIES: ${filtered.length}`} />

      {mode && (
        <WideModal
          title={mode === 'create' ? 'Create Agency' : mode === 'edit' ? 'Edit Agency' : 'View Agency'}
          onClose={close}
          footer={
            readOnly
              ? <button className="btn btn-outline" onClick={close}>Fermer</button>
              : (
                <>
                  <button className="btn btn-outline" onClick={close}>Cancel</button>
                  <button className="btn btn-teal" form="agency-form" type="submit">{mode === 'create' ? 'Save' : 'Update'}</button>
                </>
              )
          }
        >
          {error && <div className="error-banner mb-3">{error}</div>}
          <form id="agency-form" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 items-start">

              {/* General Information */}
              <div className="form-card lg:col-span-2">
                <div className="form-card-title"><Building2 size={12} /> General Information</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="form-group"><label>Agency Code *</label><input required disabled={mode !== 'create'} value={form.codeAgence} onChange={(e) => setForm({ ...form, codeAgence: e.target.value })} placeholder="AG-2026-001" /></div>
                  <div className="form-group sm:col-span-2"><label>Agency Name *</label><input required disabled={readOnly} value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} /></div>
                  <div className="form-group sm:col-span-3"><label>Short Name</label><input disabled={readOnly} value={form.shortName} onChange={(e) => setForm({ ...form, shortName: e.target.value })} /></div>
                </div>
                <div className="form-group"><label>Description</label><textarea rows={1} disabled={readOnly} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              </div>

              {/* Logo */}
              <div className="form-card">
                <div className="form-card-title"><ImageIcon size={12} /> Logo</div>
                <div className="flex items-center gap-3">
                  {form.logoBase64 ? (
                    <img src={form.logoBase64} alt="Logo" className="h-14 w-14 object-cover rounded border border-gray-300 bg-white" />
                  ) : (
                    <div className="h-14 w-14 rounded border border-dashed border-gray-300 flex items-center justify-center text-gray-300">
                      <ImageIcon size={20} />
                    </div>
                  )}
                  {!readOnly && (
                    <label className="flex items-center gap-1.5 border border-dashed border-gray-300 rounded px-2.5 py-2 text-[11px] cursor-pointer hover:border-brand-blue">
                      <Upload size={13} /> {form.logoBase64 ? 'Change' : 'Upload'}
                      <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                    </label>
                  )}
                </div>
              </div>

              {/* Contact */}
              <div className="form-card">
                <div className="form-card-title"><Phone size={12} /> Contact</div>
                <div className="form-group"><label>Primary Phone</label><input disabled={readOnly} value={form.primaryPhone} onChange={(e) => setForm({ ...form, primaryPhone: e.target.value })} /></div>
                <div className="form-group"><label>Secondary Phone</label><input disabled={readOnly} value={form.secondaryPhone} onChange={(e) => setForm({ ...form, secondaryPhone: e.target.value })} /></div>
                <div className="form-group"><label>Email</label><input type="email" disabled={readOnly} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                <div className="form-group"><label>Website</label><input disabled={readOnly} value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} /></div>
              </div>

              {/* Location */}
              <div className="form-card">
                <div className="form-card-title"><MapPin size={12} /> Location</div>
                <div className="form-group">
                  <label>Country</label>
                  <SearchableSelect options={countryOptions} value={form.paysID} isDisabled={readOnly}
                    onChange={(v) => setForm({ ...form, paysID: v, villeID: '' })} placeholder="Choisir un pays…" />
                </div>
                <div className="form-group">
                  <label>City</label>
                  <SearchableSelect options={cityOptions} value={form.villeID} isDisabled={readOnly || !form.paysID}
                    onChange={(v) => setForm({ ...form, villeID: v })} placeholder="Choisir une ville…" />
                </div>
                <div className="form-group"><label>Address</label><input disabled={readOnly} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
                <div className="form-group"><label>Postal Code</label><input disabled={readOnly} value={form.postalCode} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} /></div>
              </div>

              {/* Organization */}
              <div className="form-card lg:col-span-2">
                <div className="form-card-title"><Briefcase size={12} /> Organization</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="form-group sm:col-span-2">
                    <label>IMF *</label>
                    <SearchableSelect options={imfOptions} value={form.codeIMF} isDisabled={readOnly || mode === 'edit'}
                      onChange={(v) => setForm({ ...form, codeIMF: v })} placeholder="Choisir une IMF…" />
                    {imfs.length === 1 && mode === 'create' && <p className="text-[10px] text-gray-400 mt-1">Sélection automatique — une seule IMF active existe.</p>}
                  </div>
                  <div className="form-group">
                    <label>Manager</label>
                    <SearchableSelect options={managerOptions} value={form.managerId} isDisabled={readOnly}
                      onChange={(v) => setForm({ ...form, managerId: v })} placeholder="Choisir…" />
                  </div>
                  <div className="form-group"><label>Opening Date</label><input type="date" disabled={readOnly} value={form.openingDate} onChange={(e) => setForm({ ...form, openingDate: e.target.value })} /></div>
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
                    <div className="form-group"><label>Created By</label><input disabled value={form.createdBy || ''} /></div>
                    <div className="form-group"><label>Created Date</label><input disabled value={form.dateCreated ? new Date(form.dateCreated).toLocaleDateString('fr-FR') : ''} /></div>
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
