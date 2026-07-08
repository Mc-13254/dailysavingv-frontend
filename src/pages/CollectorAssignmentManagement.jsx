import { useEffect, useState, useCallback, useMemo } from 'react';
import CreatableSelect from 'react-select/creatable';
import { MapPin, Users, Layers, History, Plus } from 'lucide-react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import WideModal from '../components/WideModal';
import StatusBadge from '../components/StatusBadge';
import ExportDropdown from '../components/ExportDropdown';
import SearchableSelect from '../components/SearchableSelect';
import WorldMap from '../components/WorldMap';
import { ZoneAPI, CollectorAPI, CollectorZoneAssignmentAPI, GeoAPI } from '../api/endpoints';

const emptyZoneForm = {
  paysID: '', libelle: '', description: '', district: '', neighborhood: '', village: '',
  latitude: null, longitude: null, shapeType: 'Point', polygonCoordinates: null, radiusMeters: null,
};

const creatableStyles = {
  control: (base, state) => ({
    ...base, minHeight: 34, fontSize: 12.5, borderRadius: 6,
    borderColor: state.isFocused ? '#1E90FF' : '#d1d5db',
    boxShadow: state.isFocused ? '0 0 0 1px #1E90FF' : 'none',
    '&:hover': { borderColor: '#1E90FF' },
  }),
  valueContainer: (base) => ({ ...base, padding: '0 8px' }),
  input: (base) => ({ ...base, margin: 0, padding: 0 }),
  indicatorsContainer: (base) => ({ ...base, height: 34 }),
  menu: (base) => ({ ...base, fontSize: 12.5, zIndex: 2100 }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected ? '#1E90FF' : state.isFocused ? '#eff6ff' : 'white',
    color: state.isSelected ? 'white' : '#111827',
  }),
  placeholder: (base) => ({ ...base, color: '#9ca3af' }),
};

export default function CollectorAssignmentManagement() {
  const [zones, setZones] = useState([]);
  const [collectors, setCollectors] = useState([]);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [zoneSearch, setZoneSearch] = useState('');

  const [selectedZone, setSelectedZone] = useState(null);
  const [zoneClients, setZoneClients] = useState([]);
  const [selectedCollectorId, setSelectedCollectorId] = useState('');
  const [selectedClientIds, setSelectedClientIds] = useState(new Set());
  const [assigning, setAssigning] = useState(false);

  const [showZoneModal, setShowZoneModal] = useState(false);
  const [zoneForm, setZoneForm] = useState(emptyZoneForm);
  const [pendingShape, setPendingShape] = useState(null);
  const [districtOptions, setDistrictOptions] = useState([]);

  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);

  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const loadZones = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await ZoneAPI.list(zoneSearch);
      setZones(data);
    } catch { setZones([]); }
    finally { setLoading(false); }
  }, [zoneSearch]);

  useEffect(() => { loadZones(); }, [loadZones]);
  useEffect(() => {
    CollectorAPI.list().then(({ data }) => setCollectors(data)).catch(() => {});
    GeoAPI.countries().then(({ data }) => setCountries(data)).catch(() => setCountries([]));
  }, []);

  // Refresh the Quartier suggestion list whenever the selected country changes,
  // so the admin picks from districts already used in that country instead of
  // having to remember/retype names — but can still type a brand-new one.
  useEffect(() => {
    ZoneAPI.districts(zoneForm.paysID || undefined)
      .then(({ data }) => setDistrictOptions(data.map((d) => ({ value: d, label: d }))))
      .catch(() => setDistrictOptions([]));
  }, [zoneForm.paysID]);

  const collectorOptions = collectors.map((c) => ({ value: c.collectorID, label: `${c.collectorID} — ${c.name} ${c.surname || ''}` }));
  const countryOptions = useMemo(() => countries.map((c) => ({ value: c.paysID, label: c.nom })), [countries]);

  const openZone = async (zone) => {
    setSelectedZone(zone);
    setSelectedClientIds(new Set());
    try {
      const { data } = await ZoneAPI.clients(zone.zoneCollecteID);
      setZoneClients(data);
    } catch { setZoneClients([]); }
  };

  const toggleClient = (clientId) => {
    setSelectedClientIds((prev) => {
      const next = new Set(prev);
      next.has(clientId) ? next.delete(clientId) : next.add(clientId);
      return next;
    });
  };

  const handleAssign = async () => {
    setError('');
    if (!selectedCollectorId || !selectedZone) { setError('Sélectionnez un collecteur et une zone.'); return; }

    // "Zone entière" = no specific client checked → assign every client
    // currently in the zone, not just the zone-collector link on its own.
    const clientIdsToAssign = selectedClientIds.size > 0
      ? Array.from(selectedClientIds)
      : zoneClients.map((c) => c.clientID);

    setAssigning(true);
    try {
      await CollectorZoneAssignmentAPI.assign({
        collectorID: selectedCollectorId,
        zoneCollecteIds: [selectedZone.zoneCollecteID],
        clientIds: clientIdsToAssign,
      });
      setNotice(
        selectedClientIds.size > 0
          ? `${clientIdsToAssign.length} client(s) affecté(s) avec succès.`
          : `Zone entière affectée : ${clientIdsToAssign.length} client(s) mis à jour.`
      );
      await loadZones();
      const { data } = await ZoneAPI.clients(selectedZone.zoneCollecteID);
      setZoneClients(data);
      setSelectedClientIds(new Set());
    } catch (e) {
      setError(e?.response?.data?.message || "Échec de l'affectation.");
    } finally {
      setAssigning(false);
    }
  };

  const openCreateZone = () => {
    setZoneForm(emptyZoneForm);
    setPendingShape(null);
    setError('');
    setShowZoneModal(true);
  };

  const handleDrawComplete = (shape) => {
    setPendingShape(shape);
    setZoneForm((f) => ({ ...f, ...shape }));
    setShowZoneModal(true);
  };

  const handleLocationSelect = (loc) => {
    setZoneForm((f) => ({
      ...f,
      latitude: loc.lat,
      longitude: loc.lon,
      district: loc.address?.suburb || f.district,
      village: loc.address?.village || loc.address?.town || f.village,
    }));
  };

  const handleSaveZone = async () => {
    setError('');
    if (!zoneForm.paysID) { setError('Sélectionnez un pays.'); return; }
    if (!zoneForm.libelle) { setError('Le nom de la zone de collecte est requis.'); return; }
    try {
      await ZoneAPI.create({
        paysID: Number(zoneForm.paysID),
        libelle: zoneForm.libelle,
        description: zoneForm.description || null,
        villeID: null,
        district: zoneForm.district || null,
        neighborhood: zoneForm.neighborhood || null,
        village: zoneForm.village || null,
        latitude: zoneForm.latitude,
        longitude: zoneForm.longitude,
        shapeType: zoneForm.shapeType,
        polygonCoordinates: zoneForm.polygonCoordinates,
        radiusMeters: zoneForm.radiusMeters,
      });
      setShowZoneModal(false);
      setNotice('Zone créée avec succès.');
      await loadZones();
    } catch (e) {
      setError(e?.response?.data?.message || 'Échec de la création de la zone.');
    }
  };

  const openHistory = async () => {
    try {
      const { data } = await CollectorZoneAssignmentAPI.history({});
      setHistory(data);
      setShowHistory(true);
    } catch { setHistory([]); setShowHistory(true); }
  };

  const clientColumns = [
    { key: 'select', label: '', sortable: false, render: (r) => (
      <input type="checkbox" checked={selectedClientIds.has(r.clientID)} onChange={() => toggleClient(r.clientID)} />
    ) },
    { key: 'clientID', label: 'Code' },
    { key: 'nom', label: 'Nom', render: (r) => `${r.nom} ${r.prenom || ''}` },
    { key: 'phoneNumber', label: 'Téléphone' },
    { key: 'address', label: 'Adresse' },
    { key: 'balance', label: 'Solde', render: (r) => new Intl.NumberFormat('fr-FR').format(r.balance || 0) },
    { key: 'validationStatus', label: 'Statut', render: (r) => <StatusBadge status={r.validationStatus} /> },
    { key: 'currentCollectorID', label: 'Collecteur actuel', render: (r) => r.currentCollectorID || '—' },
  ];

  const historyColumns = [
    { key: 'eventDate', label: 'Date', render: (r) => new Date(r.eventDate).toLocaleString('fr-FR') },
    { key: 'eventType', label: 'Événement' },
    { key: 'collectorName', label: 'Collecteur' },
    { key: 'zoneLibelle', label: 'Zone' },
    { key: 'clientName', label: 'Client', render: (r) => r.clientName || '—' },
    { key: 'actionBy', label: 'Par' },
  ];

  return (
    <div>
      <div className="panel-header">
        <div>
          <div className="panel-title">Affectation des Collecteurs</div>
          <div className="panel-subtitle">Collecteur → Zone → Clients de la zone. Un client hérite de son collecteur via sa zone.</div>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-outline" onClick={openHistory}><History size={14} /> Historique</button>
          <button className="btn btn-primary" onClick={openCreateZone}><Plus size={14} /> Nouvelle Zone</button>
        </div>
      </div>

      {notice && <div className="mb-3 text-xs text-green-700 bg-green-50 px-3 py-2 rounded normal-case">{notice}</div>}
      {error && <div className="error-banner">{error}</div>}

      <div className="toolbar">
        <input className="search-input" placeholder="Rechercher une zone…" value={zoneSearch} onChange={(e) => setZoneSearch(e.target.value)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="panel lg:col-span-1" style={{ maxHeight: 560, overflowY: 'auto' }}>
          <div className="form-card-title"><Layers size={12} /> Zones ({zones.length})</div>
          {loading && <div className="empty-state">Chargement…</div>}
          {!loading && zones.length === 0 && <div className="empty-state">Aucune zone.</div>}
          <ul className="flex flex-col gap-1 mt-2">
            {zones.map((z) => (
              <li key={z.zoneCollecteID}
                onClick={() => openZone(z)}
                className={`px-2.5 py-2 rounded cursor-pointer text-xs flex justify-between items-center ${selectedZone?.zoneCollecteID === z.zoneCollecteID ? 'bg-brand-blue text-white' : 'hover:bg-gray-50'}`}>
                <span className="normal-case font-medium">{z.libelle}</span>
                <span className="normal-case opacity-70">{z.clientCount} clients</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="panel lg:col-span-3">
          <div className="form-card-title"><MapPin size={12} /> Carte mondiale des zones</div>
          <WorldMap
            zones={zones.map((z) => ({
              zoneCollecteID: z.zoneCollecteID, libelle: z.libelle, latitude: z.latitude, longitude: z.longitude,
              shapeType: z.shapeType, polygonCoordinates: z.polygonCoordinates, radiusMeters: z.radiusMeters,
            }))}
            drawable
            onDrawComplete={handleDrawComplete}
            onLocationSelect={handleLocationSelect}
          />
        </div>
      </div>

      {selectedZone && (
        <div className="panel mt-4">
          <div className="panel-header">
            <div>
              <div className="panel-title">{selectedZone.libelle}</div>
              <div className="panel-subtitle">{selectedZone.code} · {zoneClients.length} client(s) dans cette zone</div>
            </div>
            <ExportDropdown
              filename={`ZONE_${selectedZone.code}`}
              columns={[
                { label: 'Code', key: 'clientID' },
                { label: 'Nom', key: 'nom', format: (r) => `${r.nom} ${r.prenom || ''}` },
                { label: 'Téléphone', key: 'phoneNumber' },
                { label: 'Solde', key: 'balance' },
                { label: 'Statut', key: 'validationStatus' },
              ]}
              rows={zoneClients}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3 items-end">
            <div className="form-group sm:col-span-2">
              <label>Affecter le collecteur</label>
              <SearchableSelect options={collectorOptions} value={selectedCollectorId} onChange={setSelectedCollectorId} placeholder="Choisir un collecteur…" />
            </div>
            <button className="btn btn-primary" disabled={!selectedCollectorId || assigning} onClick={handleAssign}>
              <Users size={14} />
              {assigning ? 'Affectation…' : `Affecter ${selectedClientIds.size > 0 ? `(${selectedClientIds.size} clients)` : '(zone entière)'}`}
            </button>
          </div>

          <DataTable columns={clientColumns} rows={zoneClients} loading={false} />
        </div>
      )}

      {showZoneModal && (
        <Modal title="Créer une zone" onClose={() => setShowZoneModal(false)} footer={
          <>
            <button className="btn btn-outline" onClick={() => setShowZoneModal(false)}>Annuler</button>
            <button className="btn btn-primary" onClick={handleSaveZone}>Enregistrer</button>
          </>
        }>
          {error && <div className="error-banner">{error}</div>}

          <div className="form-group">
            <label>Pays *</label>
            <SearchableSelect
              options={countryOptions}
              value={zoneForm.paysID}
              onChange={(v) => setZoneForm({ ...zoneForm, paysID: v })}
              placeholder="Sélectionner un pays…"
            />
          </div>

          <div className="form-group">
            <label>Zone de collecte *</label>
            <input value={zoneForm.libelle} onChange={(e) => setZoneForm({ ...zoneForm, libelle: e.target.value })} placeholder="ex: Zone 5 — Hydrom" />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea value={zoneForm.description} onChange={(e) => setZoneForm({ ...zoneForm, description: e.target.value })} placeholder="ex: Zone Collecteur A" />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Quartier</label>
              <CreatableSelect
                options={districtOptions}
                value={zoneForm.district ? { value: zoneForm.district, label: zoneForm.district } : null}
                onChange={(opt) => setZoneForm({ ...zoneForm, district: opt ? opt.value : '' })}
                onCreateOption={(val) => setZoneForm({ ...zoneForm, district: val })}
                styles={creatableStyles}
                isClearable
                placeholder="Choisir un quartier existant ou en saisir un nouveau…"
                formatCreateLabel={(v) => `Créer le quartier "${v}"`}
                noOptionsMessage={() => 'Aucun quartier existant — tapez pour en créer un'}
              />
            </div>
            <div className="form-group"><label>Village</label><input value={zoneForm.village} onChange={(e) => setZoneForm({ ...zoneForm, village: e.target.value })} /></div>
          </div>

          <p className="text-[11px] text-gray-500 normal-case">
            Astuce : recherchez un lieu ou tracez une forme (polygone/cercle/rectangle) sur la carte avant d'ouvrir cette fenêtre —
            la forme est déjà capturée : <strong>{zoneForm.shapeType}</strong>{pendingShape ? ' ✓' : ''}.
          </p>
        </Modal>
      )}

      {showHistory && (
        <WideModal title="Historique des affectations" onClose={() => setShowHistory(false)}>
          <DataTable columns={historyColumns} rows={history} loading={false} />
        </WideModal>
      )}
    </div>
  );
}
