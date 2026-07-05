import { useEffect, useState } from 'react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import { CommissionAPI } from '../api/endpoints';

const emptyForm = {
  commissionTypeID: '', minAmount: '', maxAmount: '',
  calculationMethod: 'FIXED', fixedAmount: '', percentageRate: '', currency: 'XAF',
};

export default function CommissionManagement() {
  const [types, setTypes] = useState([]);
  const [selectedType, setSelectedType] = useState('');
  const [ranges, setRanges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
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

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await CommissionAPI.createRange({
        commissionTypeID: Number(form.commissionTypeID || selectedType),
        minAmount: Number(form.minAmount),
        maxAmount: Number(form.maxAmount),
        calculationMethod: form.calculationMethod,
        fixedAmount: form.calculationMethod === 'FIXED' ? Number(form.fixedAmount) : null,
        percentageRate: form.calculationMethod === 'PERCENTAGE' ? Number(form.percentageRate) : null,
        currency: form.currency,
      });
      setShowModal(false);
      setForm(emptyForm);
      loadRanges();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur — vérifiez que les plages ne se chevauchent pas.');
    }
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
  ];

  return (
    <div className="panel">
      <div className="panel-header">
        <div className="panel-title">Commission Range</div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add Commission</button>
      </div>

      <div className="toolbar">
        <select className="search-input" style={{ flex: 'none', minWidth: 260 }} value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
          {types.map((t) => <option key={t.commissionTypeID} value={t.commissionTypeID}>{t.name} (ID: {t.commissionTypeID})</option>)}
        </select>
        <button className="btn btn-outline">⬇ Export</button>
      </div>

      <DataTable columns={columns} rows={ranges} loading={loading} totalLabel={`TOTAL: ${ranges.length}`} />

      {showModal && (
        <Modal title="Add Commission Range" onClose={() => setShowModal(false)} footer={
          <>
            <button className="btn btn-outline" onClick={() => setShowModal(false)}>Annuler</button>
            <button className="btn btn-primary" form="commission-form" type="submit">Soumettre pour validation</button>
          </>
        }>
          {error && <div className="error-banner">{error}</div>}
          <form id="commission-form" onSubmit={handleCreate} style={{ display: 'contents' }}>
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
