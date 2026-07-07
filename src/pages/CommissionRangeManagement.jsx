import { useEffect, useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import ExportDropdown from '../components/ExportDropdown';
import { CommissionAPI } from '../api/endpoints';

const emptyForm = {
  commissionTypeID: '', description: '', inf: '', sup: '',
  calculationMethod: 'FIXED', fixe: '', taux: '', minimum: '', maximum: '', codeU: 'XAF',
};

export default function CommissionRangeManagement() {
  const [types, setTypes] = useState([]);
  const [selectedType, setSelectedType] = useState('');
  const [ranges, setRanges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');

  const loadTypes = async () => {
    const { data } = await CommissionAPI.types();
    setTypes(data);
    if (data.length && !selectedType) setSelectedType(String(data[0].commissionTypeID));
  };

  const loadRanges = async () => {
    setLoading(true);
    try {
      const { data } = await CommissionAPI.ranges(selectedType || undefined);
      setRanges(data);
    } catch { setRanges([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadTypes(); }, []);
  useEffect(() => { if (selectedType) loadRanges(); }, [selectedType]);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setError(''); setShowModal(true); };
  const openEdit = (r) => {
    setEditing(r);
    setForm({
      commissionTypeID: r.commissionTypeID, description: r.description || '',
      inf: r.inf, sup: r.sup,
      calculationMethod: r.calculationMethod, fixe: r.fixe || '', taux: r.taux || '',
      minimum: r.minimum ?? '', maximum: r.maximum ?? '', codeU: r.codeU,
    });
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const payload = {
      commissionTypeID: Number(form.commissionTypeID || selectedType),
      description: form.description || null,
      inf: Number(form.inf),
      sup: Number(form.sup),
      calculationMethod: form.calculationMethod,
      fixe: form.calculationMethod === 'FIXED' ? Number(form.fixe) : null,
      taux: form.calculationMethod === 'PERCENTAGE' ? Number(form.taux) : null,
      minimum: form.minimum === '' ? null : Number(form.minimum),
      maximum: form.maximum === '' ? null : Number(form.maximum),
      codeU: form.codeU,
    };
    try {
      if (editing) {
        await CommissionAPI.updateRange(editing.commissionRangeID, payload);
      } else {
        await CommissionAPI.createRange(payload);
      }
      setShowModal(false);
      setForm(emptyForm);
      setEditing(null);
      loadRanges();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur — vérifiez que les plages ne se chevauchent pas.');
    }
  };

  const handleDelete = async (r) => {
    if (!window.confirm('Désactiver cette plage de commission ?')) return;
    await CommissionAPI.removeRange(r.commissionRangeID);
    loadRanges();
  };

  const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('fr-FR') : '—');

  const columns = [
    { key: 'commissionRangeID', label: 'RangeId' },
    { key: 'description', label: 'Description', render: (r) => r.description || '—' },
    { key: 'codeComis', label: 'CodeComis' },
    { key: 'inf', label: 'Inf' },
    { key: 'sup', label: 'Sup' },
    { key: 'calculationMethod', label: 'Méthode' },
    { key: 'fixe', label: 'Fixe', render: (r) => r.fixe ?? '—' },
    { key: 'taux', label: 'TAUX', render: (r) => r.taux ? `${r.taux}%` : '—' },
    { key: 'minimum', label: 'Minimum', render: (r) => r.minimum ?? '—' },
    { key: 'maximum', label: 'Maximum', render: (r) => r.maximum ?? '—' },
    { key: 'codeU', label: 'CodeU' },
    { key: 'statut', label: 'Status', render: (r) => <StatusBadge status={r.statut} /> },
    { key: 'createDate', label: 'CreateDate', render: (r) => fmtDate(r.createDate) },
    { key: 'userCreate', label: 'UserCreate', render: (r) => r.userCreate || '—' },
    { key: 'userVal', label: 'UserVal', render: (r) => r.userVal || '—' },
    { key: 'dateValidation', label: 'DateValidation', render: (r) => fmtDate(r.dateValidation) },
    { key: 'lastUserModif', label: 'LastUserModif', render: (r) => r.lastUserModif || '—' },
    { key: 'dateModification', label: 'DateModification', render: (r) => fmtDate(r.dateModification) },
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
          <div className="panel-title">Commission Range Management</div>
          <div className="panel-subtitle">Passe par le circuit de validation (Validations → Commission Ranges) avant d'être actif.</div>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ Add Commission Range</button>
      </div>

      <div className="toolbar flex-wrap">
        <select className="search-input" style={{ flex: '1 1 220px', minWidth: 200, maxWidth: 320 }} value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
          {types.map((t) => <option key={t.commissionTypeID} value={t.commissionTypeID}>{t.name} ({t.code})</option>)}
        </select>
        <div className="ml-auto">
          <ExportDropdown filename="COMMISSION_RANGES" columns={columns.filter((c) => c.key !== 'actions')} rows={ranges} />
        </div>
      </div>

      <DataTable columns={columns} rows={ranges} loading={loading} totalLabel={`TOTAL: ${ranges.length}`} />

      {showModal && (
        <Modal title={editing ? 'Edit Commission Range' : 'Add Commission Range'} onClose={() => setShowModal(false)} footer={
          <>
            <button className="btn btn-outline" onClick={() => setShowModal(false)}>Annuler</button>
            <button className="btn btn-primary" form="commission-range-form" type="submit">Soumettre pour validation</button>
          </>
        }>
          {error && <div className="error-banner">{error}</div>}
          <form id="commission-range-form" onSubmit={handleSubmit} style={{ display: 'contents' }}>
            <div className="form-group">
              <label>CodeComis (Commission Type)</label>
              <select value={form.commissionTypeID || selectedType} onChange={(e) => setForm({ ...form, commissionTypeID: e.target.value })}>
                {types.map((t) => <option key={t.commissionTypeID} value={t.commissionTypeID}>{t.name} ({t.code})</option>)}
              </select>
            </div>
            <div className="form-group"><label>Description</label><input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="form-row">
              <div className="form-group"><label>Inf</label><input type="number" required value={form.inf} onChange={(e) => setForm({ ...form, inf: e.target.value })} /></div>
              <div className="form-group"><label>Sup</label><input type="number" required value={form.sup} onChange={(e) => setForm({ ...form, sup: e.target.value })} /></div>
            </div>
            <div className="form-group">
              <label>Méthode de calcul</label>
              <select value={form.calculationMethod} onChange={(e) => setForm({ ...form, calculationMethod: e.target.value, fixe: '', taux: '' })}>
                <option value="FIXED">Montant fixe</option>
                <option value="PERCENTAGE">Pourcentage</option>
              </select>
            </div>
            {form.calculationMethod === 'FIXED' ? (
              <div className="form-group"><label>Fixe (XAF)</label><input type="number" required value={form.fixe} onChange={(e) => setForm({ ...form, fixe: e.target.value })} /></div>
            ) : (
              <div className="form-group"><label>TAUX (%)</label><input type="number" step="0.01" required value={form.taux} onChange={(e) => setForm({ ...form, taux: e.target.value })} /></div>
            )}
            <div className="form-row">
              <div className="form-group"><label>Minimum (plancher de la commission)</label><input type="number" value={form.minimum} onChange={(e) => setForm({ ...form, minimum: e.target.value })} /></div>
              <div className="form-group"><label>Maximum (plafond de la commission)</label><input type="number" value={form.maximum} onChange={(e) => setForm({ ...form, maximum: e.target.value })} /></div>
            </div>
            <div className="form-group"><label>CodeU (devise)</label><input value={form.codeU} onChange={(e) => setForm({ ...form, codeU: e.target.value })} /></div>
          </form>
        </Modal>
      )}
    </div>
  );
}
