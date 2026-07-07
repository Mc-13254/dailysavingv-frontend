import { useEffect, useState } from 'react';
import { Eye, Pencil, Trash2, FileSignature, Settings2, BadgeCheck } from 'lucide-react';
import DataTable from '../components/DataTable';
import WideModal from '../components/WideModal';
import StatusBadge from '../components/StatusBadge';
import ExportDropdown from '../components/ExportDropdown';
import { ContractTypeAPI } from '../api/endpoints';

const DURATION_UNITS = ['Days', 'Weeks', 'Months', 'Years'];

const emptyForm = {
  contractName: '', shortName: '', description: '',
  allowDailyCollection: false, allowWeeklyCollection: false, allowMonthlyCollection: false,
  minimumCollectionAmount: '', maximumCollectionAmount: '', defaultCollectionAmount: '',
  minimumOpeningBalance: '', maximumBalance: '', interestRate: '',
  contractDuration: '', durationUnit: 'Months', penaltyAmount: '', gracePeriod: '',
  statut: 'ACTIVE',
};

// mode: 'create' | 'edit' | 'view' | null
export default function ContractTypeManagement() {
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
      const { data } = await ContractTypeAPI.list();
      setRows(data);
    } catch { setRows([]); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const filtered = rows.filter((r) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return [r.contractCode, r.contractName, r.shortName, r.statut].some((v) => String(v || '').toLowerCase().includes(term));
  });

  const openCreate = () => { setMode('create'); setForm(emptyForm); setError(''); };
  const openView = (row) => { setMode('view'); setForm(mapRowToForm(row)); };
  const openEdit = (row) => { setMode('edit'); setForm(mapRowToForm(row)); setError(''); };
  const close = () => setMode(null);

  function mapRowToForm(row) {
    return {
      __id: row.contractTypeID, code: row.contractCode, contractName: row.contractName,
      shortName: row.shortName || '', description: row.description || '',
      allowDailyCollection: row.allowDailyCollection, allowWeeklyCollection: row.allowWeeklyCollection, allowMonthlyCollection: row.allowMonthlyCollection,
      minimumCollectionAmount: row.minimumCollectionAmount ?? '', maximumCollectionAmount: row.maximumCollectionAmount ?? '',
      defaultCollectionAmount: row.defaultCollectionAmount ?? '',
      minimumOpeningBalance: row.minimumOpeningBalance ?? '', maximumBalance: row.maximumBalance ?? '',
      interestRate: row.interestRate ?? '', contractDuration: row.contractDuration ?? '', durationUnit: row.durationUnit || 'Months',
      penaltyAmount: row.penaltyAmount ?? '', gracePeriod: row.gracePeriod ?? '',
      statut: row.statut, createdBy: row.createdBy, createdDate: row.createdDate,
      updatedBy: row.updatedBy, updatedDate: row.updatedDate,
    };
  }

  const numOrNull = (v) => (v === '' || v === null || v === undefined ? null : Number(v));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const payload = {
      contractName: form.contractName, shortName: form.shortName, description: form.description,
      allowDailyCollection: form.allowDailyCollection, allowWeeklyCollection: form.allowWeeklyCollection, allowMonthlyCollection: form.allowMonthlyCollection,
      minimumCollectionAmount: numOrNull(form.minimumCollectionAmount), maximumCollectionAmount: numOrNull(form.maximumCollectionAmount),
      defaultCollectionAmount: numOrNull(form.defaultCollectionAmount),
      minimumOpeningBalance: numOrNull(form.minimumOpeningBalance), maximumBalance: numOrNull(form.maximumBalance),
      interestRate: numOrNull(form.interestRate), contractDuration: numOrNull(form.contractDuration), durationUnit: form.durationUnit,
      penaltyAmount: numOrNull(form.penaltyAmount), gracePeriod: numOrNull(form.gracePeriod),
    };
    try {
      if (mode === 'create') {
        await ContractTypeAPI.create(payload);
        setNotice('Type de contrat soumis pour validation.');
      } else if (mode === 'edit') {
        await ContractTypeAPI.update(form.__id, { ...payload, statut: form.statut });
        setNotice('Modification soumise pour validation.');
      }
      close();
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de l'enregistrement.");
    }
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Voulez-vous vraiment supprimer le type de contrat ${row.contractName} ?`)) return;
    try {
      await ContractTypeAPI.remove(row.contractTypeID);
      setNotice('Suppression soumise pour validation.');
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de la suppression.');
    }
  };

  const columns = [
    { key: 'contractCode', label: 'Contract Code' },
    { key: 'contractName', label: 'Contract Name' },
    { key: 'shortName', label: 'Short Name', render: (r) => r.shortName || '—' },
    { key: 'description', label: 'Description', render: (r) => r.description || '—' },
    { key: 'statut', label: 'Status', render: (r) => <StatusBadge status={r.statut} /> },
    { key: 'createdDate', label: 'Created Date', render: (r) => r.createdDate ? new Date(r.createdDate).toLocaleDateString('fr-FR') : '—' },
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
        <div className="panel-title">Contract Type Management</div>
        <button className="btn btn-primary" onClick={openCreate}>+ Create Contract Type</button>
      </div>

      {notice && <div className="error-banner" style={{ background: '#dcfce7', color: '#16a34a' }}>{notice}</div>}

      <div className="toolbar">
        <input className="search-input" placeholder="Search Contract Type (code, nom, statut)…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <ExportDropdown filename="CONTRACT_TYPES" columns={columns.filter((c) => c.key !== 'actions')} rows={filtered} />
      </div>

      <DataTable columns={columns} rows={filtered} loading={loading} totalLabel={`TOTAL CONTRACT TYPES: ${filtered.length}`} />

      {mode && (
        <WideModal
          title={mode === 'create' ? 'Create Contract Type' : mode === 'edit' ? 'Edit Contract Type' : 'View Contract Type'}
          onClose={close}
          footer={
            readOnly
              ? <button className="btn btn-outline" onClick={close}>Fermer</button>
              : (
                <>
                  <button className="btn btn-outline" onClick={close}>Cancel</button>
                  <button className="btn btn-primary" form="contracttype-form" type="submit">{mode === 'create' ? 'Save' : 'Update'}</button>
                </>
              )
          }
        >
          {error && <div className="error-banner mb-3">{error}</div>}
          <form id="contracttype-form" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 items-start">

              {/* General Information */}
              <div className="form-card lg:col-span-3">
                <div className="form-card-title"><FileSignature size={12} /> General Information</div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                  {mode !== 'create' && <div className="form-group"><label>Contract Code</label><input disabled value={form.code || ''} /></div>}
                  <div className="form-group sm:col-span-2"><label>Contract Name *</label><input required disabled={readOnly} value={form.contractName} onChange={(e) => setForm({ ...form, contractName: e.target.value })} placeholder="Daily Saving" /></div>
                  <div className="form-group"><label>Short Name</label><input disabled={readOnly} value={form.shortName} onChange={(e) => setForm({ ...form, shortName: e.target.value })} /></div>
                </div>
                <div className="form-group"><label>Description</label><textarea rows={1} disabled={readOnly} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              </div>

              {/* Contract Configuration */}
              <div className="form-card lg:col-span-2">
                <div className="form-card-title"><Settings2 size={12} /> Contract Configuration</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <label className="flex items-center gap-2 text-[12px]"><input type="checkbox" disabled={readOnly} checked={form.allowDailyCollection} onChange={(e) => setForm({ ...form, allowDailyCollection: e.target.checked })} /> Allow Daily Collection</label>
                  <label className="flex items-center gap-2 text-[12px]"><input type="checkbox" disabled={readOnly} checked={form.allowWeeklyCollection} onChange={(e) => setForm({ ...form, allowWeeklyCollection: e.target.checked })} /> Allow Weekly Collection</label>
                  <label className="flex items-center gap-2 text-[12px]"><input type="checkbox" disabled={readOnly} checked={form.allowMonthlyCollection} onChange={(e) => setForm({ ...form, allowMonthlyCollection: e.target.checked })} /> Allow Monthly Collection</label>

                  <div className="form-group"><label>Minimum Collection Amount</label><input type="number" disabled={readOnly} value={form.minimumCollectionAmount} onChange={(e) => setForm({ ...form, minimumCollectionAmount: e.target.value })} /></div>
                  <div className="form-group"><label>Maximum Collection Amount</label><input type="number" disabled={readOnly} value={form.maximumCollectionAmount} onChange={(e) => setForm({ ...form, maximumCollectionAmount: e.target.value })} /></div>
                  <div className="form-group"><label>Default Collection Amount</label><input type="number" disabled={readOnly} value={form.defaultCollectionAmount} onChange={(e) => setForm({ ...form, defaultCollectionAmount: e.target.value })} /></div>

                  <div className="form-group"><label>Minimum Opening Balance</label><input type="number" disabled={readOnly} value={form.minimumOpeningBalance} onChange={(e) => setForm({ ...form, minimumOpeningBalance: e.target.value })} /></div>
                  <div className="form-group"><label>Maximum Balance</label><input type="number" disabled={readOnly} value={form.maximumBalance} onChange={(e) => setForm({ ...form, maximumBalance: e.target.value })} /></div>
                  <div className="form-group"><label>Interest Rate (%)</label><input type="number" step="0.01" disabled={readOnly} value={form.interestRate} onChange={(e) => setForm({ ...form, interestRate: e.target.value })} /></div>

                  <div className="form-group"><label>Contract Duration</label><input type="number" disabled={readOnly} value={form.contractDuration} onChange={(e) => setForm({ ...form, contractDuration: e.target.value })} /></div>
                  <div className="form-group">
                    <label>Duration Unit</label>
                    <select disabled={readOnly} value={form.durationUnit} onChange={(e) => setForm({ ...form, durationUnit: e.target.value })}>
                      {DURATION_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                  <div className="form-group"><label>Penalty Amount</label><input type="number" disabled={readOnly} value={form.penaltyAmount} onChange={(e) => setForm({ ...form, penaltyAmount: e.target.value })} /></div>
                  <div className="form-group"><label>Grace Period (days)</label><input type="number" disabled={readOnly} value={form.gracePeriod} onChange={(e) => setForm({ ...form, gracePeriod: e.target.value })} /></div>
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
