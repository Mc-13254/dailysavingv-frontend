import { useEffect, useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import ExportDropdown from '../components/ExportDropdown';
import { CommissionAPI } from '../api/endpoints';

const emptyRangeForm = {
  commissionTypeID: '', minAmount: '', maxAmount: '',
  calculationMethod: 'FIXED', fixedAmount: '', percentageRate: '', currency: 'XAF',
};

export default function CommissionRangeManagement() {
  const [types, setTypes] = useState([]);
  const [selectedType, setSelectedType] = useState('');
  const [ranges, setRanges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyRangeForm);
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

  const openCreate = () => { setEditing(null); setForm(emptyRangeForm); setError(''); setShowModal(true); };
  const openEdit = (r) => {
    setEditing(r);
    setForm({
      commissionTypeID: r.commissionTypeID, minAmount: r.minAmount, maxAmount: r.maxAmount,
      calculationMethod: r.calculationMethod, fixedAmount: r.fixedAmount || '', percentageRate: r.percentageRate || '', currency: r.currency,
    });
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const payload = {
      commissionTypeID: Number(form.commissionTypeID || selectedType),
      minAmount: Number(form.minAmount),
      maxAmount: Number(form.maxAmount),
      calculationMethod: form.calculationMethod,
      fixedAmount: form.calculationMethod === 'FIXED' ? Number(form.fixedAmount) : null,
      percentageRate: form.calculationMethod === 'PERCENTAGE' ? Number(form.percentageRate) : null,
      currency: form.currency,
    };
    try {
      if (editing) {
        await CommissionAPI.updateRange(editing.commissionRangeID, payload);
      } else {
        await CommissionAPI.createRange(payload);
      }
      setShowModal(false);
      setForm(emptyRangeForm);
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

  const columns = [
    { key: 'commissionRangeID', label: 'RangeID' },
    { key: 'commissionTypeName', label: 'Type' },
    { key: 'minAmount', label: 'Min' },
    { key: 'maxAmount', label: 'Max' },
    { key: 'calculationMethod', label: 'Méthode' },
    { key: 'fixedAmount', label: 'Fixe', render: (r) => r.fixedAmount ?? '—' },
    { key: 'percentageRate', label: 'Taux %', render: (r) => r.percentageRate ? `${r.percentageRate}%` : '—' },
    { key: 'currency', label: 'Devise' },
    { key: 'statut', label: 'Status', render: (r) => <StatusBadge status={r.statut} /> },
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

      <div className="toolbar">
        <select className="search-input" style={{ flex: 'none', minWidth: 260 }} value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
          {types.map((t) => <option key={t.commissionTypeID} value={t.commissionTypeID}>{t.name} (ID: {t.commissionTypeID})</option>)}
        </select>
        <ExportDropdown filename="COMMISSION_RANGES" columns={columns.filter((c) => c.key !== 'actions')} rows={ranges} />
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
              <label>Commission Type</label>
              <select value={form.commissionTypeID || selectedType} onChange={(e) => setForm({ ...form, commissionTypeID: e.target.value })}>
                {types.map((t) => <option key={t.commissionTypeID} value={t.commissionTypeID}>{t.name}</option>)}
              </select>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Montant Min</label><input type="number" required value={form.minAmount} onChange={(e) => setForm({ ...form, minAmount: e.target.value })} /></div>
              <div className="form-group"><label>Montant Max</label><input type="number" required value={form.maxAmount} onChange={(e) => setForm({ ...form, maxAmount: e.target.value })} /></div>
            </div>
            <div className="form-group">
              <label>Méthode de calcul</label>
              <select value={form.calculationMethod} onChange={(e) => setForm({ ...form, calculationMethod: e.target.value, fixedAmount: '', percentageRate: '' })}>
                <option value="FIXED">Montant fixe</option>
                <option value="PERCENTAGE">Pourcentage</option>
              </select>
            </div>
            {form.calculationMethod === 'FIXED' ? (
              <div className="form-group"><label>Montant fixe (XAF)</label><input type="number" required value={form.fixedAmount} onChange={(e) => setForm({ ...form, fixedAmount: e.target.value })} /></div>
            ) : (
              <div className="form-group"><label>Taux (%)</label><input type="number" step="0.01" required value={form.percentageRate} onChange={(e) => setForm({ ...form, percentageRate: e.target.value })} /></div>
            )}
            <div className="form-group"><label>Devise</label><input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} /></div>
          </form>
        </Modal>
      )}
    </div>
  );
}
