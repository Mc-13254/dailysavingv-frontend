import { useEffect, useState, useCallback } from 'react';
import { MapPin, Users, Layers, History, Plus } from 'lucide-react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import WideModal from '../components/WideModal';
import StatusBadge from '../components/StatusBadge';
import ExportDropdown from '../components/ExportDropdown';
import SearchableSelect from '../components/SearchableSelect';
import WorldMap from '../components/WorldMap';
import { ZoneAPI, CollectorAPI, CollectorZoneAssignmentAPI } from '../api/endpoints';

const emptyZoneForm = {
  libelle: '', description: '', district: '', neighborhood: '', village: '',
  latitude: null, longitude: null, shapeType: 'Point', polygonCoordinates: null, radiusMeters: null,
};

export default function CollectorAssignmentManagement() {
  const [zones, setZones] = useState([]);
  const [collectors, setCollectors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [zoneSearch, setZoneSearch] = useState('');

  const [selectedZone, setSelectedZone] = useState(null);
  const [zoneClients, setZoneClients] = useState([]);
  const [selectedCollectorId, setSelectedCollectorId] = useState('');
  const [selectedClientIds, setSelectedClientIds] = useState(new Set());

  const [showZoneModal, setShowZoneModal] = useState(false);
  const [zoneForm, setZoneForm] = useState(emptyZoneForm);
  const [pendingShape, setPendingShape] = useState(null);

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
  }, []);

  const collectorOptions = collectors.map((c) => ({ value: c.collectorID, label: `${c.collectorID} — ${c.name} ${c.surname || ''}` }));

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
    try {
      await CollectorZoneAssignmentAPI.assign({
        collectorID: selectedCollectorId,
        zoneCollecteIds: [selectedZone.zoneCollecteID],
        clientIds: Array.from(selectedClientIds),
      });
      setNotice('Affectation effectuée avec succès.');
      await loadZones();
      const { data } = await ZoneAPI.clients(selectedZone.zoneCollecteID);
      setZoneClients(data);
      setSelectedClientIds(new Set());
    } catch (e) {
      setError(e?.response?.data?.message || "Échec de l'affectation.");
    }
  };

  const openCreateZone = () => {
    setZoneForm(emptyZoneForm);
    setPendingShape(null);
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
    if (!zoneForm.libelle) { setError('Le nom de la zone est requis.'); return; }
    try {
      await ZoneAPI.create({
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
    } catch {
      setError('Échec de la création de la zone.');
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
            <button className="btn btn-primary" disabled={selectedClientIds.size === 0 && !selectedCollectorId} onClick={handleAssign}>
              <Users size={14} /> Affecter {selectedClientIds.size > 0 ? `(${selectedClientIds.size} clients)` : '(zone entière)'}
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
            <label>Nom de la zone *</label>
            <input value={zoneForm.libelle} onChange={(e) => setZoneForm({ ...zoneForm, libelle: e.target.value })} placeholder="ex: Bonamoussadi Nord" />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea value={zoneForm.description} onChange={(e) => setZoneForm({ ...zoneForm, description: e.target.value })} placeholder="ex: Zone Collecteur A" />
          </div>
          <div className="form-row">
            <div className="form-group"><label>Quartier</label><input value={zoneForm.district} onChange={(e) => setZoneForm({ ...zoneForm, district: e.target.value })} /></div>
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
