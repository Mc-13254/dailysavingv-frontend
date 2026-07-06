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
const emptyTypeForm = { code: '', name: '', description: '' };

export default function CommissionManagement() {
  const [types, setTypes] = useState([]);
  const [selectedType, setSelectedType] = useState('');
  const [ranges, setRanges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRangeModal, setShowRangeModal] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [editingRange, setEditingRange] = useState(null);
  const [editingType, setEditingType] = useState(null);
  const [rangeForm, setRangeForm] = useState(emptyRangeForm);
  const [typeForm, setTypeForm] = useState(emptyTypeForm);
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

  // ---- Commission Type CRUD ----
  const openCreateType = () => { setEditingType(null); setTypeForm(emptyTypeForm); setShowTypeModal(true); };
  const openEditType = (t) => { setEditingType(t); setTypeForm({ code: t.code, name: t.name, description: t.description || '' }); setShowTypeModal(true); };

  const handleTypeSubmit = async (e) => {
    e.preventDefault();
    if (editingType) {
      await CommissionAPI.updateType(editingType.commissionTypeID, typeForm);
    } else {
      await CommissionAPI.createType(typeForm);
    }
    setShowTypeModal(false);
    loadTypes();
  };

  const handleTypeDelete = async (t) => {
    if (!window.confirm(`Désactiver le type de commission "${t.name}" ?`)) return;
    await CommissionAPI.removeType(t.commissionTypeID);
    loadTypes();
  };

  // ---- Commission Range CRUD ----
  const openCreateRange = () => { setEditingRange(null); setRangeForm(emptyRangeForm); setShowRangeModal(true); };
  const openEditRange = (r) => {
    setEditingRange(r);
    setRangeForm({
      commissionTypeID: r.commissionTypeID, minAmount: r.minAmount, maxAmount: r.maxAmount,
      calculationMethod: r.calculationMethod, fixedAmount: r.fixedAmount || '', percentageRate: r.percentageRate || '', currency: r.currency,
    });
    setShowRangeModal(true);
  };

  const handleRangeSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const payload = {
      commissionTypeID: Number(rangeForm.commissionTypeID || selectedType),
      minAmount: Number(rangeForm.minAmount),
      maxAmount: Number(rangeForm.maxAmount),
      calculationMethod: rangeForm.calculationMethod,
      fixedAmount: rangeForm.calculationMethod === 'FIXED' ? Number(rangeForm.fixedAmount) : null,
      percentageRate: rangeForm.calculationMethod === 'PERCENTAGE' ? Number(rangeForm.percentageRate) : null,
      currency: rangeForm.currency,
    };
    try {
      if (editingRange) {
        await CommissionAPI.updateRange(editingRange.commissionRangeID, payload);
      } else {
        await CommissionAPI.createRange(payload);
      }
      setShowRangeModal(false);
      setRangeForm(emptyRangeForm);
      setEditingRange(null);
      loadRanges();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur — vérifiez que les plages ne se chevauchent pas.');
    }
  };

  const handleRangeDelete = async (r) => {
    if (!window.confirm(`Désactiver cette plage de commission ?`)) return;
    await CommissionAPI.removeRange(r.commissionRangeID);
    loadRanges();
  };

  const rangeColumns = [
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
          <button className="btn-icon" title="Modifier" onClick={() => openEditRange(r)}><Pencil size={15} /></button>
          <button className="btn-icon text-red-500" title="Supprimer" onClick={() => handleRangeDelete(r)}><Trash2 size={15} /></button>
        </div>
      )
    },
  ];

  const typeColumns = [
    { key: 'code', label: 'Code' },
    { key: 'name', label: 'Nom' },
    { key: 'description', label: 'Description' },
    { key: 'statut', label: 'Statut', render: (r) => <StatusBadge status={r.statut} /> },
    {
      key: 'actions', label: 'Actions', sortable: false, render: (r) => (
        <div className="flex items-center gap-2">
          <button className="btn-icon" title="Modifier" onClick={() => openEditType(r)}><Pencil size={15} /></button>
          <button className="btn-icon text-red-500" title="Supprimer" onClick={() => handleTypeDelete(r)}><Trash2 size={15} /></button>
        </div>
      )
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">Commission Types</div>
          <button className="btn btn-primary" onClick={openCreateType}>+ Add Commission Type</button>
        </div>
        <DataTable columns={typeColumns} rows={types} loading={false} totalLabel={`TOTAL: ${types.length}`} />
      </div>

      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">Commission Range</div>
          <button className="btn btn-primary" onClick={openCreateRange}>+ Add Commission Range</button>
        </div>

        <div className="toolbar">
          <select className="search-input" style={{ flex: 'none', minWidth: 260 }} value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
            {types.map((t) => <option key={t.commissionTypeID} value={t.commissionTypeID}>{t.name} (ID: {t.commissionTypeID})</option>)}
          </select>
          <ExportDropdown filename="COMMISSION_RANGES" columns={rangeColumns.filter((c) => c.key !== 'actions')} rows={ranges} />
        </div>

        <DataTable columns={rangeColumns} rows={ranges} loading={loading} totalLabel={`TOTAL: ${ranges.length}`} />
      </div>

      {showTypeModal && (
        <Modal title={editingType ? 'Edit Commission Type' : 'Add Commission Type'} onClose={() => setShowTypeModal(false)} footer={
          <>
            <button className="btn btn-outline" onClick={() => setShowTypeModal(false)}>Annuler</button>
            <button className="btn btn-primary" form="type-form" type="submit">Soumettre</button>
          </>
        }>
          <form id="type-form" onSubmit={handleTypeSubmit} style={{ display: 'contents' }}>
            <div className="form-group"><label>Code</label><input required disabled={!!editingType} value={typeForm.code} onChange={(e) => setTypeForm({ ...typeForm, code: e.target.value })} placeholder="LOAN_PAYMENT" /></div>
            <div className="form-group"><label>Nom</label><input required value={typeForm.name} onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })} /></div>
            <div className="form-group"><label>Description</label><textarea rows={3} value={typeForm.description} onChange={(e) => setTypeForm({ ...typeForm, description: e.target.value })} /></div>
          </form>
        </Modal>
      )}

      {showRangeModal && (
        <Modal title={editingRange ? 'Edit Commission Range' : 'Add Commission Range'} onClose={() => setShowRangeModal(false)} footer={
          <>
            <button className="btn btn-outline" onClick={() => setShowRangeModal(false)}>Annuler</button>
            <button className="btn btn-primary" form="commission-form" type="submit">Soumettre pour validation</button>
          </>
        }>
          {error && <div className="error-banner">{error}</div>}
          <form id="commission-form" onSubmit={handleRangeSubmit} style={{ display: 'contents' }}>
            <div className="form-group">
              <label>Commission Type</label>
              <select value={rangeForm.commissionTypeID || selectedType} onChange={(e) => setRangeForm({ ...rangeForm, commissionTypeID: e.target.value })}>
                {types.map((t) => <option key={t.commissionTypeID} value={t.commissionTypeID}>{t.name}</option>)}
              </select>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Montant Min</label><input type="number" required value={rangeForm.minAmount} onChange={(e) => setRangeForm({ ...rangeForm, minAmount: e.target.value })} /></div>
              <div className="form-group"><label>Montant Max</label><input type="number" required value={rangeForm.maxAmount} onChange={(e) => setRangeForm({ ...rangeForm, maxAmount: e.target.value })} /></div>
            </div>
            <div className="form-group">
              <label>Méthode de calcul</label>
              <select value={rangeForm.calculationMethod} onChange={(e) => setRangeForm({ ...rangeForm, calculationMethod: e.target.value, fixedAmount: '', percentageRate: '' })}>
                <option value="FIXED">Montant fixe</option>
                <option value="PERCENTAGE">Pourcentage</option>
              </select>
            </div>
            {rangeForm.calculationMethod === 'FIXED' ? (
              <div className="form-group"><label>Montant fixe (XAF)</label><input type="number" required value={rangeForm.fixedAmount} onChange={(e) => setRangeForm({ ...rangeForm, fixedAmount: e.target.value })} /></div>
            ) : (
              <div className="form-group"><label>Taux (%)</label><input type="number" step="0.01" required value={rangeForm.percentageRate} onChange={(e) => setRangeForm({ ...rangeForm, percentageRate: e.target.value })} /></div>
            )}
            <div className="form-group"><label>Devise</label><input value={rangeForm.currency} onChange={(e) => setRangeForm({ ...rangeForm, currency: e.target.value })} /></div>
          </form>
        </Modal>
      )}
    </div>
  );
}
