import { useEffect, useState } from 'react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import { IMFAPI } from '../api/endpoints';

const emptyForm = { codeIMF: '', libelle: '', tauxTaxe: 0, assujettiTaxe: false, suffixeCompte: '', prefixeCompte: '', tailleCompte: 10, calculCommission: true };

export default function IMFManagement() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');

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

  const handleCreate = async (e) => {
    e.preventDefault();
    await IMFAPI.create(form);
    setShowModal(false);
    setForm(emptyForm);
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
  ];

  return (
    <div className="panel">
      <div className="panel-header">
        <div className="panel-title">IMF Management</div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Create IMF</button>
      </div>

      <div className="toolbar">
        <input className="search-input" placeholder="Search IMF…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <button className="btn btn-outline">⬇ Export</button>
      </div>

      <DataTable columns={columns} rows={filtered} loading={loading} totalLabel={`TOTAL IMF: ${filtered.length}`} />

      {showModal && (
        <Modal title="Create IMF" onClose={() => setShowModal(false)} footer={
          <>
            <button className="btn btn-outline" onClick={() => setShowModal(false)}>Annuler</button>
            <button className="btn btn-primary" form="imf-form" type="submit">Créer</button>
          </>
        }>
          <form id="imf-form" onSubmit={handleCreate} style={{ display: 'contents' }}>
            <div className="form-row">
              <div className="form-group"><label>Code IMF</label><input required value={form.codeIMF} onChange={(e) => setForm({ ...form, codeIMF: e.target.value })} placeholder="IMF001" /></div>
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
