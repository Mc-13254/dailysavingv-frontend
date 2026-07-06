import { useEffect, useState } from 'react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import ExportDropdown from '../components/ExportDropdown';
import { TransactionAPI } from '../api/endpoints';

const TYPE_LABELS = {
  DEPOSIT: 'Dépôt',
  WITHDRAWAL: 'Retrait',
  DAILY_COLLECTION: 'Collecte journalière',
  LOAN_PAYMENT: 'Remboursement prêt',
  TRANSFER: 'Transfert',
  ACCOUNT_OPENING: "Ouverture de compte",
  ACCOUNT_CLOSING: 'Clôture de compte',
};

const emptyForm = { transactionType: 'DAILY_COLLECTION', accountID: '', collectorID: '', montant: '' };

/**
 * defaultType: pre-selects a transaction type when opening the create form,
 * so the same page can serve "Collectes journalières", "Dépôts", "Retraits"
 * from the sidebar while remaining one shared implementation.
 */
export default function TransactionManagement({ defaultType, title }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ ...emptyForm, transactionType: defaultType || 'DAILY_COLLECTION' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await TransactionAPI.list();
      setRows(defaultType ? data.filter((t) => t.transactionType === defaultType) : data);
    } catch { setRows([]); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [defaultType]);

  const openCreate = () => {
    setForm({ ...emptyForm, transactionType: defaultType || 'DAILY_COLLECTION' });
    setError('');
    setReceipt(null);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const { data } = await TransactionAPI.create({
        transactionType: form.transactionType,
        accountID: form.accountID,
        collectorID: form.collectorID || null,
        montant: Number(form.montant),
      });
      setReceipt(data);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de l'enregistrement de la transaction.");
    } finally {
      setSubmitting(false);
    }
  };

  const fmt = (n) => new Intl.NumberFormat('fr-FR').format(n || 0);

  const columns = [
    { key: 'transactionID', label: 'ID' },
    { key: 'receiptNumber', label: 'N° Reçu' },
    { key: 'transactionType', label: 'Type', render: (r) => TYPE_LABELS[r.transactionType] || r.transactionType },
    { key: 'montant', label: 'Montant', render: (r) => fmt(r.montant) },
    { key: 'montantCommission', label: 'Commission', render: (r) => fmt(r.montantCommission) },
    { key: 'dateTransaction', label: 'Date', render: (r) => new Date(r.dateTransaction).toLocaleString('fr-FR') },
    { key: 'statut', label: 'Statut' },
  ];

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <div className="panel-title">{title || 'Transactions'}</div>
          <div className="panel-subtitle">La commission est calculée et appliquée automatiquement à chaque transaction.</div>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ Nouvelle transaction</button>
      </div>

      <div className="toolbar">
        <ExportDropdown filename={title?.toUpperCase().replace(/\s/g, '_') || 'TRANSACTIONS'} columns={columns} rows={rows} />
      </div>

      <DataTable columns={columns} rows={rows} loading={loading} totalLabel={`TOTAL: ${rows.length}`} />

      {showModal && (
        <Modal title="Nouvelle transaction" onClose={() => setShowModal(false)} footer={
          !receipt && (
            <>
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Annuler</button>
              <button className="btn btn-primary" form="tx-form" type="submit" disabled={submitting}>
                {submitting ? 'Traitement…' : 'Valider la transaction'}
              </button>
            </>
          )
        }>
          {error && <div className="error-banner">{error}</div>}
          {receipt ? (
            <div className="flex flex-col gap-2 text-sm normal-case">
              <p className="font-bold text-green-700">Transaction enregistrée ✅</p>
              <p>Reçu : <strong>{receipt.receiptNumber}</strong></p>
              <p>Montant : {fmt(receipt.montant)} XAF</p>
              <p>Commission : {fmt(receipt.montantCommission)} XAF</p>
              <button className="btn btn-primary mt-2" onClick={() => setShowModal(false)}>Fermer</button>
            </div>
          ) : (
            <form id="tx-form" onSubmit={handleSubmit} style={{ display: 'contents' }}>
              <div className="form-group">
                <label>Type de transaction</label>
                <select value={form.transactionType} onChange={(e) => setForm({ ...form, transactionType: e.target.value })}>
                  {Object.entries(TYPE_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                </select>
              </div>
              <div className="form-group"><label>Compte (Account ID)</label><input required value={form.accountID} onChange={(e) => setForm({ ...form, accountID: e.target.value })} placeholder="CC-000001" /></div>
              <div className="form-group"><label>Collecteur (optionnel)</label><input value={form.collectorID} onChange={(e) => setForm({ ...form, collectorID: e.target.value })} placeholder="CO-00001" /></div>
              <div className="form-group"><label>Montant (XAF)</label><input type="number" required value={form.montant} onChange={(e) => setForm({ ...form, montant: e.target.value })} /></div>
            </form>
          )}
        </Modal>
      )}
    </div>
  );
}
