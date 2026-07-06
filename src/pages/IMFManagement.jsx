import { useEffect, useState } from 'react';
import { Eye, Pencil, Trash2, Upload, Building2, Phone, MapPin, Settings2, BadgeCheck, ImageIcon } from 'lucide-react';
import DataTable from '../components/DataTable';
import WideModal from '../components/WideModal';
import StatusBadge from '../components/StatusBadge';
import ExportDropdown from '../components/ExportDropdown';
import SearchableSelect from '../components/SearchableSelect';
import { IMFAPI, GeoAPI } from '../api/endpoints';

const emptyForm = {
  codeIMF: '', libelle: '', shortName: '', registrationNumber: '', taxNumber: '', description: '', logoBase64: '',
  primaryPhone: '', secondaryPhone: '', email: '', website: '',
  paysID: '', villeID: '', address: '', postalCode: '',
  currencyCode: '', language: '', timezone: '',
  tauxTaxe: 0, assujettiTaxe: false, suffixeCompte: '', prefixeCompte: '', tailleCompte: 10, calculCommission: true,
  statut: 'ACTIVE',
};

// mode: 'create' | 'edit' | 'view' | null
export default function IMFManagement() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [mode, setMode] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [countries, setCountries] = useState([]);
  const [cities, setCities] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [timezones, setTimezones] = useState([]);
  const [hasActive, setHasActive] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [{ data }, { data: active }] = await Promise.all([IMFAPI.list(), IMFAPI.hasActive()]);
      setRows(data);
      setHasActive(active);
    } catch { setRows([]); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  useEffect(() => {
    GeoAPI.countries().then(({ data }) => setCountries(data)).catch(() => {});
    GeoAPI.currencies().then(({ data }) => setCurrencies(data)).catch(() => {});
    GeoAPI.languages().then(({ data }) => setLanguages(data)).catch(() => {});
    GeoAPI.timezones().then(({ data }) => setTimezones(data)).catch(() => {});
  }, []);
  useEffect(() => {
    if (form.paysID) GeoAPI.cities(form.paysID).then(({ data }) => setCities(data)).catch(() => {});
    else setCities([]);
  }, [form.paysID]);

  const countryOptions = countries.map((c) => ({ value: c.paysID, label: c.nom }));
  const cityOptions = cities.map((c) => ({ value: c.villeID, label: c.nom }));
  const currencyOptions = currencies.map((c) => ({ value: c.currencyCode, label: `${c.currencyCode} — ${c.nom}` }));
  const languageOptions = languages.map((l) => ({ value: l.languageCode, label: l.nom }));
  const timezoneOptions = timezones.map((tz) => ({ value: tz.code, label: `${tz.label} (${tz.utcOffset})` }));

  // Dynamic search: Code, Name, Phone, Email, City — filters as you type, no button
  const filtered = rows.filter((r) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return [r.codeIMF, r.libelle, r.primaryPhone, r.email, r.villeNom]
      .some((v) => String(v || '').toLowerCase().includes(term));
  });

  const openCreate = () => { setMode('create'); setForm(emptyForm); setError(''); };
  const openView = (row) => { setMode('view'); setForm(mapRowToForm(row)); };
  const openEdit = (row) => { setMode('edit'); setForm(mapRowToForm(row)); setError(''); };
  const close = () => { setMode(null); };

  function mapRowToForm(row) {
    return {
      codeIMF: row.codeIMF, libelle: row.libelle, shortName: row.shortName || '',
      registrationNumber: row.registrationNumber || '', taxNumber: row.taxNumber || '',
      description: row.description || '', logoBase64: row.logoBase64 || '',
      primaryPhone: row.primaryPhone || '', secondaryPhone: row.secondaryPhone || '',
      email: row.email || '', website: row.website || '',
      paysID: row.paysID || '', villeID: row.villeID || '', address: row.address || '', postalCode: row.postalCode || '',
      currencyCode: row.currencyCode || '', language: row.language || '', timezone: row.timezone || '',
      tauxTaxe: row.tauxTaxe, assujettiTaxe: row.assujettiTaxe, suffixeCompte: row.suffixeCompte || '',
      prefixeCompte: row.prefixeCompte || '', tailleCompte: row.tailleCompte, calculCommission: row.calculCommission,
      statut: row.statut, createdBy: row.createdBy, dateCreation: row.dateCreation,
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
    try {
      if (mode === 'create') {
        await IMFAPI.create(form);
        setNotice('IMF soumis pour validation.');
      } else if (mode === 'edit') {
        await IMFAPI.update(form.codeIMF, form);
        setNotice('Modification soumise pour validation.');
      }
      close();
      load();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Erreur lors de l'enregistrement.");
    }
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Voulez-vous vraiment supprimer l'IMF ${row.codeIMF} ? Cette action est irréversible.`)) return;
    try {
      await IMFAPI.remove(row.codeIMF);
      setNotice('Suppression soumise pour validation.');
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de la suppression.');
    }
  };

  const columns = [
    { key: 'codeIMF', label: 'Code' },
    { key: 'libelle', label: 'Nom IMF' },
    { key: 'villeNom', label: 'Ville', render: (r) => r.villeNom || '—' },
    { key: 'primaryPhone', label: 'Téléphone', render: (r) => r.primaryPhone || '—' },
    { key: 'statut', label: 'Statut', render: (r) => <StatusBadge status={r.statut} /> },
    { key: 'dateCreation', label: 'Date création', render: (r) => r.dateCreation ? new Date(r.dateCreation).toLocaleDateString('fr-FR') : '—' },
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
        <div className="panel-title">IMF Management</div>
        <div className="flex flex-col items-end gap-1">
          <button className="btn btn-primary" onClick={openCreate} disabled={hasActive} title={hasActive ? 'Une IMF active existe déjà' : ''}>
            + Create IMF
          </button>
          {hasActive && <span className="text-[10px] text-gray-400 normal-case">Une IMF active existe déjà — modifiez-la plutôt.</span>}
        </div>
      </div>

      {notice && <div className="error-banner" style={{ background: '#dcfce7', color: '#16a34a' }}>{notice}</div>}

      <div className="toolbar">
        <input className="search-input" placeholder="Search IMF (code, nom, tél, email, ville)…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <ExportDropdown filename="IMF" columns={columns.filter((c) => c.key !== 'actions')} rows={filtered} />
      </div>

      <DataTable columns={columns} rows={filtered} loading={loading} totalLabel={`TOTAL IMF: ${filtered.length}`} />

      {mode && (
        <WideModal
          title={mode === 'create' ? 'Create IMF' : mode === 'edit' ? 'Edit IMF' : 'View IMF'}
          onClose={close}
          footer={
            readOnly
              ? <button className="btn btn-outline" onClick={close}>Fermer</button>
              : (
                <>
                  <button className="btn btn-outline" onClick={close}>Cancel</button>
                  <button className="btn btn-primary" form="imf-form" type="submit">{mode === 'create' ? 'Save' : 'Update'}</button>
                </>
              )
          }
        >
          {error && <div className="error-banner mb-3">{error}</div>}
          <form id="imf-form" onSubmit={handleSubmit}>
            {/* Dashboard-style grid of cards: 3 columns on large screens so everything fits without scrolling */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 items-start">

              {/* General Information */}
              <div className="form-card lg:col-span-2">
                <div className="form-card-title"><Building2 size={12} /> General Information</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="form-group"><label>IMF Code *</label><input required disabled={mode !== 'create'} value={form.codeIMF} onChange={(e) => setForm({ ...form, codeIMF: e.target.value })} placeholder="IMF001" /></div>
                  <div className="form-group sm:col-span-2"><label>IMF Name *</label><input required disabled={readOnly} value={form.libelle} onChange={(e) => setForm({ ...form, libelle: e.target.value })} /></div>
                  <div className="form-group"><label>Short Name</label><input disabled={readOnly} value={form.shortName} onChange={(e) => setForm({ ...form, shortName: e.target.value })} /></div>
                  <div className="form-group"><label>Registration Number</label><input disabled={mode !== 'create'} value={form.registrationNumber} onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })} /></div>
                  <div className="form-group"><label>Tax Number</label><input disabled={readOnly} value={form.taxNumber} onChange={(e) => setForm({ ...form, taxNumber: e.target.value })} /></div>
                  <div className="form-group sm:col-span-3"><label>Description</label><textarea rows={1} disabled={readOnly} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
                </div>
              </div>

              {/* Logo Upload */}
              <div className="form-card">
                <div className="form-card-title"><ImageIcon size={12} /> Logo Upload</div>
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

              {/* Contact Information */}
              <div className="form-card">
                <div className="form-card-title"><Phone size={12} /> Contact Information</div>
                <div className="form-group"><label>Primary Phone *</label><input required disabled={readOnly} value={form.primaryPhone} onChange={(e) => setForm({ ...form, primaryPhone: e.target.value })} /></div>
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

              {/* Business Settings */}
              <div className="form-card lg:col-span-2">
                <div className="form-card-title"><Settings2 size={12} /> Business Settings</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="form-group">
                    <label>Default Currency *</label>
                    <SearchableSelect options={currencyOptions} value={form.currencyCode} isDisabled={readOnly}
                      onChange={(v) => setForm({ ...form, currencyCode: v })} placeholder="Devise…" />
                  </div>
                  <div className="form-group">
                    <label>Language *</label>
                    <SearchableSelect options={languageOptions} value={form.language} isDisabled={readOnly}
                      onChange={(v) => setForm({ ...form, language: v })} placeholder="Langue…" />
                  </div>
                  <div className="form-group">
                    <label>Timezone *</label>
                    <SearchableSelect options={timezoneOptions} value={form.timezone} isDisabled={readOnly}
                      onChange={(v) => setForm({ ...form, timezone: v })} placeholder="Fuseau…" />
                  </div>
                  <div className="form-group"><label>Préfixe Compte</label><input disabled={readOnly} value={form.prefixeCompte} onChange={(e) => setForm({ ...form, prefixeCompte: e.target.value })} /></div>
                  <div className="form-group"><label>Suffixe Compte</label><input disabled={readOnly} value={form.suffixeCompte} onChange={(e) => setForm({ ...form, suffixeCompte: e.target.value })} /></div>
                  <div className="form-group"><label>Taille Compte</label><input type="number" disabled={readOnly} value={form.tailleCompte} onChange={(e) => setForm({ ...form, tailleCompte: Number(e.target.value) })} /></div>
                  <div className="form-group"><label>Taux Taxe (%)</label><input type="number" step="0.01" disabled={readOnly} value={form.tauxTaxe} onChange={(e) => setForm({ ...form, tauxTaxe: Number(e.target.value) })} /></div>
                  <div className="form-group flex-row items-center gap-2 sm:col-span-2">
                    <label className="!mb-0">Assujetti Taxe</label>
                    <input type="checkbox" disabled={readOnly} checked={form.assujettiTaxe} onChange={(e) => setForm({ ...form, assujettiTaxe: e.target.checked })} className="w-4 h-4" />
                  </div>
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
                      <option value="INACTIF">Inactive</option>
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
                    <div className="form-group"><label>Created Date</label><input disabled value={form.dateCreation ? new Date(form.dateCreation).toLocaleDateString('fr-FR') : ''} /></div>
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
