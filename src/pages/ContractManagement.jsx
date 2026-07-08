import { useEffect, useState } from 'react';
import jsPDF from 'jspdf';
import { FileText, XCircle, Download } from 'lucide-react';
import DataTable from '../components/DataTable';
import WideModal from '../components/WideModal';
import StatusBadge from '../components/StatusBadge';
import ExportDropdown from '../components/ExportDropdown';
import SearchableSelect from '../components/SearchableSelect';
import WizardStepper from '../components/WizardStepper';
import { ContractAPI, ContractTypeAPI, CommissionAPI } from '../api/endpoints';

const STEPS = ['Client', 'Contrat', 'Finances', 'Documents', 'Révision'];

const emptyForm = {
  clientID: '', contractTypeID: '', commissionTypeID: '', commissionRangeID: '',
  collectionFrequency: 'DAILY', collectionDay: '',
  openingDeposit: '', minimumBalance: '', maximumBalance: '', penaltyRules: '', gracePeriod: '',
  startDate: new Date().toISOString().slice(0, 10), endDate: '', contractType: '',
  contractDetails: '', description: '', renewalTerms: '', terminationClause: '',
};

function Field({ label, children }) {
  return <div className="form-group">{label && <label>{label}</label>}{children}</div>;
}

function generateContractPdf(form, client, contractNumber) {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text('AnyCollect — Contrat de Compte d\'Épargne', 14, 18);
  doc.setFontSize(10);
  doc.text(`N° Contrat: ${contractNumber}`, 14, 28);
  doc.text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, 14, 34);

  doc.setFontSize(12);
  doc.text('Client', 14, 46);
  doc.setFontSize(10);
  doc.text(`${client?.nom || ''} ${client?.prenom || ''}  (Code: ${form.clientID})`, 14, 52);
  doc.text(`Téléphone: ${client?.phoneNumber || '—'}`, 14, 58);

  doc.setFontSize(12);
  doc.text('Conditions du contrat', 14, 70);
  doc.setFontSize(10);
  const lines = [
    `Fréquence de collecte: ${form.collectionFrequency}${form.collectionDay ? ' (' + form.collectionDay + ')' : ''}`,
    `Date de début: ${form.startDate}   Date de fin: ${form.endDate || 'Indéterminée'}`,
    `Dépôt d'ouverture: ${form.openingDeposit || 0}`,
    `Solde minimum: ${form.minimumBalance || '—'}   Solde maximum: ${form.maximumBalance || '—'}`,
    `Règles de pénalité: ${form.penaltyRules || '—'}`,
    `Période de grâce: ${form.gracePeriod || 0} jours`,
    '',
    `Description: ${form.description || '—'}`,
    `Conditions de renouvellement: ${form.renewalTerms || '—'}`,
    `Clause de résiliation: ${form.terminationClause || '—'}`,
  ];
  let y = 78;
  lines.forEach((l) => { doc.text(l, 14, y); y += 7; });

  y += 15;
  doc.text('Signature du client: ______________________', 14, y);
  doc.text('Signature de l\'agent: ______________________', 110, y);

  doc.save(`Contrat_${contractNumber}.pdf`);
}

export default function ContractManagement() {
  const [rows, setRows] = useState([]);
  const [pendingRows, setPendingRows] = useState([]);
  const [eligibleClients, setEligibleClients] = useState([]);
  const [contractTypes, setContractTypes] = useState([]);
  const [commissionTypes, setCommissionTypes] = useState([]);
  const [commissionRanges, setCommissionRanges] = useState([]);
  const [tab, setTab] = useState('active');
  const [loading, setLoading] = useState(true);

  const [showWizard, setShowWizard] = useState(false);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadAll = async () => {
    setLoading(true);
    try {
      const [{ data: list }, { data: pend }] = await Promise.all([
        ContractAPI.list(),
        ContractAPI.pending().catch(() => ({ data: [] })),
      ]);
      setRows(list);
      setPendingRows(pend);
    } finally { setLoading(false); }
  };

  useEffect(() => { loadAll(); }, []);
  useEffect(() => {
    ContractTypeAPI.active().then(({ data }) => setContractTypes(data)).catch(() => {});
    CommissionAPI.types().then(({ data }) => setCommissionTypes(data)).catch(() => {});
  }, []);

  const openCreate = async () => {
    setForm(emptyForm);
    setStep(0);
    setError('');
    const { data } = await ContractAPI.eligibleClients();
    setEligibleClients(data);
    setShowWizard(true);
  };

  const set = (field) => (e) => setForm({ ...form, [field]: e?.target ? e.target.value : e });

  const onCommissionTypeChange = async (v) => {
    setForm({ ...form, commissionTypeID: v, commissionRangeID: '' });
    if (v) {
      const { data } = await CommissionAPI.ranges(v);
      setCommissionRanges(data);
    } else setCommissionRanges([]);
  };

  const selectedClient = eligibleClients.find((c) => c.clientID === form.clientID);
  const clientOptions = eligibleClients.map((c) => ({ value: c.clientID, label: `${c.clientID} — ${c.nom} ${c.prenom || ''}` }));
  const contractTypeOptions = contractTypes.map((t) => ({ value: t.contractTypeID, label: t.contractName }));
  const commissionTypeOptions = commissionTypes.map((t) => ({ value: t.commissionTypeID, label: t.name }));
  const commissionRangeOptions = commissionRanges.map((r) => ({
    value: r.commissionRangeID,
    label: r.description || `${r.inf} — ${r.sup} (${r.calculationMethod})`,
  }));

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        ...form,
        contractTypeID: form.contractTypeID ? Number(form.contractTypeID) : null,
        commissionTypeID: form.commissionTypeID ? Number(form.commissionTypeID) : null,
        commissionRangeID: form.commissionRangeID ? Number(form.commissionRangeID) : null,
        openingDeposit: form.openingDeposit ? Number(form.openingDeposit) : null,
        minimumBalance: form.minimumBalance ? Number(form.minimumBalance) : null,
        maximumBalance: form.maximumBalance ? Number(form.maximumBalance) : null,
        gracePeriod: form.gracePeriod ? Number(form.gracePeriod) : null,
        endDate: form.endDate || null,
      };
      const { data } = await ContractAPI.create(payload);
      setNotice(`Contrat ${data.contractNumber} soumis pour validation.`);
      generateContractPdf(form, selectedClient, data.contractNumber);
      setShowWizard(false);
      loadAll();
    } catch (e) {
      setError(e?.response?.data?.message || 'Échec de la création du contrat.');
    } finally { setSubmitting(false); }
  };

  const handleTerminate = async (row) => {
    const reason = window.prompt('Motif de clôture (Completed / CustomerRequest / Violation / Other) ?', 'Completed');
    if (!reason) return;
    await ContractAPI.terminate(row.contractID, reason);
    setNotice('Contrat clôturé.');
    loadAll();
  };

  const handleApprove = async (id) => { await ContractAPI.approve(id); loadAll(); };
  const handleReject = async (id) => {
    const reason = window.prompt('Motif du rejet ?') || 'Non spécifié';
    await ContractAPI.reject(id, reason);
    loadAll();
  };

  const activeRows = rows.filter((r) => r.statut === 'ACTIVE');
  const terminatedRows = rows.filter((r) => r.statut !== 'ACTIVE');

  const columns = [
    { key: 'contractNumber', label: 'N° Contrat' },
    { key: 'clientName', label: 'Client', render: (r) => r.clientName || r.clientID },
    { key: 'collectorName', label: 'Collecteur', render: (r) => r.collectorName || '—' },
    { key: 'contractType', label: 'Type' },
    { key: 'collectionFrequency', label: 'Fréquence' },
    { key: 'startDate', label: 'Début', render: (r) => new Date(r.startDate).toLocaleDateString('fr-FR') },
    { key: 'endDate', label: 'Fin', render: (r) => r.endDate ? new Date(r.endDate).toLocaleDateString('fr-FR') : '—' },
    { key: 'statut', label: 'Statut', render: (r) => <StatusBadge status={r.statut} /> },
    tab === 'active' ? {
      key: 'actions', label: 'Actions', sortable: false, render: (r) => (
        <button className="btn-icon text-red-500" title="Clôturer" onClick={() => handleTerminate(r)}><XCircle size={15} /></button>
      )
    } : { key: 'terminationReason', label: 'Motif clôture', render: (r) => r.terminationReason || '—' },
  ];

  const pendingColumns = [
    { key: 'pendingID', label: 'Pending ID' },
    { key: 'actionType', label: 'Action' },
    { key: 'contractNumber', label: 'N° Contrat' },
    { key: 'clientID', label: 'Client' },
    { key: 'requestUser', label: 'Demandé par' },
    { key: 'requestDate', label: 'Date', render: (r) => new Date(r.requestDate).toLocaleString('fr-FR') },
    {
      key: 'actions', label: 'Actions', sortable: false, render: (r) => (
        <div className="flex items-center gap-2">
          <button className="btn btn-primary btn-sm" onClick={() => handleApprove(r.pendingID)}>Valider</button>
          <button className="btn btn-danger btn-sm" onClick={() => handleReject(r.pendingID)}>Rejeter</button>
        </div>
      )
    },
  ];

  return (
    <div className="panel">
      <div className="panel-header">
        <div className="panel-title">Client Contracts</div>
        <button className="btn btn-primary" onClick={openCreate}><FileText size={14} /> + Create Contract</button>
      </div>

      {notice && <div className="mb-3 text-xs text-green-700 bg-green-50 px-3 py-2 rounded normal-case">{notice}</div>}

      <div className="toolbar">
        <div className="toggle-group">
          <button className={`toggle-btn${tab === 'active' ? ' active' : ''}`} onClick={() => setTab('active')}>Actifs</button>
          <button className={`toggle-btn${tab === 'terminated' ? ' active' : ''}`} onClick={() => setTab('terminated')}>Clôturés</button>
          <button className={`toggle-btn${tab === 'pending' ? ' active' : ''}`} onClick={() => setTab('pending')}>En attente</button>
        </div>
        {tab !== 'pending' && <ExportDropdown filename="CONTRATS" columns={columns.filter((c) => c.key !== 'actions')} rows={tab === 'active' ? activeRows : terminatedRows} />}
      </div>

      {tab === 'pending' ? (
        <DataTable columns={pendingColumns} rows={pendingRows} loading={loading} totalLabel={`EN ATTENTE: ${pendingRows.length}`} />
      ) : (
        <DataTable columns={columns} rows={tab === 'active' ? activeRows : terminatedRows} loading={loading} totalLabel={`TOTAL: ${(tab === 'active' ? activeRows : terminatedRows).length}`} />
      )}

      {showWizard && (
        <WideModal
          title="Create Contract"
          onClose={() => setShowWizard(false)}
          footer={
            <>
              {step > 0 && <button className="btn btn-outline" onClick={() => setStep((s) => s - 1)}>Précédent</button>}
              {step < STEPS.length - 1 && <button className="btn btn-primary" onClick={() => setStep((s) => s + 1)} disabled={step === 0 && !form.clientID}>Suivant</button>}
              {step === STEPS.length - 1 && (
                <button className="btn btn-primary" disabled={submitting} onClick={handleSubmit}>
                  <Download size={14} /> {submitting ? 'Envoi…' : 'Générer le contrat & Soumettre'}
                </button>
              )}
            </>
          }
        >
          <WizardStepper steps={STEPS} current={step} onJump={setStep} />
          {error && <div className="error-banner">{error}</div>}

          {step === 0 && (
            <div>
              <Field label="Client (uniquement les clients Actifs) *">
                <SearchableSelect options={clientOptions} value={form.clientID} onChange={(v) => setForm({ ...form, clientID: v })} placeholder="Rechercher un client…" />
              </Field>
              {selectedClient && (
                <div className="form-card mt-3">
                  <div className="form-card-title">Aperçu client</div>
                  <p className="text-xs normal-case">Code: {selectedClient.clientID} · {selectedClient.nom} {selectedClient.prenom}</p>
                  <p className="text-xs normal-case">Téléphone: {selectedClient.phoneNumber || '—'} · Agence: {selectedClient.agenceID}</p>
                </div>
              )}
            </div>
          )}

          {step === 1 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field label="Type de contrat">
                <SearchableSelect options={contractTypeOptions} value={form.contractTypeID} onChange={(v) => setForm({ ...form, contractTypeID: v })} placeholder="Choisir…" />
              </Field>
              <Field label="Type de commission">
                <SearchableSelect options={commissionTypeOptions} value={form.commissionTypeID} onChange={onCommissionTypeChange} placeholder="Choisir…" />
              </Field>
              <Field label="Barème de commission">
                <SearchableSelect options={commissionRangeOptions} value={form.commissionRangeID} onChange={(v) => setForm({ ...form, commissionRangeID: v })} placeholder="Choisir…" />
              </Field>
              <Field label="Fréquence de collecte">
                <select value={form.collectionFrequency} onChange={set('collectionFrequency')}>
                  <option value="DAILY">Journalière</option><option value="WEEKLY">Hebdomadaire</option><option value="MONTHLY">Mensuelle</option>
                </select>
              </Field>
              <Field label="Jour de collecte"><input value={form.collectionDay} onChange={set('collectionDay')} placeholder="ex: Lundi" /></Field>
              <Field label="Date de début"><input type="date" value={form.startDate} onChange={set('startDate')} /></Field>
              <Field label="Date de fin"><input type="date" value={form.endDate} onChange={set('endDate')} /></Field>
            </div>
          )}

          {step === 2 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field label="Dépôt d'ouverture"><input type="number" value={form.openingDeposit} onChange={set('openingDeposit')} /></Field>
              <Field label="Solde minimum"><input type="number" value={form.minimumBalance} onChange={set('minimumBalance')} /></Field>
              <Field label="Solde maximum"><input type="number" value={form.maximumBalance} onChange={set('maximumBalance')} /></Field>
              <Field label="Règles de pénalité"><input value={form.penaltyRules} onChange={set('penaltyRules')} /></Field>
              <Field label="Période de grâce (jours)"><input type="number" value={form.gracePeriod} onChange={set('gracePeriod')} /></Field>
            </div>
          )}

          {step === 3 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Description"><textarea value={form.description} onChange={set('description')} /></Field>
              <Field label="Détails du contrat"><textarea value={form.contractDetails} onChange={set('contractDetails')} /></Field>
              <Field label="Conditions de renouvellement"><textarea value={form.renewalTerms} onChange={set('renewalTerms')} /></Field>
              <Field label="Clause de résiliation"><textarea value={form.terminationClause} onChange={set('terminationClause')} /></Field>
              <p className="text-[11px] text-gray-500 normal-case sm:col-span-2">
                Le PDF du contrat sera généré automatiquement (téléchargement) lors de la soumission, avec emplacement pour signature client/agent.
              </p>
            </div>
          )}

          {step === 4 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs normal-case">
              <div className="form-card">
                <div className="form-card-title">Client</div>
                <p>{selectedClient?.nom} {selectedClient?.prenom} ({form.clientID})</p>
              </div>
              <div className="form-card">
                <div className="form-card-title">Contrat</div>
                <p>Fréquence: {form.collectionFrequency} · Début: {form.startDate} · Fin: {form.endDate || 'Indéterminée'}</p>
              </div>
              <div className="form-card">
                <div className="form-card-title">Finances</div>
                <p>Dépôt: {form.openingDeposit || 0} · Min: {form.minimumBalance || '—'} · Max: {form.maximumBalance || '—'}</p>
              </div>
              <div className="form-card">
                <div className="form-card-title">Documents</div>
                <p>PDF généré au moment de la soumission.</p>
              </div>
            </div>
          )}
        </WideModal>
      )}
    </div>
  );
}
