import { useEffect, useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Upload, Search } from 'lucide-react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import WideModal from '../components/WideModal';
import ExportDropdown from '../components/ExportDropdown';
import DenominationCounter, { denominationCountsToPayload, denominationTotal } from '../components/DenominationCounter';
import { TransactionAPI } from '../api/endpoints';

const TYPE_LABELS = {
  DEPOSIT: 'Dépôt',
  WITHDRAWAL: 'Retrait',
  DAILY_COLLECTION: 'Collecte journalière',
  LOAN_PAYMENT: 'Remboursement prêt',
  TRANSFER: 'Transfert',
};

const emptyForm = { transactionType: 'DAILY_COLLECTION', montant: '', remitterName: '', beneficiaryName: '', paymentMethod: 'CASH' };

// ASP.NET's built-in model-validation (400 Bad Request before the request even
// reaches the controller) returns { errors: { Field: ["message"] }, title, status }
// instead of our own { message } shape. Without this, those failures showed only
// the generic fallback text with no clue what was actually wrong.
function extractErrorMessage(err, fallback) {
  const data = err?.response?.data;
  if (!data) return fallback;
  if (data.message) return data.message;
  if (data.errors) {
    const firstField = Object.values(data.errors)[0];
    const firstMessage = Array.isArray(firstField) ? firstField[0] : firstField;
    if (firstMessage) return firstMessage;
  }
  if (data.title) return data.title;
  if (typeof data === 'string') return data;
  return fallback;
}

function ClientSearchBox({ label, onPick }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);

  const search = async (q) => {
    if (!q || q.length < 2) { setResults([]); return; }
    setLoading(true);
    try {
      const { data } = await TransactionAPI.clientLookup(q);
      setResults(data);
    } catch { setResults([]); }
    finally { setLoading(false); }
  };

  const handleChange = (e) => {
    const v = e.target.value;
    setQuery(v);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(v), 350);
  };

  return (
    <div className="form-group relative">
      <label>{label}</label>
      <div className="relative">
        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input className="pl-8" value={query} onChange={handleChange} placeholder="Code, nom, téléphone…" />
      </div>
      {loading && <div className="text-[11px] text-gray-400 mt-1">Recherche…</div>}
      {results.length > 0 && (
        <ul className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-56 overflow-y-auto text-xs normal-case">
          {results.map((c) => (
            <li
              key={c.clientID}
              className="px-2.5 py-1.5 cursor-pointer hover:bg-gray-50"
              onClick={() => { onPick(c); setResults([]); setQuery(`${c.clientID} — ${c.clientName}`); }}
            >
              <strong>{c.clientID}</strong> — {c.clientName} {c.phoneNumber ? `(${c.phoneNumber})` : ''}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ClientAccountPanel({ title, client, accountId, onAccountChange }) {
  if (!client) return <div className="form-card text-xs text-gray-400 normal-case">{title} — recherchez un client ci-dessus.</div>;
  return (
    <div className="form-card">
      <div className="form-card-title">{title}</div>
      <p className="text-xs normal-case mb-2">
        {client.clientName} · Collecteur : <strong>{client.collectorName || '—'}</strong>
      </p>
      <div className="form-group">
        <label>Compte</label>
        <select value={accountId} onChange={(e) => onAccountChange(e.target.value)}>
          <option value="">Choisir un compte…</option>
          {client.accounts.map((a) => (
            <option key={a.accountID} value={a.accountID}>
              {a.accountID} — {a.accountType} — Solde: {a.balance?.toLocaleString('fr-FR')} — {a.status}
            </option>
          ))}
        </select>
      </div>
      {client.accounts.length === 0 && <p className="text-[11px] text-red-500 normal-case">Ce client n'a aucun compte ouvert.</p>}
    </div>
  );
}

/**
 * defaultType: pre-selects a transaction type when opening the create form,
 * so the same page can serve "Collectes journalières", "Dépôts", "Retraits",
 * "Transferts" from the sidebar while remaining one shared implementation —
 * laid out like a real bank receipt (client, account, collector, montant,
 * remettant, bénéficiaire).
 */
export default function TransactionManagement({ defaultType, title }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ ...emptyForm, transactionType: defaultType || 'DAILY_COLLECTION' });
  const [sourceClient, setSourceClient] = useState(null);
  const [sourceAccountId, setSourceAccountId] = useState('');
  const [destClient, setDestClient] = useState(null);
  const [destAccountId, setDestAccountId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState(null);
  const [cashCounts, setCashCounts] = useState({});

  const [showImport, setShowImport] = useState(false);
  const [importRows, setImportRows] = useState([]);
  const [importFileName, setImportFileName] = useState('');
  const [importError, setImportError] = useState('');
  const [importSubmitting, setImportSubmitting] = useState(false);
  const [notice, setNotice] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await TransactionAPI.list();
      setRows(defaultType ? data.filter((t) => t.transactionType === defaultType) : data);
    } catch { setRows([]); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [defaultType]);

  const isTransfer = form.transactionType === 'TRANSFER';

  const openCreate = () => {
    setForm({ ...emptyForm, transactionType: defaultType || 'DAILY_COLLECTION' });
    setSourceClient(null); setSourceAccountId('');
    setDestClient(null); setDestAccountId('');
    setCashCounts({});
    setError('');
    setReceipt(null);
    setShowModal(true);
  };

  const pickSourceClient = (c) => {
    setSourceClient(c);
    setSourceAccountId(c.accounts.length === 1 ? c.accounts[0].accountID : '');
    setForm((f) => ({ ...f, remitterName: f.remitterName || c.clientName, beneficiaryName: f.beneficiaryName || c.clientName, collectorID: c.collectorID }));
  };
  const pickDestClient = (c) => {
    setDestClient(c);
    setDestAccountId(c.accounts.length === 1 ? c.accounts[0].accountID : '');
    setForm((f) => ({ ...f, beneficiaryName: c.clientName }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const isCash = form.paymentMethod === 'CASH';
    const cashBreakdown = isCash ? denominationCountsToPayload(cashCounts) : null;
    if (isCash && cashBreakdown && denominationTotal(cashCounts) !== Number(form.montant)) {
      setError("Le détail des billets/pièces ne correspond pas au montant saisi.");
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await TransactionAPI.create({
        transactionType: form.transactionType,
        accountID: sourceAccountId,
        toAccountID: isTransfer ? destAccountId : null,
        collectorID: sourceClient?.collectorID || null,
        montant: Number(form.montant),
        remitterName: form.remitterName || null,
        beneficiaryName: form.beneficiaryName || null,
        paymentMethod: form.paymentMethod,
        cashBreakdown,
      });
      setReceipt(data);
      load();
    } catch (err) {
      setError(extractErrorMessage(err, "Erreur lors de l'enregistrement de la transaction."));
    } finally {
      setSubmitting(false);
    }
  };

  const fmt = (n) => new Intl.NumberFormat('fr-FR').format(n || 0);

  const columns = [
    { key: 'transactionID', label: 'ID' },
    { key: 'receiptNumber', label: 'N° Reçu' },
    { key: 'transactionType', label: 'Type', render: (r) => TYPE_LABELS[r.transactionType] || r.transactionType },
    { key: 'accountID', label: 'Compte' },
    { key: 'toAccountID', label: 'Compte bénéficiaire', render: (r) => r.toAccountID || '—' },
    { key: 'remitterName', label: 'Remettant', render: (r) => r.remitterName || '—' },
    { key: 'beneficiaryName', label: 'Bénéficiaire', render: (r) => r.beneficiaryName || '—' },
    { key: 'montant', label: 'Montant', render: (r) => fmt(r.montant) },
    { key: 'montantCommission', label: 'Commission', render: (r) => fmt(r.montantCommission) },
    { key: 'dateTransaction', label: 'Date', render: (r) => new Date(r.dateTransaction).toLocaleString('fr-FR') },
    { key: 'statut', label: 'Statut' },
  ];

  // ---- Excel import -----------------------------------------------------

  const openImport = () => {
    setImportRows([]); setImportFileName(''); setImportError('');
    setShowImport(true);
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFileName(file.name);
    setImportError('');
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target.result, { type: 'binary' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet, { defval: '' });
        const parsed = json.map((row) => ({
          transactionType: String(row.TransactionType || row.Type || 'DAILY_COLLECTION').toUpperCase().trim(),
          accountID: String(row.AccountID || row.Compte || '').trim(),
          toAccountID: row.ToAccountID || row.CompteBeneficiaire ? String(row.ToAccountID || row.CompteBeneficiaire).trim() : null,
          collectorID: row.CollectorID || row.Collecteur ? String(row.CollectorID || row.Collecteur).trim() : null,
          montant: Number(row.Montant || row.Amount || 0),
          remitterName: row.RemitterName || row.Remettant || null,
          beneficiaryName: row.BeneficiaryName || row.Beneficiaire || null,
          refRowLabel: row.Reference || row.Label || `${row.AccountID || ''} ${row.Montant || ''}`.trim(),
        }));
        setImportRows(parsed);
      } catch {
        setImportError('Impossible de lire ce fichier. Vérifiez le format (.xlsx, .xls, .csv).');
      }
    };
    reader.readAsBinaryString(file);
  };

  const submitImport = async () => {
    setImportSubmitting(true);
    setImportError('');
    try {
      await TransactionAPI.createImportBatch({ fileName: importFileName, rows: importRows });
      setNotice(`${importRows.length} ligne(s) soumise(s) pour validation (voir module Validation des opérations).`);
      setShowImport(false);
      load();
    } catch (err) {
      setImportError(extractErrorMessage(err, "Échec de l'import."));
    } finally {
      setImportSubmitting(false);
    }
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <div className="panel-title">{title || 'Transactions'}</div>
          <div className="panel-subtitle">La commission est calculée et appliquée automatiquement à chaque transaction.</div>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-outline" onClick={openImport}><Upload size={14} /> Importer Excel</button>
          <button className="btn btn-primary" onClick={openCreate}>+ Nouvelle transaction</button>
        </div>
      </div>

      {notice && <div className="mb-3 text-xs text-green-700 bg-green-50 px-3 py-2 rounded normal-case">{notice}</div>}

      <div className="toolbar">
        <ExportDropdown filename={title?.toUpperCase().replace(/\s/g, '_') || 'TRANSACTIONS'} columns={columns} rows={rows} />
      </div>

      <DataTable columns={columns} rows={rows} loading={loading} totalLabel={`TOTAL: ${rows.length}`} />

      {showModal && (
        <WideModal title="Nouvelle transaction" onClose={() => setShowModal(false)} footer={
          !receipt && (
            <>
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Annuler</button>
              <button className="btn btn-primary" form="tx-form" type="submit" disabled={submitting || !sourceAccountId || (isTransfer && !destAccountId)}>
                {submitting ? 'Traitement…' : 'Valider la transaction'}
              </button>
            </>
          )
        }>
          {error && <div className="error-banner">{error}</div>}
          {receipt ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm normal-case">
              <div className="form-card sm:col-span-2 text-center py-6">
                <p className="font-bold text-green-700 text-lg mb-2">Transaction enregistrée ✅</p>
                <p className="text-xs text-gray-500">Reçu N° <strong>{receipt.receiptNumber}</strong></p>
              </div>
              <div className="form-card">
                <div className="form-card-title">Client / Compte</div>
                <p>{receipt.clientName} ({receipt.clientID})</p>
                <p>Compte: {receipt.accountID}{receipt.toAccountID ? ` → ${receipt.toAccountID}` : ''}</p>
                <p>Collecteur: {receipt.collectorName || '—'}</p>
              </div>
              <div className="form-card">
                <div className="form-card-title">Montants</div>
                <p>Solde avant: {fmt(receipt.openingBalance)}</p>
                <p>Montant: {fmt(receipt.montant)}</p>
                <p>Solde après: {fmt(receipt.closingBalance)}</p>
                <p>Commission: {fmt(receipt.montantCommission)}</p>
              </div>
              <div className="form-card sm:col-span-2">
                <div className="form-card-title">Remettant / Bénéficiaire</div>
                <p>Remettant: {receipt.remitterName || '—'} · Bénéficiaire: {receipt.beneficiaryName || '—'}</p>
                <p className="text-gray-400 text-xs">{new Date(receipt.dateTransaction).toLocaleString('fr-FR')}</p>
              </div>
              <button className="btn btn-primary sm:col-span-2" onClick={() => setShowModal(false)}>Fermer</button>
            </div>
          ) : (
            <form id="tx-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Type de transaction</label>
                <select value={form.transactionType} onChange={(e) => setForm({ ...form, transactionType: e.target.value })}>
                  {Object.entries(TYPE_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                <div>
                  <ClientSearchBox label={isTransfer ? 'Client émetteur (compte source)' : 'Client'} onPick={pickSourceClient} />
                  <ClientAccountPanel title="Compte source" client={sourceClient} accountId={sourceAccountId} onAccountChange={setSourceAccountId} />
                </div>
                {isTransfer && (
                  <div>
                    <ClientSearchBox label="Client bénéficiaire (compte destination)" onPick={pickDestClient} />
                    <ClientAccountPanel title="Compte bénéficiaire" client={destClient} accountId={destAccountId} onAccountChange={setDestAccountId} />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                <div className="form-group"><label>Montant</label><input type="number" required value={form.montant} onChange={(e) => setForm({ ...form, montant: e.target.value })} /></div>
                <div className="form-group"><label>Remettant</label><input value={form.remitterName} onChange={(e) => setForm({ ...form, remitterName: e.target.value })} /></div>
                <div className="form-group"><label>Bénéficiaire</label><input value={form.beneficiaryName} onChange={(e) => setForm({ ...form, beneficiaryName: e.target.value })} /></div>
              </div>

              <div className="form-group mt-3">
                <label>Mode de paiement</label>
                <select value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}>
                  <option value="CASH">Espèces</option>
                  <option value="MOBILE_MONEY">Mobile Money</option>
                  <option value="BANK_TRANSFER">Virement bancaire</option>
                  <option value="CHEQUE">Chèque</option>
                </select>
              </div>

              {form.paymentMethod === 'CASH' && (
                <div className="mt-3">
                  <DenominationCounter counts={cashCounts} onChange={setCashCounts} targetAmount={form.montant ? Number(form.montant) : null} />
                </div>
              )}
            </form>
          )}
        </WideModal>
      )}

      {showImport && (
        <Modal title="Importer des transactions (Excel)" onClose={() => setShowImport(false)} footer={
          <>
            <button className="btn btn-outline" onClick={() => setShowImport(false)}>Annuler</button>
            <button className="btn btn-primary" disabled={importRows.length === 0 || importSubmitting} onClick={submitImport}>
              {importSubmitting ? 'Envoi…' : `Soumettre ${importRows.length} ligne(s) pour validation`}
            </button>
          </>
        }>
          {importError && <div className="error-banner">{importError}</div>}
          <p className="text-xs text-gray-500 normal-case mb-2">
            Colonnes attendues : <code>TransactionType, AccountID, ToAccountID, CollectorID, Montant, RemitterName, BeneficiaryName</code>.
            Chaque ligne sera soumise pour validation dans le module « Validation des opérations » avant d'être réellement enregistrée.
          </p>
          <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} />
          {importRows.length > 0 && (
            <div className="table-wrap mt-3" style={{ maxHeight: 300, overflowY: 'auto' }}>
              <table className="data-table">
                <thead><tr><th>Type</th><th>Compte</th><th>Bénéficiaire</th><th>Montant</th><th>Remettant</th></tr></thead>
                <tbody>
                  {importRows.map((r, i) => (
                    <tr key={i}>
                      <td>{TYPE_LABELS[r.transactionType] || r.transactionType}</td>
                      <td>{r.accountID}</td>
                      <td>{r.toAccountID || '—'}</td>
                      <td>{fmt(r.montant)}</td>
                      <td>{r.remitterName || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
