import { useEffect, useState } from 'react';
import { Eye, Check, X, Banknote, Search } from 'lucide-react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import WideModal from '../components/WideModal';
import StatusBadge from '../components/StatusBadge';
import ExportDropdown from '../components/ExportDropdown';
import { LoanAPI, ClientAPI } from '../api/endpoints';
import { API_BASE_URL } from '../api/client';

const fmt = (n) => new Intl.NumberFormat('fr-FR').format(n || 0);
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';

export default function LoanManagement() {
  const [tab, setTab] = useState('applications'); // applications | loans | products
  const [dashboard, setDashboard] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loans, setLoans] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [appStatus, setAppStatus] = useState('');
  const [loanStatus, setLoanStatus] = useState('');

  const [showNewApp, setShowNewApp] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const [clientResults, setClientResults] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [appForm, setAppForm] = useState({
    loanProductID: '', requestedAmount: '', requestedTermMonths: '', purpose: '',
    guarantorName: '', guarantorPhone: '', guarantorAddress: '', guarantorIDNumber: '',
    guarantorPhotoUrl: '', guarantorSignatureUrl: '', collateralDescription: '',
  });
  const [assessment, setAssessment] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingSignature, setUploadingSignature] = useState(false);
  const [error, setError] = useState('');

  const [approving, setApproving] = useState(null);
  const [approveForm, setApproveForm] = useState({ approvedAmount: '', approvedTermMonths: '' });
  const [disbursing, setDisbursing] = useState(null);
  const [disburseAccount, setDisburseAccount] = useState('');

  const [detail, setDetail] = useState(null);
  const [repayAmount, setRepayAmount] = useState('');

  const [showNewProduct, setShowNewProduct] = useState(false);
  const [productForm, setProductForm] = useState({
    code: '', name: '', interestMethod: 'REDUCING', annualInterestRate: '', minAmount: '', maxAmount: '',
    minTermMonths: '', maxTermMonths: '', penaltyRatePerDay: '0', gracePeriodDays: '0',
  });

  const loadAll = async () => {
    setLoading(true);
    try {
      const [{ data: dash }, { data: apps }, { data: ls }, { data: prods }] = await Promise.all([
        LoanAPI.dashboard(),
        LoanAPI.applications(appStatus ? { status: appStatus } : {}),
        LoanAPI.list(loanStatus ? { status: loanStatus } : {}),
        LoanAPI.products(),
      ]);
      setDashboard(dash); setApplications(apps); setLoans(ls); setProducts(prods);
    } finally { setLoading(false); }
  };

  useEffect(() => { loadAll(); }, []); // eslint-disable-line
  useEffect(() => { LoanAPI.applications(appStatus ? { status: appStatus } : {}).then(({ data }) => setApplications(data)); }, [appStatus]);
  useEffect(() => { LoanAPI.list(loanStatus ? { status: loanStatus } : {}).then(({ data }) => setLoans(data)); }, [loanStatus]);

  const searchClients = async (q) => {
    setClientSearch(q);
    if (q.length < 2) { setClientResults([]); return; }
    const { data } = await ClientAPI.list(q);
    setClientResults(data);
  };

  const openNewApp = () => {
    setSelectedClient(null); setClientSearch(''); setClientResults([]); setAssessment(null);
    setAppForm({
      loanProductID: products[0]?.loanProductID || '', requestedAmount: '', requestedTermMonths: '', purpose: '',
      guarantorName: '', guarantorPhone: '', guarantorAddress: '', guarantorIDNumber: '',
      guarantorPhotoUrl: '', guarantorSignatureUrl: '', collateralDescription: '',
    });
    setError(''); setShowNewApp(true);
  };

  const submitApp = async () => {
    setError('');
    try {
      await LoanAPI.createApplication({
        clientID: selectedClient.clientID,
        loanProductID: Number(appForm.loanProductID),
        requestedAmount: Number(appForm.requestedAmount),
        requestedTermMonths: Number(appForm.requestedTermMonths),
        purpose: appForm.purpose || null,
        guarantorName: appForm.guarantorName || null,
        guarantorPhone: appForm.guarantorPhone || null,
        guarantorAddress: appForm.guarantorAddress || null,
        guarantorIDNumber: appForm.guarantorIDNumber || null,
        guarantorPhotoUrl: appForm.guarantorPhotoUrl || null,
        guarantorSignatureUrl: appForm.guarantorSignatureUrl || null,
        collateralDescription: appForm.collateralDescription || null,
      });
      setShowNewApp(false);
      loadAll();
    } catch (err) {
      setError(err?.response?.data?.message || 'Échec de la soumission.');
    }
  };

  const uploadGuarantorFile = async (file, field, setUploading) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await LoanAPI.uploadGuarantorFile(formData);
      setAppForm((f) => ({ ...f, [field]: data.url }));
    } catch {
      setError("Échec de l'envoi du fichier.");
    } finally {
      setUploading(false);
    }
  };

  const approve = async () => {
    setError('');
    try {
      await LoanAPI.approveApplication(approving.loanApplicationID, {
        approvedAmount: Number(approveForm.approvedAmount), approvedTermMonths: Number(approveForm.approvedTermMonths),
      });
      setApproving(null);
      loadAll();
    } catch (err) { setError(err?.response?.data?.message || 'Échec.'); }
  };

  const reject = async (row) => {
    const reason = window.prompt('Motif du rejet ?');
    if (!reason) return;
    await LoanAPI.rejectApplication(row.loanApplicationID, reason);
    loadAll();
  };

  const disburse = async () => {
    setError('');
    try {
      await LoanAPI.disburse(disbursing.loanApplicationID, { disbursedToAccountID: disburseAccount || null });
      setDisbursing(null);
      loadAll();
    } catch (err) { setError(err?.response?.data?.message || 'Échec du décaissement.'); }
  };

  const openDetail = async (row) => {
    const { data } = await LoanAPI.detail(row.loanID);
    setDetail(data);
    setRepayAmount('');
  };

  const repay = async () => {
    if (!repayAmount) return;
    await LoanAPI.repay(detail.loanID, Number(repayAmount));
    const { data } = await LoanAPI.detail(detail.loanID);
    setDetail(data);
    setRepayAmount('');
    loadAll();
  };

  const createProduct = async () => {
    await LoanAPI.createProduct({
      code: productForm.code, name: productForm.name, interestMethod: productForm.interestMethod,
      annualInterestRate: Number(productForm.annualInterestRate), minAmount: Number(productForm.minAmount),
      maxAmount: Number(productForm.maxAmount), minTermMonths: Number(productForm.minTermMonths),
      maxTermMonths: Number(productForm.maxTermMonths), penaltyRatePerDay: Number(productForm.penaltyRatePerDay),
      gracePeriodDays: Number(productForm.gracePeriodDays),
    });
    setShowNewProduct(false);
    loadAll();
  };

  const appColumns = [
    { key: 'clientName', label: 'Client' },
    { key: 'productName', label: 'Produit' },
    { key: 'requestedAmount', label: 'Montant demandé', render: (r) => fmt(r.requestedAmount) },
    { key: 'requestedTermMonths', label: 'Durée (mois)' },
    { key: 'approvedAmount', label: 'Montant approuvé', render: (r) => r.approvedAmount != null ? fmt(r.approvedAmount) : '—' },
    { key: 'status', label: 'Statut', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'requestDate', label: 'Demandé le', render: (r) => fmtDate(r.requestDate) },
    {
      key: 'actions', label: 'Actions', sortable: false, render: (r) => (
        <div className="flex items-center gap-1">
          {r.status === 'PENDING' && (
            <>
              <button className="btn btn-primary btn-sm" onClick={() => { setApproving(r); setApproveForm({ approvedAmount: r.requestedAmount, approvedTermMonths: r.requestedTermMonths }); setError(''); }}><Check size={13} /></button>
              <button className="btn btn-danger btn-sm" onClick={() => reject(r)}><X size={13} /></button>
            </>
          )}
          {r.status === 'APPROVED' && (
            <button className="btn btn-primary btn-sm" onClick={() => { setDisbursing(r); setDisburseAccount(''); setError(''); }}><Banknote size={13} /> Décaisser</button>
          )}
        </div>
      )
    },
  ];

  const loanColumns = [
    { key: 'loanNumber', label: 'N° Prêt' },
    { key: 'clientName', label: 'Client' },
    { key: 'productName', label: 'Produit' },
    { key: 'principalAmount', label: 'Principal', render: (r) => fmt(r.principalAmount) },
    { key: 'outstandingPrincipal', label: 'Solde restant', render: (r) => fmt(r.outstandingPrincipal + r.outstandingInterest + r.outstandingPenalty) },
    { key: 'nextDueDate', label: 'Prochaine échéance', render: (r) => fmtDate(r.nextDueDate) },
    { key: 'overdueInstallments', label: 'En retard', render: (r) => r.overdueInstallments > 0 ? <span className="badge badge-danger">{r.overdueInstallments}</span> : '0' },
    { key: 'status', label: 'Statut', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'actions', label: 'Actions', sortable: false, render: (r) => <button className="btn-icon" onClick={() => openDetail(r)}><Eye size={15} /></button> },
  ];

  const productColumns = [
    { key: 'code', label: 'Code' }, { key: 'name', label: 'Nom' },
    { key: 'interestMethod', label: 'Méthode' },
    { key: 'annualInterestRate', label: 'Taux annuel', render: (r) => `${r.annualInterestRate}%` },
    { key: 'minAmount', label: 'Min', render: (r) => fmt(r.minAmount) },
    { key: 'maxAmount', label: 'Max', render: (r) => fmt(r.maxAmount) },
    { key: 'minTermMonths', label: 'Durée min-max', render: (r) => `${r.minTermMonths}-${r.maxTermMonths} mois` },
    { key: 'penaltyRatePerDay', label: 'Pénalité/jour', render: (r) => `${r.penaltyRatePerDay}%` },
    { key: 'statut', label: 'Statut', render: (r) => <StatusBadge status={r.statut} /> },
  ];

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <div className="panel-title">Loan Management</div>
          <div className="panel-subtitle">Demandes, décaissement, échéancier et remboursement des prêts.</div>
        </div>
      </div>

      {dashboard && (
        <div className="kpi-grid mb-4">
          <div className="kpi-card"><div className="kpi-label">Total prêts</div><div className="kpi-value">{dashboard.totalLoans}</div></div>
          <div className="kpi-card"><div className="kpi-label">Actifs</div><div className="kpi-value text-emerald-600">{dashboard.activeLoans}</div></div>
          <div className="kpi-card"><div className="kpi-label">Soldés</div><div className="kpi-value">{dashboard.closedLoans}</div></div>
          <div className="kpi-card"><div className="kpi-label">En retard</div><div className="kpi-value text-red-600">{dashboard.overdueLoans}</div></div>
          <div className="kpi-card"><div className="kpi-label">Décaissé total</div><div className="kpi-value">{fmt(dashboard.totalDisbursed)}</div></div>
          <div className="kpi-card"><div className="kpi-label">Encours principal</div><div className="kpi-value accent">{fmt(dashboard.totalOutstandingPrincipal)}</div></div>
          <div className="kpi-card"><div className="kpi-label">Décaissé ce mois</div><div className="kpi-value">{fmt(dashboard.disbursedThisMonth)}</div></div>
          <div className="kpi-card"><div className="kpi-label">Demandes en attente</div><div className="kpi-value">{dashboard.pendingApplications}</div></div>
        </div>
      )}

      <div className="toggle-group mb-3">
        <button className={`toggle-btn${tab === 'applications' ? ' active' : ''}`} onClick={() => setTab('applications')}>Demandes</button>
        <button className={`toggle-btn${tab === 'loans' ? ' active' : ''}`} onClick={() => setTab('loans')}>Prêts actifs</button>
        <button className={`toggle-btn${tab === 'products' ? ' active' : ''}`} onClick={() => setTab('products')}>Produits</button>
      </div>

      {tab === 'applications' && (
        <>
          <div className="toolbar flex-wrap gap-2">
            <select value={appStatus} onChange={(e) => setAppStatus(e.target.value)}>
              <option value="">Tous les statuts</option>
              <option value="PENDING">En attente</option>
              <option value="APPROVED">Approuvée</option>
              <option value="REJECTED">Rejetée</option>
              <option value="DISBURSED">Décaissée</option>
            </select>
            <button className="btn btn-primary" onClick={openNewApp}>+ Nouvelle demande</button>
            <ExportDropdown filename="LOAN_APPLICATIONS" columns={appColumns.filter((c) => c.key !== 'actions')} rows={applications} />
          </div>
          <DataTable columns={appColumns} rows={applications} loading={loading} totalLabel={`TOTAL: ${applications.length}`} />
        </>
      )}

      {tab === 'loans' && (
        <>
          <div className="toolbar flex-wrap gap-2">
            <select value={loanStatus} onChange={(e) => setLoanStatus(e.target.value)}>
              <option value="">Tous les statuts</option>
              <option value="ACTIVE">Actif</option>
              <option value="CLOSED">Soldé</option>
              <option value="WRITTEN_OFF">Passé en perte</option>
            </select>
            <ExportDropdown filename="LOANS" columns={loanColumns.filter((c) => c.key !== 'actions')} rows={loans} />
          </div>
          <DataTable columns={loanColumns} rows={loans} loading={loading} totalLabel={`TOTAL: ${loans.length}`} />
        </>
      )}

      {tab === 'products' && (
        <>
          <div className="toolbar">
            <button className="btn btn-primary" onClick={() => setShowNewProduct(true)}>+ Nouveau produit</button>
          </div>
          <DataTable columns={productColumns} rows={products} loading={loading} totalLabel={`TOTAL: ${products.length}`} />
        </>
      )}

      {/* New Application */}
      {showNewApp && (
        <WideModal title="Nouvelle demande de prêt" onClose={() => setShowNewApp(false)}>
          {error && <div className="error-banner mb-3">{error}</div>}
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
                  <li key={c.clientID} className="px-2.5 py-1.5 cursor-pointer hover:bg-gray-50" onClick={async () => { setSelectedClient(c); setClientResults([]); const { data } = await LoanAPI.clientAssessment(c.clientID); setAssessment(data); }}>
                    {c.clientID} — {c.nom} {c.prenom}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
            <div className="form-group">
              <label>Produit de prêt *</label>
              <select value={appForm.loanProductID} onChange={(e) => setAppForm({ ...appForm, loanProductID: e.target.value })}>
                {products.map((p) => <option key={p.loanProductID} value={p.loanProductID}>{p.name} ({p.annualInterestRate}%)</option>)}
              </select>
            </div>
            <div className="form-group"><label>Montant demandé *</label><input type="number" value={appForm.requestedAmount} onChange={(e) => setAppForm({ ...appForm, requestedAmount: e.target.value })} /></div>
            <div className="form-group"><label>Durée (mois) *</label><input type="number" value={appForm.requestedTermMonths} onChange={(e) => setAppForm({ ...appForm, requestedTermMonths: e.target.value })} /></div>
          </div>
          <div className="form-group mt-3"><label>Objet du prêt</label><textarea value={appForm.purpose} onChange={(e) => setAppForm({ ...appForm, purpose: e.target.value })} /></div>

          {assessment && (
            <div className="form-card mt-3">
              <div className="flex items-center justify-between">
                <div className="form-card-title">Évaluation du client (depuis son entrée)</div>
                <span className={`badge ${assessment.assessmentVerdict === 'Bon profil' ? 'badge-success' : assessment.assessmentVerdict.includes('examiner') ? 'badge-danger' : 'badge-warning'}`}>{assessment.assessmentVerdict}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs mt-2">
                <div>Client depuis: <strong>{assessment.daysAsClient} j</strong></div>
                <div>Collectes: <strong>{assessment.totalTransactionCount}</strong></div>
                <div>Total collecté: <strong>{fmt(assessment.totalCollected)}</strong></div>
                <div>Moyenne/mois: <strong>{fmt(assessment.averageMonthlyCollection)}</strong></div>
                <div>Prêts antérieurs: <strong>{assessment.priorLoanCount}</strong></div>
                <div>Soldés normalement: <strong>{assessment.priorLoansCompletedOk}</strong></div>
                <div>Passés en perte: <strong>{assessment.priorLoansWrittenOff}</strong></div>
                <div>Échéances en retard: <strong>{assessment.priorLoansOverdueInstallments}</strong></div>
              </div>
              <ul className="text-[11px] text-gray-500 normal-case mt-2 list-disc list-inside">
                {assessment.assessmentNotes.map((n, i) => <li key={i}>{n}</li>)}
              </ul>
            </div>
          )}

          <div className="form-card mt-3">
            <div className="form-card-title">Garant</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
              <div className="form-group"><label>Nom complet du garant</label><input value={appForm.guarantorName} onChange={(e) => setAppForm({ ...appForm, guarantorName: e.target.value })} /></div>
              <div className="form-group"><label>Téléphone du garant</label><input value={appForm.guarantorPhone} onChange={(e) => setAppForm({ ...appForm, guarantorPhone: e.target.value })} /></div>
              <div className="form-group"><label>Adresse du garant</label><input value={appForm.guarantorAddress} onChange={(e) => setAppForm({ ...appForm, guarantorAddress: e.target.value })} /></div>
              <div className="form-group"><label>N° CNI du garant</label><input value={appForm.guarantorIDNumber} onChange={(e) => setAppForm({ ...appForm, guarantorIDNumber: e.target.value })} /></div>
              <div className="form-group">
                <label>Photo du garant</label>
                <input type="file" accept="image/*" disabled={uploadingPhoto} onChange={(e) => e.target.files[0] && uploadGuarantorFile(e.target.files[0], 'guarantorPhotoUrl', setUploadingPhoto)} />
                {appForm.guarantorPhotoUrl && <img src={`${API_BASE_URL}${appForm.guarantorPhotoUrl}`} alt="garant" className="h-12 w-12 object-cover rounded mt-1 border" />}
              </div>
              <div className="form-group">
                <label>Signature du garant</label>
                <input type="file" accept="image/*" disabled={uploadingSignature} onChange={(e) => e.target.files[0] && uploadGuarantorFile(e.target.files[0], 'guarantorSignatureUrl', setUploadingSignature)} />
                {appForm.guarantorSignatureUrl && <img src={`${API_BASE_URL}${appForm.guarantorSignatureUrl}`} alt="signature" className="h-12 w-12 object-cover rounded mt-1 border" />}
              </div>
            </div>
            <div className="form-group mt-2"><label>Garantie / Collatéral (description)</label><input value={appForm.collateralDescription} onChange={(e) => setAppForm({ ...appForm, collateralDescription: e.target.value })} /></div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button className="btn btn-outline" onClick={() => setShowNewApp(false)}>Annuler</button>
            <button className="btn btn-primary" disabled={!selectedClient || !appForm.requestedAmount || !appForm.requestedTermMonths} onClick={submitApp}>Soumettre</button>
          </div>
        </WideModal>
      )}

      {/* Approve */}
      {approving && (
        <Modal title={`Approuver la demande — ${approving.clientName}`} onClose={() => setApproving(null)} footer={
          <>
            <button className="btn btn-outline" onClick={() => setApproving(null)}>Annuler</button>
            <button className="btn btn-primary" onClick={approve}>Approuver</button>
          </>
        }>
          {error && <div className="error-banner mb-2">{error}</div>}
          <div className="form-group"><label>Montant approuvé</label><input type="number" value={approveForm.approvedAmount} onChange={(e) => setApproveForm({ ...approveForm, approvedAmount: e.target.value })} /></div>
          <div className="form-group"><label>Durée approuvée (mois)</label><input type="number" value={approveForm.approvedTermMonths} onChange={(e) => setApproveForm({ ...approveForm, approvedTermMonths: e.target.value })} /></div>
        </Modal>
      )}

      {/* Disburse */}
      {disbursing && (
        <Modal title={`Décaisser le prêt — ${disbursing.clientName}`} onClose={() => setDisbursing(null)} footer={
          <>
            <button className="btn btn-outline" onClick={() => setDisbursing(null)}>Annuler</button>
            <button className="btn btn-primary" onClick={disburse}>Décaisser</button>
          </>
        }>
          {error && <div className="error-banner mb-2">{error}</div>}
          <p className="text-xs text-gray-600 normal-case mb-2">Montant: <strong>{fmt(disbursing.approvedAmount)}</strong> sur {disbursing.approvedTermMonths} mois. L'échéancier sera généré automatiquement.</p>
          <div className="form-group"><label>Compte à créditer (optionnel)</label><input value={disburseAccount} onChange={(e) => setDisburseAccount(e.target.value)} placeholder="ex: CC-000001" /></div>
        </Modal>
      )}

      {/* Loan Detail + repayment + schedule */}
      {detail && (
        <WideModal title={`Prêt ${detail.loanNumber} — ${detail.clientName}`} onClose={() => setDetail(null)}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div className="form-card">
              <div className="form-card-title">Informations</div>
              <p className="text-xs normal-case space-y-1">
                <div>Produit: {detail.productName} ({detail.annualInterestRate}% — {detail.interestMethod})</div>
                <div>Principal: {fmt(detail.principalAmount)} sur {detail.termMonths} mois</div>
                <div>Décaissé le: {fmtDate(detail.disbursementDate)}</div>
                <div>Statut: <StatusBadge status={detail.status} /></div>
              </p>
            </div>
            <div className="form-card">
              <div className="form-card-title">Encours</div>
              <p className="text-xs normal-case space-y-1">
                <div>Principal restant: {fmt(detail.outstandingPrincipal)}</div>
                <div>Intérêt restant: {fmt(detail.outstandingInterest)}</div>
                <div>Pénalités: {fmt(detail.outstandingPenalty)}</div>
                <div className="font-semibold">Total dû: {fmt(detail.outstandingPrincipal + detail.outstandingInterest + detail.outstandingPenalty)}</div>
                <div>Prochaine échéance: {fmtDate(detail.nextDueDate)}</div>
              </p>
            </div>
            {detail.status === 'ACTIVE' && (
              <div className="form-card">
                <div className="form-card-title">Enregistrer un remboursement</div>
                <div className="form-group"><label>Montant</label><input type="number" value={repayAmount} onChange={(e) => setRepayAmount(e.target.value)} /></div>
                <button className="btn btn-primary btn-sm mt-2" onClick={repay} disabled={!repayAmount}>Enregistrer</button>
              </div>
            )}
          </div>

          <div className="form-card">
            <div className="form-card-title">Échéancier</div>
            <table className="w-full text-xs mt-2">
              <thead><tr className="text-left text-gray-400"><th>#</th><th>Échéance</th><th>Principal</th><th>Intérêt</th><th>Pénalité</th><th>Total dû</th><th>Payé</th><th>Statut</th></tr></thead>
              <tbody>
                {detail.installments.map((i) => (
                  <tr key={i.loanInstallmentID}>
                    <td>{i.installmentNumber}</td><td>{fmtDate(i.dueDate)}</td>
                    <td>{fmt(i.principalDue)}</td><td>{fmt(i.interestDue)}</td><td>{fmt(i.penaltyDue)}</td>
                    <td>{fmt(i.totalDue)}</td><td>{fmt(i.totalPaid)}</td>
                    <td><StatusBadge status={i.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {detail.repayments.length > 0 && (
            <div className="form-card mt-3">
              <div className="form-card-title">Historique des remboursements</div>
              <table className="w-full text-xs mt-2">
                <thead><tr className="text-left text-gray-400"><th>Reçu</th><th>Montant</th><th>Date</th><th>Reçu par</th></tr></thead>
                <tbody>
                  {detail.repayments.map((r) => (
                    <tr key={r.loanRepaymentID}><td>{r.receiptNumber}</td><td>{fmt(r.amount)}</td><td>{fmtDate(r.paymentDate)}</td><td>{r.receivedBy}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </WideModal>
      )}

      {/* New Product */}
      {showNewProduct && (
        <Modal title="Nouveau produit de prêt" onClose={() => setShowNewProduct(false)} footer={
          <>
            <button className="btn btn-outline" onClick={() => setShowNewProduct(false)}>Annuler</button>
            <button className="btn btn-primary" onClick={createProduct}>Créer</button>
          </>
        }>
          <div className="grid grid-cols-2 gap-2">
            <div className="form-group"><label>Code</label><input value={productForm.code} onChange={(e) => setProductForm({ ...productForm, code: e.target.value })} /></div>
            <div className="form-group"><label>Nom</label><input value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} /></div>
            <div className="form-group">
              <label>Méthode</label>
              <select value={productForm.interestMethod} onChange={(e) => setProductForm({ ...productForm, interestMethod: e.target.value })}>
                <option value="REDUCING">Dégressif (Reducing Balance)</option>
                <option value="FLAT">Fixe (Flat)</option>
              </select>
            </div>
            <div className="form-group"><label>Taux annuel (%)</label><input type="number" value={productForm.annualInterestRate} onChange={(e) => setProductForm({ ...productForm, annualInterestRate: e.target.value })} /></div>
            <div className="form-group"><label>Montant min</label><input type="number" value={productForm.minAmount} onChange={(e) => setProductForm({ ...productForm, minAmount: e.target.value })} /></div>
            <div className="form-group"><label>Montant max</label><input type="number" value={productForm.maxAmount} onChange={(e) => setProductForm({ ...productForm, maxAmount: e.target.value })} /></div>
            <div className="form-group"><label>Durée min (mois)</label><input type="number" value={productForm.minTermMonths} onChange={(e) => setProductForm({ ...productForm, minTermMonths: e.target.value })} /></div>
            <div className="form-group"><label>Durée max (mois)</label><input type="number" value={productForm.maxTermMonths} onChange={(e) => setProductForm({ ...productForm, maxTermMonths: e.target.value })} /></div>
            <div className="form-group"><label>Pénalité/jour (%)</label><input type="number" value={productForm.penaltyRatePerDay} onChange={(e) => setProductForm({ ...productForm, penaltyRatePerDay: e.target.value })} /></div>
            <div className="form-group"><label>Délai de grâce (jours)</label><input type="number" value={productForm.gracePeriodDays} onChange={(e) => setProductForm({ ...productForm, gracePeriodDays: e.target.value })} /></div>
          </div>
        </Modal>
      )}
    </div>
  );
}
