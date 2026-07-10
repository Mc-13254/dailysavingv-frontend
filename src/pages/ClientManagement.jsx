import { useEffect, useState } from 'react';
import { Pencil, Trash2, Eye, Upload } from 'lucide-react';
import DataTable from '../components/DataTable';
import WideModal from '../components/WideModal';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import ExportDropdown from '../components/ExportDropdown';
import SearchableSelect from '../components/SearchableSelect';
import CompletenessBar from '../components/CompletenessBar';
import WizardStepper from '../components/WizardStepper';
import { ClientAPI, CollectorAPI, GeoAPI } from '../api/endpoints';
import { API_BASE_URL } from '../api/client';
import PlaceSearchInput from '../components/PlaceSearchInput';

// Uploaded documents are stored on the backend (wwwroot/uploads/...) and the
// API returns a relative path. Since the frontend and backend are on
// different origins, that relative path must be resolved against the API's
// base URL, or the browser resolves it against the frontend's own origin
// (where it obviously doesn't exist) and the image silently fails to load.
const fileUrl = (path) => (path && path.startsWith('/') ? `${API_BASE_URL}${path}` : path);

const STEPS = [
  'Personal', 'Contact', 'Identification', 'Documents', 'Business',
  'Banking', 'Emergency', 'Guarantor', 'Risk', 'Review',
];

const emptyForm = {
  nom: '', prenom: '', middleName: '', sexe: '', dateOfBirth: '', placeOfBirth: '', nationality: '',
  maritalStatus: '', profession: '', occupation: '', employer: '', educationLevel: '', monthlyIncome: '',
  phoneNumber: '', secondaryPhone: '', whatsApp: '', email: '', country: '', city: '', district: '',
  neighborhood: '', street: '', houseNumber: '', postalCode: '', latitude: '', longitude: '', address: '',
  typeCNIID: null, numeroCNI: '', nationalIDIssueDate: '', nationalIDExpiryDate: '', passportNumber: '',
  driverLicenseNumber: '', taxIdentificationNumber: '', socialSecurityNumber: '', documentType: '', issuedBy: '',
  image: '', nationalIDFrontUrl: '', nationalIDBackUrl: '', passportUrl: '', proofOfAddressUrl: '', signatureUrl: '',
  companyName: '', businessName: '', businessAddress: '', businessType: '', yearsInBusiness: '',
  monthlyRevenue: '', monthlyExpenses: '',
  clientType: 'INDIVIDUAL', clientCategory: 'INDIVIDUAL', collectorID: '', accountOfficer: '',
  emergencyContactName: '', emergencyContactRelationship: '', emergencyContactPhone: '', emergencyContactAddress: '',
  guarantorName: '', guarantorRelationship: '', guarantorPhone: '', guarantorOccupation: '', guarantorEmployer: '', guarantorAddress: '',
  riskLevel: 'LOW', isPoliticallyExposed: false, isBlacklisted: false, amlStatus: 'PENDING',
};

// Live (client-side) mirror of the backend's 20-point completeness score, so
// the wizard shows a running score as the admin fills the form.
function estimateCompleteness(f) {
  const checks = [
    !!f.nom, !!f.prenom, !!f.dateOfBirth, !!f.nationality, !!f.phoneNumber, !!f.email,
    !!f.address || !!f.city, !!f.numeroCNI, !!f.nationalIDExpiryDate, !!f.image,
    !!f.nationalIDFrontUrl, !!f.nationalIDBackUrl, !!f.signatureUrl, !!f.proofOfAddressUrl,
    !!f.profession || !!f.occupation, !!f.monthlyIncome, !!f.collectorID,
    !!f.emergencyContactName && !!f.emergencyContactPhone,
    !!f.guarantorName && !!f.guarantorPhone,
    !!f.amlStatus && f.amlStatus !== 'PENDING',
  ];
  const percent = Math.round((checks.filter(Boolean).length / checks.length) * 100);
  const label = percent >= 90 ? 'Excellent' : percent >= 70 ? 'Bon' : percent >= 50 ? 'Moyen' : 'Incomplet';
  return { percent, label };
}

function toRequestPayload(f) {
  return {
    ...f,
    dateOfBirth: f.dateOfBirth || null,
    nationalIDIssueDate: f.nationalIDIssueDate || null,
    nationalIDExpiryDate: f.nationalIDExpiryDate || null,
    monthlyIncome: f.monthlyIncome ? Number(f.monthlyIncome) : null,
    monthlyRevenue: f.monthlyRevenue ? Number(f.monthlyRevenue) : null,
    monthlyExpenses: f.monthlyExpenses ? Number(f.monthlyExpenses) : null,
    yearsInBusiness: f.yearsInBusiness ? Number(f.yearsInBusiness) : null,
    latitude: f.latitude ? Number(f.latitude) : null,
    longitude: f.longitude ? Number(f.longitude) : null,
    typeCNIID: f.typeCNIID ? Number(f.typeCNIID) : null,
  };
}

function Field({ label, children }) {
  return <div className="form-group">{label && <label>{label}</label>}{children}</div>;
}

function UploadField({ label, value, onChange }) {
  const [uploading, setUploading] = useState(false);
  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { data } = await ClientAPI.upload(file);
      onChange(data.url);
    } finally { setUploading(false); }
  };
  return (
    <Field label={label}>
      <div className="flex items-center gap-2">
        <label className="btn btn-outline btn-sm cursor-pointer">
          <Upload size={13} /> {uploading ? 'Envoi…' : value ? 'Remplacer' : 'Téléverser'}
          <input type="file" accept="image/*,.pdf" hidden onChange={handleFile} />
        </label>
        {value && <img src={fileUrl(value)} alt={label} className="h-10 w-10 object-cover rounded border" onError={(e) => (e.target.style.display = 'none')} />}
        {value && <span className="text-[11px] text-emerald-600">✓ chargé</span>}
      </div>
    </Field>
  );
}

export default function ClientManagement() {
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState([]);
  const [collectors, setCollectors] = useState([]);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showWizard, setShowWizard] = useState(false);
  const [step, setStep] = useState(0);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const [viewing, setViewing] = useState(null);

  const loadAll = async () => {
    setLoading(true);
    try {
      const { data } = await ClientAPI.list(search);
      setRows(data);
    } finally { setLoading(false); }
  };

  useEffect(() => { loadAll(); }, [search]);
  useEffect(() => { CollectorAPI.list().then(({ data }) => setCollectors(data)).catch(() => {}); }, []);
  useEffect(() => { GeoAPI.countries().then(({ data }) => setCountries(data)).catch(() => setCountries([])); }, []);

  const countryOptions = countries.map((c) => ({ value: c.nom, label: c.nom }));

  const collectorOptions = collectors.map((c) => ({ value: c.collectorID, label: `${c.collectorID} — ${c.name} ${c.surname || ''}` }));
  const completeness = estimateCompleteness(form);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setStep(0); setError(''); setShowWizard(true); };
  const openEdit = async (row) => {
    const { data } = await ClientAPI.get(row.clientID);
    setEditing(row);
    setForm({
      ...emptyForm,
      ...data,
      dateOfBirth: data.dateOfBirth?.slice(0, 10) || '',
      nationalIDIssueDate: data.nationalIDIssueDate?.slice(0, 10) || '',
      nationalIDExpiryDate: data.nationalIDExpiryDate?.slice(0, 10) || '',
    });
    setStep(0);
    setError('');
    setShowWizard(true);
  };

  const openView = async (row) => {
    const { data } = await ClientAPI.get(row.clientID);
    setViewing(data);
  };

  const set = (field) => (e) => setForm({ ...form, [field]: e?.target ? e.target.value : e });
  const setChk = (field) => (e) => setForm({ ...form, [field]: e.target.checked });

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const payload = toRequestPayload(form);
      if (editing) {
        await ClientAPI.update(editing.clientID, payload);
        setNotice('Modification soumise pour validation (voir module Validation des opérations).');
      } else {
        await ClientAPI.create(payload);
        setNotice('Client soumis pour validation (voir module Validation des opérations).');
      }
      setShowWizard(false);
      loadAll();
    } catch (e) {
      setError(e?.response?.data?.message || 'Échec de la soumission.');
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Bloquer le client ${row.clientID} ? (soumis pour validation)`)) return;
    try {
      await ClientAPI.remove(row.clientID);
      setNotice('Suppression soumise pour validation.');
      loadAll();
    } catch (e) {
      setNotice(e?.response?.data?.message || 'Échec.');
    }
  };

  const validatedColumns = [
    { key: 'clientID', label: 'Code' },
    { key: 'nom', label: 'Nom', render: (r) => `${r.nom} ${r.prenom || ''}` },
    { key: 'phoneNumber', label: 'Téléphone' },
    { key: 'email', label: 'Email' },
    { key: 'clientType', label: 'Type' },
    {
      key: 'completenessPercent', label: 'Dossier', render: (r) => (
        <span className={`badge ${r.completenessPercent >= 90 ? 'badge-success' : r.completenessPercent >= 50 ? 'badge-warning' : 'badge-danger'}`}>
          {r.completenessPercent}%
        </span>
      )
    },
    { key: 'validationStatus', label: 'Statut', render: (r) => <StatusBadge status={r.validationStatus} /> },
    {
      key: 'actions', label: 'Actions', sortable: false, render: (r) => (
        <div className="flex items-center gap-2">
          <button className="btn-icon" title="Voir" onClick={() => openView(r)}><Eye size={15} /></button>
          <button className="btn-icon" title="Modifier" onClick={() => openEdit(r)}><Pencil size={15} /></button>
          <button className="btn-icon text-red-500" title="Supprimer" onClick={() => handleDelete(r)}><Trash2 size={15} /></button>
        </div>
      )
    },
  ];

  return (
    <div className="panel">
      <div className="panel-header">
        <div className="panel-title">Client Management</div>
        <button className="btn btn-primary" onClick={openCreate}>+ Create Client</button>
      </div>

      {notice && <div className="mb-3 text-xs text-green-700 bg-green-50 px-3 py-2 rounded normal-case">{notice}</div>}

      <div className="toolbar">
        <input className="search-input" placeholder="Code, nom, téléphone, CNI…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <ExportDropdown filename="CLIENTS" columns={validatedColumns.filter((c) => c.key !== 'actions')} rows={rows} />
      </div>

      <DataTable columns={validatedColumns} rows={rows} loading={loading} totalLabel={`TOTAL CLIENTS: ${rows.length}`} />

      {showWizard && (
        <WideModal
          title={editing ? `Modifier ${editing.clientID}` : 'Create Client — Customer Onboarding'}
          onClose={() => setShowWizard(false)}
          footer={
            <>
              <CompletenessBar percent={completeness.percent} label={completeness.label} />
              <div className="flex-1" />
              {step > 0 && <button className="btn btn-outline" onClick={() => setStep((s) => s - 1)}>Précédent</button>}
              {step < STEPS.length - 1 && <button className="btn btn-primary" onClick={() => setStep((s) => s + 1)}>Suivant</button>}
              {step === STEPS.length - 1 && (
                <button className="btn btn-primary" disabled={submitting} onClick={handleSubmit}>
                  {submitting ? 'Envoi…' : 'Soumettre pour validation'}
                </button>
              )}
            </>
          }
        >
          <WizardStepper steps={STEPS} current={step} onJump={setStep} />
          {error && <div className="error-banner">{error}</div>}

          {step === 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field label="Nom *"><input required value={form.nom} onChange={set('nom')} /></Field>
              <Field label="Nom du milieu"><input value={form.middleName} onChange={set('middleName')} /></Field>
              <Field label="Prénom *"><input value={form.prenom} onChange={set('prenom')} /></Field>
              <Field label="Genre">
                <select value={form.sexe} onChange={set('sexe')}><option value="">—</option><option value="M">Masculin</option><option value="F">Féminin</option></select>
              </Field>
              <Field label="Date de naissance"><input type="date" value={form.dateOfBirth?.slice(0, 10) || ''} onChange={set('dateOfBirth')} /></Field>
              <Field label="Lieu de naissance"><input value={form.placeOfBirth} onChange={set('placeOfBirth')} /></Field>
              <Field label="Nationalité">
                <SearchableSelect options={countryOptions} value={form.nationality} onChange={(v) => setForm({ ...form, nationality: v })} placeholder="Choisir un pays…" />
              </Field>
              <Field label="Statut marital">
                <select value={form.maritalStatus} onChange={set('maritalStatus')}>
                  <option value="">—</option><option>Célibataire</option><option>Marié(e)</option><option>Divorcé(e)</option><option>Veuf/Veuve</option>
                </select>
              </Field>
              <Field label="Profession">
                <select value={form.profession} onChange={set('profession')}>
                  <option value="">— Choisir —</option>
                  {['Agriculteur/Éleveur', 'Commerçant', 'Artisan', 'Enseignant', 'Fonctionnaire', 'Transporteur/Chauffeur', 'Employé du privé', 'Entrepreneur', 'Étudiant', 'Sans emploi', 'Retraité', 'Autre'].map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </Field>
              <Field label="Occupation"><input value={form.occupation} onChange={set('occupation')} /></Field>
              <Field label="Employeur"><input value={form.employer} onChange={set('employer')} /></Field>
              <Field label="Niveau d'éducation">
                <select value={form.educationLevel} onChange={set('educationLevel')}>
                  <option value="">—</option><option>Primaire</option><option>Secondaire</option><option>Universitaire</option><option>Aucun</option>
                </select>
              </Field>
              <Field label="Revenu mensuel"><input type="number" value={form.monthlyIncome} onChange={set('monthlyIncome')} /></Field>
            </div>
          )}

          {step === 1 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field label="Téléphone principal *"><input required value={form.phoneNumber} onChange={set('phoneNumber')} /></Field>
              <Field label="Téléphone secondaire"><input value={form.secondaryPhone} onChange={set('secondaryPhone')} /></Field>
              <Field label="WhatsApp"><input value={form.whatsApp} onChange={set('whatsApp')} /></Field>
              <Field label="Email"><input type="email" value={form.email} onChange={set('email')} /></Field>

              <div className="form-group sm:col-span-3">
                <label>Rechercher une adresse (n'importe où dans le monde) — remplit automatiquement les champs ci-dessous</label>
                <PlaceSearchInput onSelect={(place) => setForm({ ...form, ...place })} />
              </div>

              <Field label="Pays">
                <SearchableSelect options={countryOptions} value={form.country} onChange={(v) => setForm({ ...form, country: v })} placeholder="Choisir un pays…" />
              </Field>
              <Field label="Ville"><input value={form.city} onChange={set('city')} /></Field>
              <Field label="Quartier"><input value={form.district} onChange={set('district')} /></Field>
              <Field label="Voisinage"><input value={form.neighborhood} onChange={set('neighborhood')} /></Field>
              <Field label="Rue"><input value={form.street} onChange={set('street')} /></Field>
              <Field label="N° de maison"><input value={form.houseNumber} onChange={set('houseNumber')} /></Field>
              <Field label="Code postal"><input value={form.postalCode} onChange={set('postalCode')} /></Field>
              <Field label="Adresse complète"><input value={form.address} onChange={set('address')} /></Field>
              <Field label="Latitude"><input type="number" step="any" value={form.latitude} onChange={set('latitude')} /></Field>
              <Field label="Longitude"><input type="number" step="any" value={form.longitude} onChange={set('longitude')} /></Field>
            </div>
          )}

          {step === 2 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field label="N° CNI *"><input required value={form.numeroCNI} onChange={set('numeroCNI')} /></Field>
              <Field label="Date de délivrance CNI"><input type="date" value={form.nationalIDIssueDate?.slice(0, 10) || ''} onChange={set('nationalIDIssueDate')} /></Field>
              <Field label="Date d'expiration CNI"><input type="date" value={form.nationalIDExpiryDate?.slice(0, 10) || ''} onChange={set('nationalIDExpiryDate')} /></Field>
              <Field label="N° Passeport"><input value={form.passportNumber} onChange={set('passportNumber')} /></Field>
              <Field label="N° Permis de conduire"><input value={form.driverLicenseNumber} onChange={set('driverLicenseNumber')} /></Field>
              <Field label="N° Identification fiscale"><input value={form.taxIdentificationNumber} onChange={set('taxIdentificationNumber')} /></Field>
              <Field label="N° Sécurité sociale"><input value={form.socialSecurityNumber} onChange={set('socialSecurityNumber')} /></Field>
              <Field label="Type de document">
                <select value={form.documentType} onChange={set('documentType')}>
                  <option value="">—</option><option>CNI</option><option>Passeport</option><option>Permis</option>
                </select>
              </Field>
              <Field label="Délivré par"><input value={form.issuedBy} onChange={set('issuedBy')} /></Field>
            </div>
          )}

          {step === 3 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <UploadField label="Photo de profil" value={form.image} onChange={set('image')} />
              <UploadField label="CNI (recto)" value={form.nationalIDFrontUrl} onChange={set('nationalIDFrontUrl')} />
              <UploadField label="CNI (verso)" value={form.nationalIDBackUrl} onChange={set('nationalIDBackUrl')} />
              <UploadField label="Passeport" value={form.passportUrl} onChange={set('passportUrl')} />
              <UploadField label="Justificatif de domicile" value={form.proofOfAddressUrl} onChange={set('proofOfAddressUrl')} />
              <UploadField label="Signature" value={form.signatureUrl} onChange={set('signatureUrl')} />
            </div>
          )}

          {step === 4 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field label="Raison sociale"><input value={form.companyName} onChange={set('companyName')} /></Field>
              <Field label="Nom de l'entreprise"><input value={form.businessName} onChange={set('businessName')} /></Field>
              <Field label="Adresse de l'entreprise"><input value={form.businessAddress} onChange={set('businessAddress')} /></Field>
              <Field label="Type d'activité"><input value={form.businessType} onChange={set('businessType')} /></Field>
              <Field label="Années d'activité"><input type="number" value={form.yearsInBusiness} onChange={set('yearsInBusiness')} /></Field>
              <Field label="Revenu mensuel"><input type="number" value={form.monthlyRevenue} onChange={set('monthlyRevenue')} /></Field>
              <Field label="Dépenses mensuelles"><input type="number" value={form.monthlyExpenses} onChange={set('monthlyExpenses')} /></Field>
            </div>
          )}

          {step === 5 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field label="Type de client">
                <select value={form.clientType} onChange={set('clientType')}>
                  <option value="INDIVIDUAL">Individual</option><option value="COMPANY">Company</option>
                </select>
              </Field>
              <Field label="Catégorie de client">
                <select value={form.clientCategory} onChange={set('clientCategory')}>
                  <option value="INDIVIDUAL">Individual</option><option value="BUSINESS">Business</option>
                  <option value="VIP">VIP</option><option value="ASSOCIATION">Association</option><option value="NGO">NGO</option>
                </select>
              </Field>
              <Field label="Collecteur assigné">
                <SearchableSelect options={collectorOptions} value={form.collectorID} onChange={(v) => setForm({ ...form, collectorID: v })} placeholder="Choisir…" />
              </Field>
              <Field label="Chargé de compte (username)"><input value={form.accountOfficer} onChange={set('accountOfficer')} /></Field>
            </div>
          )}

          {step === 6 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field label="Nom du contact"><input value={form.emergencyContactName} onChange={set('emergencyContactName')} /></Field>
              <Field label="Relation"><input value={form.emergencyContactRelationship} onChange={set('emergencyContactRelationship')} /></Field>
              <Field label="Téléphone"><input value={form.emergencyContactPhone} onChange={set('emergencyContactPhone')} /></Field>
              <Field label="Adresse"><input value={form.emergencyContactAddress} onChange={set('emergencyContactAddress')} /></Field>
            </div>
          )}

          {step === 7 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field label="Nom du garant"><input value={form.guarantorName} onChange={set('guarantorName')} /></Field>
              <Field label="Relation"><input value={form.guarantorRelationship} onChange={set('guarantorRelationship')} /></Field>
              <Field label="Téléphone"><input value={form.guarantorPhone} onChange={set('guarantorPhone')} /></Field>
              <Field label="Profession"><input value={form.guarantorOccupation} onChange={set('guarantorOccupation')} /></Field>
              <Field label="Employeur"><input value={form.guarantorEmployer} onChange={set('guarantorEmployer')} /></Field>
              <Field label="Adresse"><input value={form.guarantorAddress} onChange={set('guarantorAddress')} /></Field>
            </div>
          )}

          {step === 8 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
              <Field label="Niveau de risque">
                <select value={form.riskLevel} onChange={set('riskLevel')}>
                  <option value="LOW">Faible</option><option value="MEDIUM">Moyen</option><option value="HIGH">Élevé</option>
                </select>
              </Field>
              <Field label="Personne politiquement exposée (PPE)">
                <label className="flex items-center gap-2 text-xs normal-case"><input type="checkbox" checked={form.isPoliticallyExposed} onChange={setChk('isPoliticallyExposed')} /> Oui</label>
              </Field>
              <Field label="Liste noire">
                <label className="flex items-center gap-2 text-xs normal-case"><input type="checkbox" checked={form.isBlacklisted} onChange={setChk('isBlacklisted')} /> Oui</label>
              </Field>
              <Field label="Statut AML">
                <select value={form.amlStatus} onChange={set('amlStatus')}>
                  <option value="PENDING">En attente</option><option value="VERIFIED">Vérifié</option><option value="REJECTED">Rejeté</option>
                </select>
              </Field>
            </div>
          )}

          {step === 9 && (
            <div>
              <CompletenessBar percent={completeness.percent} label={completeness.label} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 text-xs normal-case">
                <div className="form-card">
                  <div className="form-card-title">Identité</div>
                  <p>{form.nom} {form.prenom} — {form.sexe} — né(e) le {form.dateOfBirth || '—'}</p>
                  <p>CNI: {form.numeroCNI || '—'}</p>
                </div>
                <div className="form-card">
                  <div className="form-card-title">Contact</div>
                  <p>{form.phoneNumber} · {form.email || '—'}</p>
                  <p>{form.address || form.city || '—'}</p>
                </div>
                <div className="form-card">
                  <div className="form-card-title">Banking</div>
                  <p>Type: {form.clientType} / {form.clientCategory}</p>
                  <p>Collecteur: {form.collectorID || '—'}</p>
                </div>
                <div className="form-card">
                  <div className="form-card-title">Risque</div>
                  <p>Niveau: {form.riskLevel} · PPE: {form.isPoliticallyExposed ? 'Oui' : 'Non'} · AML: {form.amlStatus}</p>
                </div>
              </div>
              <p className="text-[11px] text-gray-500 normal-case mt-3">
                Vérifiez les informations ci-dessus, puis cliquez sur « Soumettre pour validation ». Le client sera créé avec le statut <strong>Pending Validation</strong> jusqu'à l'approbation d'un superviseur.
              </p>
            </div>
          )}
        </WideModal>
      )}

      {viewing && (
        <WideModal title={`Dossier client — ${viewing.clientID}`} onClose={() => setViewing(null)}>
          <CompletenessBar percent={viewing.completenessPercent} label={viewing.completenessLabel} />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 text-xs normal-case">
            <div className="form-card">
              <div className="form-card-title">Personnel</div>
              <p>{viewing.nom} {viewing.middleName} {viewing.prenom} ({viewing.sexe})</p>
              <p>Né(e) le {viewing.dateOfBirth ? new Date(viewing.dateOfBirth).toLocaleDateString('fr-FR') : '—'} à {viewing.placeOfBirth || '—'}</p>
              <p>{viewing.nationality} · {viewing.maritalStatus || '—'}</p>
              <p>{viewing.profession || viewing.occupation || '—'} chez {viewing.employer || '—'}</p>
            </div>
            <div className="form-card">
              <div className="form-card-title">Contact</div>
              <p>{viewing.phoneNumber} / {viewing.secondaryPhone || '—'}</p>
              <p>{viewing.email || '—'}</p>
              <p>{viewing.address || `${viewing.street || ''} ${viewing.district || ''} ${viewing.city || ''}`}</p>
            </div>
            <div className="form-card">
              <div className="form-card-title">KYC</div>
              <p>CNI {viewing.numeroCNI} — exp. {viewing.nationalIDExpiryDate ? new Date(viewing.nationalIDExpiryDate).toLocaleDateString('fr-FR') : '—'}</p>
              <p>Passeport: {viewing.passportNumber || '—'}</p>
            </div>
            <div className="form-card">
              <div className="form-card-title">Documents</div>
              <div className="flex gap-2 flex-wrap">
                {[viewing.image, viewing.nationalIDFrontUrl, viewing.nationalIDBackUrl, viewing.signatureUrl].filter(Boolean).map((u, i) => (
                  <img key={i} src={fileUrl(u)} alt="doc" className="h-12 w-12 object-cover rounded border" />
                ))}
                {![viewing.image, viewing.nationalIDFrontUrl, viewing.nationalIDBackUrl, viewing.signatureUrl].some(Boolean) && <span className="text-gray-400">Aucun document</span>}
              </div>
            </div>
            <div className="form-card">
              <div className="form-card-title">Urgence & Garant</div>
              <p>{viewing.emergencyContactName || '—'} ({viewing.emergencyContactPhone || '—'})</p>
              <p>Garant: {viewing.guarantorName || '—'} ({viewing.guarantorPhone || '—'})</p>
            </div>
            <div className="form-card">
              <div className="form-card-title">Risque & Audit</div>
              <p>Risque: {viewing.riskLevel} · PPE: {viewing.isPoliticallyExposed ? 'Oui' : 'Non'} · AML: {viewing.amlStatus}</p>
              <p>Créé par {viewing.createdBy || '—'} le {new Date(viewing.createdDate).toLocaleDateString('fr-FR')}</p>
              {viewing.rejectionReason && <p className="text-red-600">Motif de rejet: {viewing.rejectionReason}</p>}
            </div>
          </div>
        </WideModal>
      )}
    </div>
  );
}
