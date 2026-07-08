import { useEffect, useState } from 'react';
import { Snowflake, XCircle, FileBarChart, PlayCircle } from 'lucide-react';
import DataTable from '../components/DataTable';
import WideModal from '../components/WideModal';
import StatusBadge from '../components/StatusBadge';
import ExportDropdown from '../components/ExportDropdown';
import SearchableSelect from '../components/SearchableSelect';
import WizardStepper from '../components/WizardStepper';
import { AccountAPI } from '../api/endpoints';

const STEPS = ['Contrat', 'Compte', 'Paramètres', 'Statut', 'Révision'];

const emptyForm = {
  contractID: '', numCarnet: '', accountType: 'DAILY_SAVING', currency: 'XAF',
  openingBalance: '0', minimumBalance: '', maximumBalance: '',
  dailyDepositLimit: '', dailyWithdrawalLimit: '', dailyTransactionLimit: '',
  overdraftAllowed: false, overdraftLimit: '',
};

function Field({ label, children }) {
  return <div className="form-group">{label && <label>{label}</label>}{children}</div>;
}

export default function AccountManagement() {
  const [rows, setRows] = useState([]);
  const [pendingRows, setPendingRows] = useState([]);
  const [eligibleContracts, setEligibleContracts] = useState([]);
  const [tab, setTab] = useState('active');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const [showWizard, setShowWizard] = useState(false);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [statement, setStatement] = useState(null);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [{ data: list }, { data: pend }] = await Promise.all([
        AccountAPI.list(search),
        AccountAPI.pending().catch(() => ({ data: [] })),
      ]);
      setRows(list);
      setPendingRows(pend);
    } finally { setLoading(false); }
  };

  useEffect(() => { loadAll(); }, [search]);

  const openCreate = async () => {
    setForm(emptyForm);
    setStep(0);
    setError('');
    const { data } = await AccountAPI.eligibleContracts();
    setEligibleContracts(data);
    setShowWizard(true);
  };

  const set = (field) => (e) => setForm({ ...form, [field]: e?.target ? (e.target.type === 'checkbox' ? e.target.checked : e.target.value) : e });

  const selectedContract = eligibleContracts.find((c) => c.contractID === Number(form.contractID));
  const contractOptions = eligibleContracts.map((c) => ({ value: c.contractID, label: `${c.contractNumber} — ${c.clientName || c.clientID}` }));

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        clientID: selectedContract?.clientID,
        contractID: Number(form.contractID),
        numCarnet: form.numCarnet || null,
        accountType: form.accountType,
        currency: form.currency,
        openingBalance: Number(form.openingBalance || 0),
        minimumBalance: form.minimumBalance ? Number(form.minimumBalance) : null,
        maximumBalance: form.maximumBalance ? Number(form.maximumBalance) : null,
        dailyDepositLimit: form.dailyDepositLimit ? Number(form.dailyDepositLimit) : null,
        dailyWithdrawalLimit: form.dailyWithdrawalLimit ? Number(form.dailyWithdrawalLimit) : null,
        dailyTransactionLimit: form.dailyTransactionLimit ? Number(form.dailyTransactionLimit) : null,
        overdraftAllowed: form.overdraftAllowed,
        overdraftLimit: form.overdraftLimit ? Number(form.overdraftLimit) : null,
      };
      await AccountAPI.create(payload);
      setNotice('Compte soumis pour validation.');
      setShowWizard(false);
      loadAll();
    } catch (e) {
      setError(e?.response?.data?.message || "Échec de l'ouverture du compte.");
    } finally { setSubmitting(false); }
  };

  const handleFreeze = async (row) => {
    const reason = window.prompt('Motif du gel (Fraud Investigation / Customer Request / Legal Issue / Compliance) ?', 'Compliance');
    if (!reason) return;
    await AccountAPI.freeze(row.accountID, reason);
    setNotice('Compte gelé.');
    loadAll();
  };
  const handleUnfreeze = async (row) => { await AccountAPI.unfreeze(row.accountID); setNotice('Compte réactivé.'); loadAll(); };
  const handleClose = async (row) => {
    const reason = window.prompt('Motif de clôture (Customer Request / Contract Completed / Transfer / Death / Other) ?', 'Customer Request');
    if (!reason) return;
    await AccountAPI.close(row.accountID, reason);
    setNotice('Compte clôturé.');
    loadAll();
  };
  const openStatement = async (row) => {
    const { data } = await AccountAPI.statement(row.accountID);
    setStatement(data);
  };

  const columns = [
    { key: 'accountID', label: 'N° Compte' },
    { key: 'clientName', label: 'Client', render: (r) => r.clientName || r.clientID },
    { key: 'contractNumber', label: 'Contrat', render: (r) => r.contractNumber || '—' },
    { key: 'collectorName', label: 'Collecteur', render: (r) => r.collectorName || '—' },
    { key: 'accountType', label: 'Type' },
    { key: 'balance', label: 'Solde actuel', render: (r) => `${r.balance?.toLocaleString('fr-FR')} ${r.currency}` },
    { key: 'availableBalance', label: 'Disponible', render: (r) => `${r.availableBalance?.toLocaleString('fr-FR')} ${r.currency}` },
    { key: 'blockedBalance', label: 'Bloqué', render: (r) => `${r.blockedBalance?.toLocaleString('fr-FR')} ${r.currency}` },
    { key: 'status', label: 'Statut', render: (r) => <StatusBadge status={r.status} /> },
    {
      key: 'actions', label: 'Actions', sortable: false, render: (r) => (
        <div className="flex items-center gap-1.5">
          <button className="btn-icon" title="Relevé" onClick={() => openStatement(r)}><FileBarChart size={15} /></button>
          {r.status === 'ACTIVE' && <button className="btn-icon" title="Geler" onClick={() => handleFreeze(r)}><Snowflake size={15} /></button>}
          {r.status === 'FROZEN' && <button className="btn-icon text-emerald-600" title="Réactiver" onClick={() => handleUnfreeze(r)}><PlayCircle size={15} /></button>}
          {r.status !== 'CLOSED' && <button className="btn-icon text-red-500" title="Clôturer" onClick={() => handleClose(r)}><XCircle size={15} /></button>}
        </div>
      )
    },
  ];

  const pendingColumns = [
    { key: 'pendingID', label: 'Pending ID' },
    { key: 'actionType', label: 'Action' },
    { key: 'clientID', label: 'Client' },
    { key: 'requestUser', label: 'Demandé par' },
    { key: 'requestDate', label: 'Date', render: (r) => new Date(r.requestDate).toLocaleString('fr-FR') },
    {
      key: 'actions', label: 'Actions', sortable: false, render: (r) => (
        <div className="flex items-center gap-2">
          <button className="btn btn-primary btn-sm" onClick={async () => { await AccountAPI.approve(r.pendingID); loadAll(); }}>Valider</button>
          <button className="btn btn-danger btn-sm" onClick={async () => { const reason = window.prompt('Motif ?') || 'Non spécifié'; await AccountAPI.reject(r.pendingID, reason); loadAll(); }}>Rejeter</button>
        </div>
      )
    },
  ];

  return (
    <div className="panel">
      <div className="panel-header">
        <div className="panel-title">Client Accounts</div>
        <button className="btn btn-primary" onClick={openCreate}>+ Open Account</button>
      </div>

      {notice && <div className="mb-3 text-xs text-green-700 bg-green-50 px-3 py-2 rounded normal-case">{notice}</div>}

      <div className="toolbar">
        <input className="search-input" placeholder="N° compte, carnet, client…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="toggle-group">
          <button className={`toggle-btn${tab === 'active' ? ' active' : ''}`} onClick={() => setTab('active')}>Comptes</button>
          <button className={`toggle-btn${tab === 'pending' ? ' active' : ''}`} onClick={() => setTab('pending')}>En attente</button>
        </div>
        {tab === 'active' && <ExportDropdown filename="COMPTES" columns={columns.filter((c) => c.key !== 'actions')} rows={rows} />}
      </div>

      {tab === 'active' ? (
        <DataTable columns={columns} rows={rows} loading={loading} totalLabel={`TOTAL COMPTES: ${rows.length}`} />
      ) : (
        <DataTable columns={pendingColumns} rows={pendingRows} loading={loading} totalLabel={`EN ATTENTE: ${pendingRows.length}`} />
      )}

      {showWizard && (
        <WideModal
          title="Open Account"
          onClose={() => setShowWizard(false)}
          footer={
            <>
              {step > 0 && <button className="btn btn-outline" onClick={() => setStep((s) => s - 1)}>Précédent</button>}
              {step < STEPS.length - 1 && <button className="btn btn-primary" onClick={() => setStep((s) => s + 1)} disabled={step === 0 && !form.contractID}>Suivant</button>}
              {step === STEPS.length - 1 && (
                <button className="btn btn-primary" disabled={submitting} onClick={handleSubmit}>{submitting ? 'Envoi…' : 'Ouvrir le compte'}</button>
              )}
            </>
          }
        >
          <WizardStepper steps={STEPS} current={step} onJump={setStep} />
          {error && <div className="error-banner">{error}</div>}

          {step === 0 && (
            <div>
              <Field label="Contrat (client validé + contrat actif) *">
                <SearchableSelect options={contractOptions} value={form.contractID} onChange={(v) => setForm({ ...form, contractID: v })} placeholder="Rechercher un contrat…" />
              </Field>
              {selectedContract && (
                <div className="form-card mt-3">
                  <div className="form-card-title">Aperçu</div>
                  <p className="text-xs normal-case">Client: {selectedContract.clientName || selectedContract.clientID}</p>
                  <p className="text-xs normal-case">Contrat: {selectedContract.contractNumber} · Fréquence: {selectedContract.collectionFrequency}</p>
                </div>
              )}
            </div>
          )}

          {step === 1 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field label="N° Carnet"><input value={form.numCarnet} onChange={set('numCarnet')} /></Field>
              <Field label="Type de compte">
                <select value={form.accountType} onChange={set('accountType')}>
                  <option value="DAILY_SAVING">Daily Saving</option><option value="BUSINESS_SAVING">Business Saving</option>
                  <option value="VIP_SAVING">VIP Saving</option><option value="ASSOCIATION">Association</option>
                </select>
              </Field>
              <Field label="Devise"><input value={form.currency} onChange={set('currency')} /></Field>
              <Field label="Dépôt d'ouverture"><input type="number" value={form.openingBalance} onChange={set('openingBalance')} /></Field>
            </div>
          )}

          {step === 2 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field label="Solde minimum"><input type="number" value={form.minimumBalance} onChange={set('minimumBalance')} /></Field>
              <Field label="Solde maximum"><input type="number" value={form.maximumBalance} onChange={set('maximumBalance')} /></Field>
              <Field label="Limite dépôt/jour"><input type="number" value={form.dailyDepositLimit} onChange={set('dailyDepositLimit')} /></Field>
              <Field label="Limite retrait/jour"><input type="number" value={form.dailyWithdrawalLimit} onChange={set('dailyWithdrawalLimit')} /></Field>
              <Field label="Limite transaction/jour"><input type="number" value={form.dailyTransactionLimit} onChange={set('dailyTransactionLimit')} /></Field>
              <Field label="Découvert autorisé">
                <label className="flex items-center gap-2 text-xs normal-case mt-2"><input type="checkbox" checked={form.overdraftAllowed} onChange={set('overdraftAllowed')} /> Oui</label>
              </Field>
              {form.overdraftAllowed && <Field label="Limite de découvert"><input type="number" value={form.overdraftLimit} onChange={set('overdraftLimit')} /></Field>}
            </div>
          )}

          {step === 3 && (
            <div className="text-xs normal-case">
              <p>Le compte sera créé avec le statut <strong>Pending</strong> puis <strong>Active</strong> après validation par un superviseur (circuit Maker-Checker standard de l'application).</p>
            </div>
          )}

          {step === 4 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs normal-case">
              <div className="form-card">
                <div className="form-card-title">Client / Contrat</div>
                <p>{selectedContract?.clientName || selectedContract?.clientID} — {selectedContract?.contractNumber}</p>
              </div>
              <div className="form-card">
                <div className="form-card-title">Compte</div>
                <p>{form.accountType} · {form.currency} · Dépôt: {form.openingBalance}</p>
              </div>
            </div>
          )}
        </WideModal>
      )}

      {statement && (
        <WideModal title={`Relevé de compte — ${statement.accountID}`} onClose={() => setStatement(null)}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 text-xs normal-case">
            <div className="form-card"><div className="form-card-title">Solde d'ouverture</div><p>{statement.openingBalance.toLocaleString('fr-FR')}</p></div>
            <div className="form-card"><div className="form-card-title">Solde de clôture</div><p>{statement.closingBalance.toLocaleString('fr-FR')}</p></div>
            <div className="form-card"><div className="form-card-title">Total collectes</div><p>{statement.totalCollections.toLocaleString('fr-FR')}</p></div>
            <div className="form-card"><div className="form-card-title">Dépôts / Retraits</div><p>{statement.totalDeposits.toLocaleString('fr-FR')} / {statement.totalWithdrawals.toLocaleString('fr-FR')}</p></div>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Date</th><th>Type</th><th>Montant</th><th>Solde cumulé</th></tr></thead>
              <tbody>
                {statement.lines.length === 0 && <tr><td colSpan={4} className="empty-state">Aucune transaction sur cette période.</td></tr>}
                {statement.lines.map((l, i) => (
                  <tr key={i}>
                    <td>{new Date(l.date).toLocaleDateString('fr-FR')}</td>
                    <td>{l.type}</td>
                    <td className={l.amount < 0 ? 'text-red-600' : 'text-emerald-600'}>{l.amount.toLocaleString('fr-FR')}</td>
                    <td>{l.runningBalance.toLocaleString('fr-FR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </WideModal>
      )}
    </div>
  );
}
