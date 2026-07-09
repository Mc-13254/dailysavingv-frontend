import { useEffect, useState } from 'react';
import { PlayCircle, StopCircle, History as HistoryIcon } from 'lucide-react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import WideModal from '../components/WideModal';
import StatusBadge from '../components/StatusBadge';
import DenominationCounter, { denominationCountsToPayload, denominationTotal } from '../components/DenominationCounter';
import { CashSessionAPI } from '../api/endpoints';

const fmt = (n) => new Intl.NumberFormat('fr-FR').format(n || 0);

export default function CashSessionManagement() {
  const [session, setSession] = useState(undefined); // undefined = loading, null = no open session
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [showOpen, setShowOpen] = useState(false);
  const [openingCash, setOpeningCash] = useState('');
  const [openComment, setOpenComment] = useState('');

  const [showClose, setShowClose] = useState(false);
  const [physicalCash, setPhysicalCash] = useState('');
  const [closeCashCounts, setCloseCashCounts] = useState({});
  const [closeComment, setCloseComment] = useState('');
  const [varianceReason, setVarianceReason] = useState('');

  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await CashSessionAPI.current();
      setSession(data);
      if (data) {
        const { data: dash } = await CashSessionAPI.dashboard();
        setDashboard(dash);
      } else {
        setDashboard(null);
      }
    } catch { setSession(null); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleOpen = async () => {
    setError('');
    try {
      await CashSessionAPI.open({ openingCashOverride: openingCash ? Number(openingCash) : null, comment: openComment || null });
      setShowOpen(false);
      setNotice('Session de caisse ouverte.');
      load();
    } catch (e) {
      setError(e?.response?.data?.message || "Échec de l'ouverture de session.");
    }
  };

  const handleClose = async () => {
    setError('');
    const countedTotal = denominationTotal(closeCashCounts);
    const finalPhysicalCash = countedTotal > 0 ? countedTotal : Number(physicalCash);
    if (!finalPhysicalCash) { setError('Comptez la caisse (billets/pièces) ou indiquez le montant physique.'); return; }
    try {
      await CashSessionAPI.close({
        physicalCash: finalPhysicalCash,
        physicalCashBreakdown: denominationCountsToPayload(closeCashCounts),
        comment: closeComment || null,
        varianceReason: varianceReason || null,
      });
      setShowClose(false);
      setNotice('Session de caisse clôturée.');
      load();
    } catch (e) {
      setError(e?.response?.data?.message || 'Échec de la clôture de session.');
    }
  };

  const openHistory = async () => {
    const { data } = await CashSessionAPI.history({});
    setHistory(data);
    setShowHistory(true);
  };

  const historyColumns = [
    { key: 'sessionNumber', label: 'N° Session' },
    { key: 'userFullName', label: 'Utilisateur' },
    { key: 'openingDate', label: 'Ouverture', render: (r) => new Date(r.openingDate).toLocaleString('fr-FR') },
    { key: 'closingDate', label: 'Clôture', render: (r) => r.closingDate ? new Date(r.closingDate).toLocaleString('fr-FR') : '—' },
    { key: 'openingCash', label: 'Caisse ouverture', render: (r) => fmt(r.openingCash) },
    { key: 'expectedCash', label: 'Attendu', render: (r) => r.expectedCash != null ? fmt(r.expectedCash) : '—' },
    { key: 'physicalCash', label: 'Physique', render: (r) => r.physicalCash != null ? fmt(r.physicalCash) : '—' },
    {
      key: 'cashDifference', label: 'Écart', render: (r) => r.cashDifference != null ? (
        <span className={r.cashDifference === 0 ? 'text-emerald-600' : 'text-red-600'}>{fmt(r.cashDifference)}</span>
      ) : '—'
    },
    { key: 'status', label: 'Statut', render: (r) => <StatusBadge status={r.status} /> },
  ];

  if (loading) return <div className="panel"><div className="empty-state">Chargement…</div></div>;

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <div className="panel-title">Cash Session Management</div>
          <div className="panel-subtitle">Aucune opération financière n'est possible sans session de caisse ouverte.</div>
        </div>
        <button className="btn btn-outline" onClick={openHistory}><HistoryIcon size={14} /> Historique</button>
      </div>

      {notice && <div className="mb-3 text-xs text-green-700 bg-green-50 px-3 py-2 rounded normal-case">{notice}</div>}

      {!session ? (
        <div className="form-card text-center py-10">
          <p className="text-sm text-gray-600 normal-case mb-4">Vous n'avez pas de session de caisse ouverte aujourd'hui.</p>
          <button className="btn btn-primary" onClick={() => { setOpeningCash(''); setOpenComment(''); setError(''); setShowOpen(true); }}>
            <PlayCircle size={16} /> Ouvrir ma session de caisse
          </button>
        </div>
      ) : (
        <>
          <div className="kpi-grid mb-4">
            <div className="kpi-card"><div className="kpi-label">Caisse d'ouverture</div><div className="kpi-value">{fmt(session.openingCash)}</div></div>
            <div className="kpi-card"><div className="kpi-label">Caisse actuelle (calculée)</div><div className="kpi-value accent">{fmt(dashboard?.currentCash)}</div></div>
            <div className="kpi-card"><div className="kpi-label">Collectes</div><div className="kpi-value">{fmt(dashboard?.collections)} <span className="text-xs text-gray-400">({dashboard?.collectionsCount})</span></div></div>
            <div className="kpi-card"><div className="kpi-label">Dépôts</div><div className="kpi-value">{fmt(dashboard?.deposits)} <span className="text-xs text-gray-400">({dashboard?.depositsCount})</span></div></div>
            <div className="kpi-card"><div className="kpi-label">Retraits</div><div className="kpi-value">{fmt(dashboard?.withdrawals)} <span className="text-xs text-gray-400">({dashboard?.withdrawalsCount})</span></div></div>
            <div className="kpi-card"><div className="kpi-label">Transferts</div><div className="kpi-value">{fmt(dashboard?.transfers)} <span className="text-xs text-gray-400">({dashboard?.transfersCount})</span></div></div>
            <div className="kpi-card"><div className="kpi-label">Commission générée</div><div className="kpi-value accent">{fmt(dashboard?.commissionGenerated)}</div></div>
            <div className="kpi-card"><div className="kpi-label">Statut</div><div className="kpi-value"><StatusBadge status={session.status} /></div></div>
          </div>

          <div className="form-card">
            <div className="form-card-title">Session en cours — {session.sessionNumber}</div>
            <p className="text-xs text-gray-500 normal-case mb-3">Ouverte le {new Date(session.openingDate).toLocaleString('fr-FR')} par {session.userFullName}</p>
            <button className="btn btn-danger" onClick={() => { setPhysicalCash(''); setCloseCashCounts({}); setCloseComment(''); setVarianceReason(''); setError(''); setShowClose(true); }}>
              <StopCircle size={16} /> Clôturer ma session de caisse
            </button>
          </div>
        </>
      )}

      {showOpen && (
        <Modal title="Ouvrir la session de caisse" onClose={() => setShowOpen(false)} footer={
          <>
            <button className="btn btn-outline" onClick={() => setShowOpen(false)}>Annuler</button>
            <button className="btn btn-primary" onClick={handleOpen}>Ouvrir la session</button>
          </>
        }>
          {error && <div className="error-banner">{error}</div>}
          <div className="form-group">
            <label>Caisse d'ouverture (laisser vide pour reprendre la clôture d'hier)</label>
            <input type="number" value={openingCash} onChange={(e) => setOpeningCash(e.target.value)} placeholder="0" />
          </div>
          <div className="form-group">
            <label>Commentaire</label>
            <textarea value={openComment} onChange={(e) => setOpenComment(e.target.value)} />
          </div>
        </Modal>
      )}

      {showClose && (
        <WideModal title="Clôturer la session de caisse" onClose={() => setShowClose(false)} footer={
          <>
            <button className="btn btn-outline" onClick={() => setShowClose(false)}>Annuler</button>
            <button className="btn btn-primary" onClick={handleClose}>Clôturer</button>
          </>
        }>
          {error && <div className="error-banner">{error}</div>}
          <p className="text-xs text-gray-600 normal-case mb-3">Caisse attendue (calculée) : <strong>{fmt(dashboard?.currentCash)}</strong></p>

          <DenominationCounter counts={closeCashCounts} onChange={setCloseCashCounts} />

          <div className="form-group mt-3">
            <label>Montant physique compté {denominationTotal(closeCashCounts) > 0 ? '(calculé depuis le détail ci-dessus)' : '*'}</label>
            <input
              type="number"
              required={denominationTotal(closeCashCounts) === 0}
              disabled={denominationTotal(closeCashCounts) > 0}
              value={denominationTotal(closeCashCounts) > 0 ? denominationTotal(closeCashCounts) : physicalCash}
              onChange={(e) => setPhysicalCash(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Motif de l'écart (si applicable)</label>
            <input value={varianceReason} onChange={(e) => setVarianceReason(e.target.value)} placeholder="ex: erreur de rendu monnaie" />
          </div>
          <div className="form-group">
            <label>Commentaire</label>
            <textarea value={closeComment} onChange={(e) => setCloseComment(e.target.value)} />
          </div>
        </WideModal>
      )}

      {showHistory && (
        <WideModal title="Historique des sessions de caisse" onClose={() => setShowHistory(false)}>
          <DataTable columns={historyColumns} rows={history} loading={false} />
        </WideModal>
      )}
    </div>
  );
}
