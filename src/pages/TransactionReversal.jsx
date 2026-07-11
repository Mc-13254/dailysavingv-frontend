import { useEffect, useState } from 'react';
import { Check, X, Undo2, Search } from 'lucide-react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import ExportDropdown from '../components/ExportDropdown';
import { TransactionAPI, ClientAPI } from '../api/endpoints';

const fmt = (n) => new Intl.NumberFormat('fr-FR').format(n || 0);
const fmtDate = (d) => d ? new Date(d).toLocaleString('fr-FR') : '—';

export default function TransactionReversal() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');

  const [showNew, setShowNew] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const [clientResults, setClientResults] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [form, setForm] = useState({ collectorID: '', montant: '', reason: '' });
  const [error, setError] = useState('');

  const [rejecting, setRejecting] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const [executing, setExecuting] = useState(null);
  const [executeTxId, setExecuteTxId] = useState('');
  const [executeError, setExecuteError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const params = status ? { status } : {};
      const { data } = await TransactionAPI.reversalRequests(params);
      setRows(data);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line
  useEffect(() => { load(); }, [status]); // eslint-disable-line

  const searchClients = async (q) => {
    setClientSearch(q);
    if (q.length < 2) { setClientResults([]); return; }
    const { data } = await ClientAPI.list(q);
    setClientResults(data);
  };

  const openNew = () => {
    setSelectedClient(null); setClientSearch(''); setClientResults([]);
    setForm({ collectorID: '', montant: '', reason: '' });
    setError(''); setShowNew(true);
  };

  const submit = async () => {
    setError('');
    try {
      await TransactionAPI.requestReversal({
        clientID: selectedClient.clientID,
        collectorID: selectedClient.collectorID || form.collectorID || null,
        montant: Number(form.montant),
        reason: form.reason,
      });
      setShowNew(false);
      load();
    } catch (err) {
      setError(err?.response?.data?.message || 'Échec de la soumission.');
    }
  };

  const approve = async (row) => { await TransactionAPI.approveReversal(row.transactionReversalRequestID); load(); };
  const reject = async () => {
    if (!rejectReason) return;
    await TransactionAPI.rejectReversal(rejecting.transactionReversalRequestID, rejectReason);
    setRejecting(null);
    load();
  };

  const execute = async () => {
    setExecuteError('');
    try {
      await TransactionAPI.executeReversal(executing.transactionReversalRequestID, Number(executeTxId));
      setExecuting(null);
      load();
    } catch (err) {
      setExecuteError(err?.response?.data?.message || "Échec de l'exécution.");
    }
  };

  const columns = [
    { key: 'clientName', label: 'Client' },
    { key: 'collectorName', label: 'Collecteur', render: (r) => r.collectorName || '—' },
    { key: 'montant', label: 'Montant', render: (r) => fmt(r.montant) },
    { key: 'reason', label: 'Motif' },
    { key: 'status', label: 'Statut', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'requestedBy', label: 'Demandé par' },
    { key: 'requestDate', label: 'Le', render: (r) => fmtDate(r.requestDate) },
    { key: 'transactionID', label: 'N° Transaction', render: (r) => r.transactionID || '—' },
    {
      key: 'actions', label: 'Actions', sortable: false, render: (r) => (
        <div className="flex items-center gap-1">
          {r.status === 'PENDING' && (
            <>
              <button className="btn btn-primary btn-sm" onClick={() => approve(r)}><Check size={13} /></button>
              <button className="btn btn-danger btn-sm" onClick={() => { setRejecting(r); setRejectReason(''); }}><X size={13} /></button>
            </>
          )}
          {r.status === 'APPROVED' && (
            <button className="btn btn-primary btn-sm" onClick={() => { setExecuting(r); setExecuteTxId(''); setExecuteError(''); }}>
              <Undo2 size={13} /> Exécuter
            </button>
          )}
        </div>
      )
    },
  ];

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <div className="panel-title">Transaction Reversal</div>
          <div className="panel-subtitle">Demande de contre-passation (Dépôt/Retrait/Transfert) — approbation requise avant exécution.</div>
        </div>
      </div>

      <div className="toolbar flex-wrap gap-2">
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Tous les statuts</option>
          <option value="PENDING">En attente d'approbation</option>
          <option value="APPROVED">Approuvée — en attente d'exécution</option>
          <option value="REJECTED">Rejetée</option>
          <option value="COMPLETED">Exécutée</option>
        </select>
        <button className="btn btn-primary" onClick={openNew}>+ Nouvelle demande</button>
        <ExportDropdown filename="TRANSACTION_REVERSALS" columns={columns.filter((c) => c.key !== 'actions')} rows={rows} />
      </div>

      <DataTable columns={columns} rows={rows} loading={loading} totalLabel={`TOTAL: ${rows.length}`} />

      {showNew && (
        <Modal title="Nouvelle demande de contre-passation" onClose={() => setShowNew(false)} footer={
          <>
            <button className="btn btn-outline" onClick={() => setShowNew(false)}>Annuler</button>
            <button className="btn btn-primary" disabled={!selectedClient || !form.montant || !form.reason} onClick={submit}>Soumettre</button>
          </>
        }>
          {error && <div className="error-banner mb-2">{error}</div>}
          <div className="form-group relative">
            <label>Client *</label>
            <div className="relative">
              <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
              <input className="pl-7" value={selectedClient ? `${selectedClient.clientID} — ${selectedClient.nom} ${selectedClient.prenom || ''}` : clientSearch}
                onChange={(e) => { setSelectedClient(null); searchClients(e.target.value); }} placeholder="Rechercher un client…" />
            </div>
            {!selectedClient && clientResults.length > 0 && (
              <ul className="absolute z-50 left-0 right-0 mt-1 bg-white border rounded-md shadow-lg max-h-48 overflow-y-auto text-xs">
                {clientResults.map((c) => (
                  <li key={c.clientID} className="px-2.5 py-1.5 cursor-pointer hover:bg-gray-50" onClick={() => { setSelectedClient(c); setClientResults([]); }}>
                    {c.clientID} — {c.nom} {c.prenom}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="form-group"><label>Montant de la transaction à contre-passer *</label><input type="number" value={form.montant} onChange={(e) => setForm({ ...form, montant: e.target.value })} /></div>
          <div className="form-group"><label>Motif de la contre-passation *</label><textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></div>
          <p className="text-[11px] text-gray-400 normal-case">Vous n'avez pas besoin du numéro de transaction maintenant — il sera demandé après approbation.</p>
        </Modal>
      )}

      {rejecting && (
        <Modal title="Rejeter la demande" onClose={() => setRejecting(null)} footer={
          <>
            <button className="btn btn-outline" onClick={() => setRejecting(null)}>Annuler</button>
            <button className="btn btn-danger" disabled={!rejectReason} onClick={reject}>Rejeter</button>
          </>
        }>
          <div className="form-group"><label>Motif du rejet *</label><textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} /></div>
        </Modal>
      )}

      {executing && (
        <Modal title="Exécuter la contre-passation" onClose={() => setExecuting(null)} footer={
          <>
            <button className="btn btn-outline" onClick={() => setExecuting(null)}>Annuler</button>
            <button className="btn btn-primary" disabled={!executeTxId} onClick={execute}>Exécuter immédiatement</button>
          </>
        }>
          {executeError && <div className="error-banner mb-2">{executeError}</div>}
          <p className="text-xs text-gray-600 normal-case mb-2">
            Demande approuvée pour <strong>{executing.clientName}</strong> — {fmt(executing.montant)}. Entrez le numéro exact de la transaction à contre-passer.
          </p>
          <div className="form-group"><label>N° Transaction (ID) *</label><input type="number" value={executeTxId} onChange={(e) => setExecuteTxId(e.target.value)} /></div>
        </Modal>
      )}
    </div>
  );
}
