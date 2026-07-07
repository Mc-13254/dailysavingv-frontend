import { useEffect, useMemo, useState } from 'react';
import { Eye, Pencil, Trash2, Hash, Settings2, RefreshCw, BadgeCheck } from 'lucide-react';
import DataTable from '../components/DataTable';
import WideModal from '../components/WideModal';
import StatusBadge from '../components/StatusBadge';
import ExportDropdown from '../components/ExportDropdown';
import { NumberingParameterAPI } from '../api/endpoints';

const ENTITY_OPTIONS = [
  'Agency', 'Department', 'Role', 'User', 'Collector', 'Client',
  'Contract', 'Transaction', 'Receipt', 'Commission', 'Collection', 'SavingAccount',
];
const SEPARATOR_OPTIONS = [
  { value: '', label: 'No Separator' },
  { value: '-', label: '-' },
  { value: '/', label: '/' },
  { value: '.', label: '.' },
  { value: '_', label: '_' },
];
const LENGTH_OPTIONS = [4, 5, 6, 7, 8];
const RESET_OPTIONS = ['Never', 'Daily', 'Monthly', 'Yearly'];

const emptyForm = {
  entityName: '', prefix: '', suffix: '', separator: '',
  startingNumber: 1, numberLength: 6, paddingCharacter: '0',
  allowReset: false, resetFrequency: 'Never', nextResetDate: '',
  autoIncrement: true, incrementValue: 1, statut: 'ACTIVE',
};

// mode: 'create' | 'edit' | 'view' | null
export default function NumberingParameterManagement() {
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
      const { data } = await NumberingParameterAPI.list();
      setRows(data);
    } catch { setRows([]); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const filtered = rows.filter((r) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return [r.entityName, r.prefix, r.preview, r.statut].some((v) => String(v || '').toLowerCase().includes(term));
  });

  const livePreview = useMemo(() => {
    const num = (form.startingNumber || 1).toString().padStart(form.numberLength || 6, (form.paddingCharacter || '0')[0] || '0');
    const sep = form.separator || '';
    return `${form.prefix || 'PREFIX'}${sep}${num}${form.suffix ? sep + form.suffix : ''}`;
  }, [form.prefix, form.suffix, form.separator, form.startingNumber, form.numberLength, form.paddingCharacter]);

  const openCreate = () => { setMode('create'); setForm(emptyForm); setError(''); };
  const openView = (row) => { setMode('view'); setForm(mapRowToForm(row)); };
  const openEdit = (row) => { setMode('edit'); setForm(mapRowToForm(row)); setError(''); };
  const close = () => setMode(null);

  function mapRowToForm(row) {
    return {
      __id: row.numberingParameterID, entityName: row.entityName, prefix: row.prefix,
      suffix: row.suffix || '', separator: row.separator || '',
      startingNumber: row.startingNumber, currentNumber: row.currentNumber,
      numberLength: row.numberLength, paddingCharacter: row.paddingCharacter || '0',
      allowReset: row.allowReset, resetFrequency: row.resetFrequency || 'Never',
      nextResetDate: row.nextResetDate ? row.nextResetDate.slice(0, 10) : '',
      autoIncrement: row.autoIncrement, incrementValue: row.incrementValue,
      statut: row.statut, preview: row.preview,
      createdBy: row.createdBy, createdDate: row.createdDate,
      updatedBy: row.updatedBy, updatedDate: row.updatedDate,
    };
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (mode === 'create') {
        await NumberingParameterAPI.create({
          entityName: form.entityName, prefix: form.prefix, suffix: form.suffix || null, separator: form.separator,
          startingNumber: Number(form.startingNumber), numberLength: Number(form.numberLength), paddingCharacter: form.paddingCharacter,
          allowReset: form.allowReset, resetFrequency: form.resetFrequency, nextResetDate: form.nextResetDate || null,
          autoIncrement: form.autoIncrement, incrementValue: Number(form.incrementValue),
        });
        setNotice('Règle de numérotation créée.');
      } else if (mode === 'edit') {
        await NumberingParameterAPI.update(form.__id, {
          prefix: form.prefix, suffix: form.suffix || null, separator: form.separator,
          numberLength: Number(form.numberLength), paddingCharacter: form.paddingCharacter,
          allowReset: form.allowReset, resetFrequency: form.resetFrequency, nextResetDate: form.nextResetDate || null,
          autoIncrement: form.autoIncrement, incrementValue: Number(form.incrementValue), statut: form.statut,
        });
        setNotice('Règle de numérotation modifiée.');
      }
      close();
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de l'enregistrement.");
    }
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Désactiver la règle de numérotation pour ${row.entityName} ?`)) return;
    try {
      await NumberingParameterAPI.remove(row.numberingParameterID);
      setNotice('Règle désactivée.');
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de la suppression.');
    }
  };

  const columns = [
    { key: 'entityName', label: 'Entity' },
    { key: 'prefix', label: 'Prefix' },
    { key: 'suffix', label: 'Suffix', render: (r) => r.suffix || '—' },
    { key: 'currentNumber', label: 'Current Number' },
    { key: 'numberLength', label: 'Length' },
    { key: 'separator', label: 'Separator', render: (r) => r.separator || '—' },
    { key: 'preview', label: 'Preview', render: (r) => <span className="font-mono text-[11px] bg-gray-100 px-1.5 py-0.5 rounded">{r.preview}</span> },
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
  const usedEntities = rows.map((r) => r.entityName);
  const entityOptionsForCreate = ENTITY_OPTIONS.filter((e) => !usedEntities.includes(e));

  return (
    <div className="panel">
      <div className="panel-header">
        <div className="panel-title">Numbering Parameters</div>
        <button className="btn btn-primary" onClick={openCreate}>+ Create Numbering Rule</button>
      </div>

      {notice && <div className="error-banner" style={{ background: '#dcfce7', color: '#16a34a' }}>{notice}</div>}

      <div className="toolbar">
        <input className="search-input" placeholder="Search Numbering Rule (entity, préfixe, aperçu)…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <ExportDropdown filename="NUMBERING_PARAMETERS" columns={columns.filter((c) => c.key !== 'actions')} rows={filtered} />
      </div>

      <DataTable columns={columns} rows={filtered} loading={loading} totalLabel={`TOTAL RULES: ${filtered.length}`} />

      {mode && (
        <WideModal
          title={mode === 'create' ? 'Create Numbering Rule' : mode === 'edit' ? 'Edit Numbering Rule' : 'View Numbering Rule'}
          onClose={close}
          footer={
            readOnly
              ? <button className="btn btn-outline" onClick={close}>Fermer</button>
              : (
                <>
                  <button className="btn btn-outline" onClick={close}>Cancel</button>
                  <button className="btn btn-primary" form="numbering-form" type="submit">{mode === 'create' ? 'Save' : 'Update'}</button>
                </>
              )
          }
        >
          {error && <div className="error-banner mb-3">{error}</div>}
          <form id="numbering-form" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 items-start">

              {/* Entity Information */}
              <div className="form-card">
                <div className="form-card-title"><Hash size={12} /> Entity Information</div>
                <div className="form-group">
                  <label>Entity *</label>
                  {mode === 'create' ? (
                    <select required value={form.entityName} onChange={(e) => setForm({ ...form, entityName: e.target.value })}>
                      <option value="">—</option>
                      {entityOptionsForCreate.map((e) => <option key={e} value={e}>{e}</option>)}
                    </select>
                  ) : (
                    <input disabled value={form.entityName} />
                  )}
                </div>
                <div className="text-[10px] text-gray-400">L'entité ne peut plus être modifiée après création.</div>
              </div>

              {/* Number Format */}
              <div className="form-card lg:col-span-2">
                <div className="form-card-title"><Settings2 size={12} /> Number Format</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="form-group"><label>Prefix *</label><input required disabled={readOnly} value={form.prefix} onChange={(e) => setForm({ ...form, prefix: e.target.value.toUpperCase() })} placeholder="CLI" /></div>
                  <div className="form-group">
                    <label>Separator</label>
                    <select disabled={readOnly} value={form.separator} onChange={(e) => setForm({ ...form, separator: e.target.value })}>
                      {SEPARATOR_OPTIONS.map((s) => <option key={s.label} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>
                  <div className="form-group"><label>Suffix</label><input disabled={readOnly} value={form.suffix} onChange={(e) => setForm({ ...form, suffix: e.target.value })} /></div>

                  {mode === 'create' ? (
                    <div className="form-group"><label>Starting Number *</label><input type="number" required min={1} value={form.startingNumber} onChange={(e) => setForm({ ...form, startingNumber: e.target.value })} /></div>
                  ) : (
                    <div className="form-group"><label>Current Number</label><input disabled value={form.currentNumber ?? 0} /></div>
                  )}
                  <div className="form-group">
                    <label>Number Length</label>
                    <select disabled={readOnly} value={form.numberLength} onChange={(e) => setForm({ ...form, numberLength: e.target.value })}>
                      {LENGTH_OPTIONS.map((l) => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Padding Character</label>
                    <select disabled={readOnly} value={form.paddingCharacter} onChange={(e) => setForm({ ...form, paddingCharacter: e.target.value })}>
                      <option value="0">0</option>
                      <option value=" ">Space</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Preview</label>
                  <div className="font-mono text-sm font-bold bg-brand-blue/10 text-brand-blue px-3 py-2 rounded-md w-fit">
                    {mode === 'view' ? form.preview : livePreview}
                  </div>
                </div>
              </div>

              {/* Advanced Settings */}
              <div className="form-card lg:col-span-2">
                <div className="form-card-title"><RefreshCw size={12} /> Advanced Settings</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <label className="flex items-center gap-2 text-[12px]"><input type="checkbox" disabled={readOnly} checked={form.allowReset} onChange={(e) => setForm({ ...form, allowReset: e.target.checked })} /> Allow Reset</label>
                  <div className="form-group">
                    <label>Reset Frequency</label>
                    <select disabled={readOnly || !form.allowReset} value={form.resetFrequency} onChange={(e) => setForm({ ...form, resetFrequency: e.target.value })}>
                      {RESET_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div className="form-group"><label>Next Reset Date</label><input type="date" disabled={readOnly || !form.allowReset} value={form.nextResetDate} onChange={(e) => setForm({ ...form, nextResetDate: e.target.value })} /></div>
                  <label className="flex items-center gap-2 text-[12px]"><input type="checkbox" disabled={readOnly} checked={form.autoIncrement} onChange={(e) => setForm({ ...form, autoIncrement: e.target.checked })} /> Auto Increment</label>
                  <div className="form-group"><label>Increment Value</label><input type="number" min={1} disabled={readOnly} value={form.incrementValue} onChange={(e) => setForm({ ...form, incrementValue: e.target.value })} /></div>
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
                    <div className="form-group"><label>Updated By / Date</label><input disabled value={`${form.updatedBy || '—'} — ${form.updatedDate ? new Date(form.updatedDate).toLocaleDateString('fr-FR') : '—'}`} /></div>
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
