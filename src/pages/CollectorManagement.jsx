import { useEffect, useState } from 'react';
import { Eye, Pencil, Trash2, UserSquare2, Briefcase, MapPin, BadgeCheck } from 'lucide-react';
import DataTable from '../components/DataTable';
import WideModal from '../components/WideModal';
import StatusBadge from '../components/StatusBadge';
import ExportDropdown from '../components/ExportDropdown';
import SearchableSelect from '../components/SearchableSelect';
import { CollectorAPI, ContractTypeAPI, CommissionAPI, UserAPI } from '../api/endpoints';

const CONTACT_TYPES = ['Field Collector', 'Senior Collector', 'Supervisor Collector'];
const STATUS_OPTIONS = ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'ONLEAVE'];

const emptyForm = {
  codeUser: '', contactType: 'Field Collector', dateEmploi: '', codeTerminal: '',
  plafond: '', caution: '', contractID: '', commissionTypeID: '', commissionRangeID: '',
  supervisorId: '', zoneCollecteID: '', collectMonth: '', collectDay: '', retraitMonth: '', retraitDay: '',
  cdetat: 'ACTIVE',
};

// mode: 'create' | 'edit' | 'view' | null
export default function CollectorManagement() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [mode, setMode] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [contractTypes, setContractTypes] = useState([]);
  const [commissionTypes, setCommissionTypes] = useState([]);
  const [commissionRanges, setCommissionRanges] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await CollectorAPI.list(search);
      setRows(data);
    } catch { setRows([]); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [search]);
  useEffect(() => {
    ContractTypeAPI.list().then(({ data }) => setContractTypes(data.filter((c) => c.statut === 'ACTIVE'))).catch(() => {});
    CommissionAPI.types().then(({ data }) => setCommissionTypes(data.filter((c) => c.statut === 'ACTIVE'))).catch(() => {});
    UserAPI.list().then(({ data }) => setSupervisors(data.filter((u) => ['Manager', 'Supervisor'].includes(u.typeUser)))).catch(() => {});
  }, []);

  const contractOptions = contractTypes.map((c) => ({ value: c.contractTypeID, label: c.contractName }));
  const commissionTypeOptions = commissionTypes.map((c) => ({ value: c.commissionTypeID, label: c.name }));
  const commissionRangeOptions = commissionRanges.map((r) => ({ value: r.commissionRangeID, label: `${r.inf} — ${r.sup} (${r.preview || ''})` }));
  const supervisorOptions = supervisors.map((u) => ({ value: u.codeUser, label: `${u.codeUser} — ${u.firstName || ''} ${u.lastName || ''}` }));

  const loadCommissionRanges = async (commissionTypeID) => {
    if (!commissionTypeID) { setCommissionRanges([]); return; }
    try {
      const { data } = await CommissionAPI.ranges(commissionTypeID);
      setCommissionRanges(data.filter((r) => r.statut === 'ACTIVE'));
    } catch { setCommissionRanges([]); }
  };

  const openCreate = async () => {
    setMode('create');
    setForm(emptyForm);
    setSelectedUser(null);
    setError('');
    try {
      const { data } = await CollectorAPI.availableUsers();
      setAvailableUsers(data);
    } catch { setAvailableUsers([]); }
  };

  const openView = (row) => { setMode('view'); setForm(mapRowToForm(row)); setSelectedUser(null); if (row.commissionTypeID) loadCommissionRanges(row.commissionTypeID); };
  const openEdit = (row) => { setMode('edit'); setForm(mapRowToForm(row)); setSelectedUser(null); setError(''); if (row.commissionTypeID) loadCommissionRanges(row.commissionTypeID); };
  const close = () => setMode(null);

  function mapRowToForm(row) {
    return {
      __id: row.collectorID, codeUser: row.codeUser, name: row.name, surname: row.surname,
      phoneNumber: row.phoneNumber, agenceNom: row.agenceNom, departmentNom: row.departmentNom,
      contactType: row.contactType || 'Field Collector', dateEmploi: row.dateEmploi ? row.dateEmploi.slice(0, 10) : '',
      codeTerminal: row.codeTerminal || '', plafond: row.plafond ?? '', caution: row.caution ?? '',
      contractID: row.contractID || '', commissionTypeID: row.commissionTypeID || '', commissionRangeID: row.commissionRangeID || '',
      supervisorId: row.supervisorId || '', collectMonth: row.collectMonth ?? '', collectDay: row.collectDay ?? '',
      retraitMonth: row.retraitMonth ?? '', retraitDay: row.retraitDay ?? '', cdetat: row.cdetat || row.CDETAT || 'ACTIVE',
      userCreate: row.userCreate, createDate: row.createDate, userValidation: row.userValidation, dateValidation: row.dateValidation,
      lastUserModif: row.lastUserModif, dateModification: row.dateModification,
      lastUserSupervise: row.lastUserSupervise, lastDateSupervise: row.lastDateSupervise,
    };
  }

  const handleSelectUser = (codeUser) => {
    const u = availableUsers.find((x) => x.codeUser === codeUser);
    setSelectedUser(u || null);
    setForm({ ...form, codeUser });
  };

  const numOrNull = (v) => (v === '' || v === null || v === undefined ? null : Number(v));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (mode === 'create') {
        if (!form.codeUser) { setError('Veuillez sélectionner un utilisateur.'); return; }
        await CollectorAPI.create({
          codeUser: form.codeUser, contactType: form.contactType, dateEmploi: form.dateEmploi || null,
          codeTerminal: form.codeTerminal, plafond: numOrNull(form.plafond), caution: numOrNull(form.caution),
          contractID: numOrNull(form.contractID), commissionTypeID: numOrNull(form.commissionTypeID),
          commissionRangeID: numOrNull(form.commissionRangeID), supervisorId: form.supervisorId || null,
          collectMonth: numOrNull(form.collectMonth), collectDay: numOrNull(form.collectDay),
          retraitMonth: numOrNull(form.retraitMonth), retraitDay: numOrNull(form.retraitDay),
        });
        setNotice('Collecteur soumis pour validation.');
      } else if (mode === 'edit') {
        await CollectorAPI.update(form.__id, {
          contactType: form.contactType, commissionTypeID: numOrNull(form.commissionTypeID),
          commissionRangeID: numOrNull(form.commissionRangeID), contractID: numOrNull(form.contractID),
          plafond: numOrNull(form.plafond), collectMonth: numOrNull(form.collectMonth), collectDay: numOrNull(form.collectDay),
          retraitMonth: numOrNull(form.retraitMonth), retraitDay: numOrNull(form.retraitDay),
          supervisorId: form.supervisorId || null, cdetat: form.cdetat,
        });
        setNotice('Modification soumise pour validation.');
      }
      close();
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de l'enregistrement.");
    }
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Voulez-vous vraiment supprimer le collecteur ${row.name} ${row.surname || ''} ?`)) return;
    try {
      await CollectorAPI.remove(row.collectorID);
      setNotice('Suppression soumise pour validation.');
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de la suppression.');
    }
  };

  const columns = [
    { key: 'collectorID', label: 'Collector Code' },
    { key: 'name', label: 'Full Name', render: (r) => `${r.name} ${r.surname || ''}` },
    { key: 'codeUser', label: 'User Code' },
    { key: 'agenceNom', label: 'Agency', render: (r) => r.agenceNom || '—' },
    { key: 'departmentNom', label: 'Department', render: (r) => r.departmentNom || '—' },
    { key: 'contractNom', label: 'Contract Type', render: (r) => r.contractNom || '—' },
    { key: 'commissionTypeNom', label: 'Commission Type', render: (r) => r.commissionTypeNom || '—' },
    { key: 'phoneNumber', label: 'Phone', render: (r) => r.phoneNumber || '—' },
    { key: 'plafond', label: 'Collection Ceiling' },
    { key: 'cdetat', label: 'Status', render: (r) => <StatusBadge status={r.cdetat || r.CDETAT} /> },
    { key: 'createDate', label: 'Created', render: (r) => r.createDate ? new Date(r.createDate).toLocaleDateString('fr-FR') : '—' },
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

  const readOnly = mode === 'view';
  const userOptions = availableUsers.map((u) => ({ value: u.codeUser, label: `${u.codeUser} — ${u.firstName || ''} ${u.lastName || ''} (${u.agenceNom || 'N/A'})` }));

  return (
    <div className="panel">
      <div className="panel-header">
        <div className="panel-title">Collector Management</div>
        <button className="btn btn-primary" onClick={openCreate}>+ Create Collector</button>
      </div>

      {notice && <div className="error-banner" style={{ background: '#dcfce7', color: '#16a34a' }}>{notice}</div>}

      <div className="toolbar">
        <input className="search-input" placeholder="Search Collector (code, nom, téléphone, agence, statut)…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <ExportDropdown filename="COLLECTORS" columns={columns.filter((c) => c.key !== 'actions')} rows={rows} />
      </div>

      <DataTable columns={columns} rows={rows} loading={loading} totalLabel={`TOTAL COLLECTORS: ${rows.length}`} />

      {mode && (
        <WideModal
          title={mode === 'create' ? 'Create Collector' : mode === 'edit' ? 'Edit Collector' : 'View Collector'}
          onClose={close}
          footer={
            readOnly
              ? <button className="btn btn-outline" onClick={close}>Fermer</button>
              : (
                <>
                  <button className="btn btn-outline" onClick={close}>Cancel</button>
                  <button className="btn btn-primary" form="collector-form" type="submit">{mode === 'create' ? 'Save' : 'Update'}</button>
                </>
              )
          }
        >
          {error && <div className="error-banner mb-3">{error}</div>}
          <form id="collector-form" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 items-start">

              {/* Select User (create only) */}
              {mode === 'create' && (
                <div className="form-card lg:col-span-3">
                  <div className="form-card-title"><UserSquare2 size={12} /> Select User</div>
                  <div className="form-group">
                    <label>User *</label>
                    <SearchableSelect options={userOptions} value={form.codeUser} onChange={handleSelectUser} placeholder="Choisir un utilisateur (Rôle Collector, Actif, non assigné)…" />
                  </div>
                  {selectedUser && (
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 mt-2 items-start">
                      <div className="flex flex-col items-center gap-1.5">
                        <label className="text-[11px] text-gray-500 self-start">Photo</label>
                        {selectedUser.photo ? (
                          <img src={selectedUser.photo} alt="" className="w-16 h-16 rounded-full object-cover border border-gray-200" />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400 text-[10px]">N/A</div>
                        )}
                      </div>
                      <div className="form-group"><label>First Name</label><input disabled value={selectedUser.firstName || ''} /></div>
                      <div className="form-group"><label>Last Name</label><input disabled value={selectedUser.lastName || ''} /></div>
                      <div className="form-group"><label>Phone</label><input disabled value={selectedUser.phone || ''} /></div>
                      <div className="form-group"><label>Email</label><input disabled value={selectedUser.email || ''} /></div>
                      <div className="form-group"><label>Agency</label><input disabled value={selectedUser.agenceNom || ''} /></div>
                      <div className="form-group"><label>Department</label><input disabled value={selectedUser.departmentNom || ''} /></div>
                    </div>
                  )}
                </div>
              )}

              {/* Collector Information */}
              <div className="form-card lg:col-span-2">
                <div className="form-card-title"><Briefcase size={12} /> Collector Information</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {mode !== 'create' && <div className="form-group"><label>Collector Code</label><input disabled value={form.__id || ''} /></div>}
                  <div className="form-group">
                    <label>Collector Type</label>
                    <select disabled={readOnly} value={form.contactType} onChange={(e) => setForm({ ...form, contactType: e.target.value })}>
                      {CONTACT_TYPES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Contract Type *</label>
                    <SearchableSelect options={contractOptions} value={form.contractID} isDisabled={readOnly} onChange={(v) => setForm({ ...form, contractID: v })} placeholder="Choisir…" />
                  </div>
                  <div className="form-group">
                    <label>Commission Type *</label>
                    <SearchableSelect options={commissionTypeOptions} value={form.commissionTypeID} isDisabled={readOnly}
                      onChange={(v) => { setForm({ ...form, commissionTypeID: v, commissionRangeID: '' }); loadCommissionRanges(v); }} placeholder="Choisir…" />
                  </div>
                  <div className="form-group sm:col-span-2">
                    <label>Commission Range *</label>
                    <SearchableSelect options={commissionRangeOptions} value={form.commissionRangeID} isDisabled={readOnly || !form.commissionTypeID}
                      onChange={(v) => setForm({ ...form, commissionRangeID: v })} placeholder="Choisir une tranche…" />
                  </div>
                  <div className="form-group"><label>Collection Ceiling</label><input type="number" disabled={readOnly} value={form.plafond} onChange={(e) => setForm({ ...form, plafond: e.target.value })} /></div>
                  <div className="form-group"><label>Daily Collection Limit</label><input type="number" disabled={readOnly} value={form.collectDay} onChange={(e) => setForm({ ...form, collectDay: e.target.value })} /></div>
                  <div className="form-group"><label>Monthly Collection Limit</label><input type="number" disabled={readOnly} value={form.collectMonth} onChange={(e) => setForm({ ...form, collectMonth: e.target.value })} /></div>
                  <div className="form-group"><label>Daily Withdrawal Limit</label><input type="number" disabled={readOnly} value={form.retraitDay} onChange={(e) => setForm({ ...form, retraitDay: e.target.value })} /></div>
                  <div className="form-group"><label>Monthly Withdrawal Limit</label><input type="number" disabled={readOnly} value={form.retraitMonth} onChange={(e) => setForm({ ...form, retraitMonth: e.target.value })} /></div>
                  <div className="form-group"><label>Security Deposit (Caution)</label><input type="number" disabled={readOnly || mode === 'edit'} value={form.caution} onChange={(e) => setForm({ ...form, caution: e.target.value })} /></div>
                  <div className="form-group"><label>Employment Date</label><input type="date" disabled={readOnly || mode === 'edit'} value={form.dateEmploi} onChange={(e) => setForm({ ...form, dateEmploi: e.target.value })} /></div>
                  <div className="form-group"><label>Terminal Code</label><input disabled={readOnly || mode === 'edit'} value={form.codeTerminal} onChange={(e) => setForm({ ...form, codeTerminal: e.target.value })} /></div>
                </div>
              </div>

              {/* Work Information */}
              <div className="form-card">
                <div className="form-card-title"><MapPin size={12} /> Work Information</div>
                <div className="form-group"><label>Assigned Agency</label><input disabled value={form.agenceNom || selectedUser?.agenceNom || '—'} /></div>
                <div className="form-group"><label>Assigned Department</label><input disabled value={form.departmentNom || selectedUser?.departmentNom || '—'} /></div>
                <div className="form-group">
                  <label>Supervisor</label>
                  <SearchableSelect options={supervisorOptions} value={form.supervisorId} isDisabled={readOnly} onChange={(v) => setForm({ ...form, supervisorId: v })} placeholder="Optionnel…" />
                </div>
              </div>

              {/* Status + Audit */}
              <div className="form-card lg:col-span-3">
                <div className="form-card-title"><BadgeCheck size={12} /> Status & Audit</div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                  {mode === 'edit' ? (
                    <div className="form-group">
                      <label>Status</label>
                      <select value={form.cdetat} onChange={(e) => setForm({ ...form, cdetat: e.target.value })}>
                        {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  ) : mode === 'view' ? (
                    <div className="form-group"><label>Status</label><StatusBadge status={form.cdetat} /></div>
                  ) : (
                    <div className="text-[11px] text-gray-400 sm:col-span-4">Statut initial : ACTIVE</div>
                  )}
                  {mode !== 'create' && (
                    <>
                      <div className="form-group"><label>Created By / Date</label><input disabled value={`${form.userCreate || ''} — ${form.createDate ? new Date(form.createDate).toLocaleDateString('fr-FR') : ''}`} /></div>
                      <div className="form-group"><label>Validated By / Date</label><input disabled value={`${form.userValidation || '—'} — ${form.dateValidation ? new Date(form.dateValidation).toLocaleDateString('fr-FR') : '—'}`} /></div>
                      <div className="form-group"><label>Last Modified By / Date</label><input disabled value={`${form.lastUserModif || '—'} — ${form.dateModification ? new Date(form.dateModification).toLocaleDateString('fr-FR') : '—'}`} /></div>
                      <div className="form-group"><label>Last Supervisor / Date</label><input disabled value={`${form.lastUserSupervise || '—'} — ${form.lastDateSupervise ? new Date(form.lastDateSupervise).toLocaleDateString('fr-FR') : '—'}`} /></div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </form>
        </WideModal>
      )}
    </div>
  );
}
