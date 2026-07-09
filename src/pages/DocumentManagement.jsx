import { useEffect, useState } from 'react';
import { Upload, Download, Trash2, FileText } from 'lucide-react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { DocumentAPI } from '../api/endpoints';
import { API_BASE_URL } from '../api/client';

const fmtDate = (d) => d ? new Date(d).toLocaleString('fr-FR') : '—';
const fmtSize = (bytes) => {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
};

const ENTITY_TYPES = ['CLIENT', 'CONTRACT', 'COLLECTOR', 'LOAN', 'AGENCY', 'OTHER'];

export default function DocumentManagement() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [entityType, setEntityType] = useState('');
  const [search, setSearch] = useState('');

  const [showUpload, setShowUpload] = useState(false);
  const [file, setFile] = useState(null);
  const [form, setForm] = useState({ entityType: 'CLIENT', entityId: '', description: '', tags: '' });
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (entityType) params.entityType = entityType;
      if (search) params.search = search;
      const { data } = await DocumentAPI.list(params);
      setRows(data);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line

  const upload = async () => {
    if (!file) { setError('Sélectionnez un fichier.'); return; }
    setError(''); setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('entityType', form.entityType);
      if (form.entityId) formData.append('entityId', form.entityId);
      if (form.description) formData.append('description', form.description);
      if (form.tags) formData.append('tags', form.tags);
      await DocumentAPI.upload(formData);
      setShowUpload(false);
      setFile(null);
      load();
    } catch (err) {
      setError(err?.response?.data?.message || "Échec de l'envoi.");
    } finally { setUploading(false); }
  };

  const remove = async (row) => {
    if (!window.confirm(`Supprimer "${row.fileName}" ?`)) return;
    await DocumentAPI.remove(row.documentID);
    load();
  };

  const columns = [
    { key: 'fileName', label: 'Fichier', render: (r) => <span className="flex items-center gap-1.5"><FileText size={13} className="text-gray-400" /> {r.fileName}</span> },
    { key: 'entityType', label: 'Lié à', render: (r) => `${r.entityType}${r.entityID ? ` (${r.entityID})` : ''}` },
    { key: 'description', label: 'Description', render: (r) => r.description || '—' },
    { key: 'tags', label: 'Tags', render: (r) => r.tags || '—' },
    { key: 'fileSizeBytes', label: 'Taille', render: (r) => fmtSize(r.fileSizeBytes) },
    { key: 'uploadedBy', label: 'Envoyé par' },
    { key: 'uploadDate', label: 'Date', render: (r) => fmtDate(r.uploadDate) },
    {
      key: 'actions', label: 'Actions', sortable: false, render: (r) => (
        <div className="flex items-center gap-1">
          <a className="btn-icon" href={`${API_BASE_URL}${r.downloadUrl}`} target="_blank" rel="noreferrer" title="Télécharger"><Download size={15} /></a>
          <button className="btn-icon text-red-500" title="Supprimer" onClick={() => remove(r)}><Trash2 size={15} /></button>
        </div>
      )
    },
  ];

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <div className="panel-title">Document Management</div>
          <div className="panel-subtitle">Stockage centralisé des documents liés aux clients, contrats, collecteurs et prêts.</div>
        </div>
      </div>

      <div className="toolbar flex-wrap gap-2">
        <input className="search-input" placeholder="Nom, description, tags…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select value={entityType} onChange={(e) => setEntityType(e.target.value)}>
          <option value="">Tous les types</option>
          {ENTITY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <button className="btn btn-outline" onClick={load}>Filtrer</button>
        <button className="btn btn-primary" onClick={() => { setFile(null); setForm({ entityType: 'CLIENT', entityId: '', description: '', tags: '' }); setError(''); setShowUpload(true); }}>
          <Upload size={14} /> Téléverser
        </button>
      </div>

      <DataTable columns={columns} rows={rows} loading={loading} totalLabel={`TOTAL: ${rows.length}`} />

      {showUpload && (
        <Modal title="Téléverser un document" onClose={() => setShowUpload(false)} footer={
          <>
            <button className="btn btn-outline" onClick={() => setShowUpload(false)}>Annuler</button>
            <button className="btn btn-primary" onClick={upload} disabled={uploading}>{uploading ? 'Envoi…' : 'Téléverser'}</button>
          </>
        }>
          {error && <div className="error-banner mb-2">{error}</div>}
          <div className="form-group">
            <label>Fichier * (PDF, image, Word, Excel — max 10 Mo)</label>
            <input type="file" accept=".pdf,.png,.jpg,.jpeg,.docx,.xlsx" onChange={(e) => setFile(e.target.files[0])} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="form-group">
              <label>Lié à</label>
              <select value={form.entityType} onChange={(e) => setForm({ ...form, entityType: e.target.value })}>
                {ENTITY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group"><label>ID (ex: CL-00001)</label><input value={form.entityId} onChange={(e) => setForm({ ...form, entityId: e.target.value })} /></div>
          </div>
          <div className="form-group"><label>Description</label><input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div className="form-group"><label>Tags (séparés par virgule)</label><input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} /></div>
        </Modal>
      )}
    </div>
  );
}
