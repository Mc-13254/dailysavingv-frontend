import { useEffect, useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import ExportDropdown from '../components/ExportDropdown';
import { IMFAPI } from '../api/endpoints';

const emptyForm = { codeIMF: '', libelle: '', tauxTaxe: 0, assujettiTaxe: false, suffixeCompte: '', prefixeCompte: '', tailleCompte: 10, calculCommission: true };

export default function IMFManagement() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');
  const [notice, setNotice] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await IMFAPI.list();
      setRows(data);
    } catch { setRows([]); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const filtered = rows.filter(r => !search || r.libelle?.toLowerCase().includes(search.toLowerCase()));

  const openCreate = () => { setEditing(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (row) => { setEditing(row); setForm({ ...row }); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editing) {
      await IMFAPI.update(editing.codeIMF, form);
      setNotice('Modification soumise pour validation.');
    } else {
      await IMFAPI.create(form);
      setNotice('IMF soumis pour validation.');
    }
    setShowModal(false);
    setForm(emptyForm);
    setEditing(null);
    load();
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Désactiver l'IMF ${row.codeIMF} ? (soumis pour validation)`)) return;
    await IMFAPI.remove(row.codeIMF);
    setNotice('Suppression soumise pour validation.');
    load();
  };

  const columns = [
    { key: 'codeIMF', label: 'Code IMF' },
    { key: 'libelle', label: 'Libellé' },
    { key: 'statut', label: 'Statut', render: (r) => <StatusBadge status={r.statut} /> },
    { key: 'tauxTaxe', label: 'Taux Taxe (%)' },
    { key: 'assujettiTaxe', label: 'Assujetti Taxe', render: (r) => r.assujettiTaxe ? 'TRUE' : 'FALSE' },
    { key: 'suffixeCompte', label: 'Suffixe Compte' },
    { key: 'prefixeCompte', label: 'Préfixe Compte' },
    { key: 'tailleCompte', label: 'Taille Compte' },
    { key: 'calculCommission', label: 'Calcul Commission', render: (r) => r.calculCommission ? 'TRUE' : 'FALSE' },
    { key: 'dateCreation', label: 'Date Création', render: (r) => r.dateCreation ? new Date(r.dateCreation).toLocaleDateString('fr-FR') : '—' },
    {
      key: 'actions', label: 'Actions', sortable: false, render: (r) => (
        <div className="flex items-center gap-2">
          <button className="btn-icon" title="Modifier" onClick={() => openEdit(r)}><Pencil size={15} /></button>
          <button className="btn-icon text-red-500" title="Supprimer" onClick={() => handleDelete(r)}><Trash2 size={15} /></button>
        </div>
      )
    },
  ];

  return (
    <div className="panel">
      <div className="panel-header">
        <div className="panel-title">IMF Management</div>
        <button className="btn btn-primary" onClick={openCreate}>+ Create IMF</button>
      </div>

      {notice && <div className="error-banner" style={{ background: '#dcfce7', color: '#16a34a' }}>{notice}</div>}

      <div className="toolbar">
        <input className="search-input" placeholder="Search IMF…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <ExportDropdown filename="IMF" columns={columns.filter((c) => c.key !== 'actions')} rows={filtered} />
      </div>

      <DataTable columns={columns} rows={filtered} loading={loading} totalLabel={`TOTAL IMF: ${filtered.length}`} />

      {showModal && (
        <Modal title={editing ? 'Edit IMF' : 'Create IMF'} onClose={() => setShowModal(false)} footer={
          <>
            <button className="btn btn-outline" onClick={() => setShowModal(false)}>Annuler</button>
            <button className="btn btn-primary" form="imf-form" type="submit">Créer</button>
          </>
        }>
          <form id="imf-form" onSubmit={handleSubmit} style={{ display: 'contents' }}>
            <div className="form-row">
              <div className="form-group"><label>Code IMF</label><input required disabled={!!editing} value={form.codeIMF} onChange={(e) => setForm({ ...form, codeIMF: e.target.value })} placeholder="IMF001" /></div>
              <div className="form-group"><label>Libellé</label><input required value={form.libelle} onChange={(e) => setForm({ ...form, libelle: e.target.value })} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Taux Taxe (%)</label><input type="number" step="0.01" value={form.tauxTaxe} onChange={(e) => setForm({ ...form, tauxTaxe: Number(e.target.value) })} /></div>
              <div className="form-group">
                <label>Assujetti Taxe</label>
                <select value={form.assujettiTaxe ? 'true' : 'false'} onChange={(e) => setForm({ ...form, assujettiTaxe: e.target.value === 'true' })}>
                  <option value="false">FALSE</option>
                  <option value="true">TRUE</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Préfixe Compte</label><input value={form.prefixeCompte} onChange={(e) => setForm({ ...form, prefixeCompte: e.target.value })} /></div>
              <div className="form-group"><label>Suffixe Compte</label><input value={form.suffixeCompte} onChange={(e) => setForm({ ...form, suffixeCompte: e.target.value })} /></div>
            </div>
            <div className="form-group"><label>Taille Compte</label><input type="number" value={form.tailleCompte} onChange={(e) => setForm({ ...form, tailleCompte: Number(e.target.value) })} /></div>
          </form>
        </Modal>
      )}
    </div>
  );
}
