import { useEffect, useState } from 'react';
import { Eye, ShieldAlert } from 'lucide-react';
import DataTable from '../components/DataTable';
import WideModal from '../components/WideModal';
import ExportDropdown from '../components/ExportDropdown';
import { FraudAPI } from '../api/endpoints';

const fmt = (n) => new Intl.NumberFormat('fr-FR').format(n || 0);
const fmtDate = (d) => d ? new Date(d).toLocaleString('fr-FR') : '—';

const RISK_COLORS = { LOW: 'badge-success', MEDIUM: 'badge-warning', HIGH: 'badge-danger', CRITICAL: 'badge-danger' };

export default function FraudDetection() {
  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [riskLevel, setRiskLevel] = useState('');
  const [reviewStatus, setReviewStatus] = useState('');
  const [detail, setDetail] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (riskLevel) params.riskLevel = riskLevel;
      if (reviewStatus) params.reviewStatus = reviewStatus;
      const [{ data: list }, { data: st }] = await Promise.all([FraudAPI.transactions(params), FraudAPI.stats()]);
      setRows(list); setStats(st);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line
  useEffect(() => { load(); }, [riskLevel, reviewStatus]); // eslint-disable-line

  const openDetail = async (row) => {
    const { data } = await FraudAPI.detail(row.fraudDetectionID);
    setDetail(data);
  };

  const review = async (status) => {
    const comment = window.prompt(status === 'CONFIRMED_FRAUD' ? 'Commentaire (confirmation de fraude) ?' : 'Commentaire (transaction disculpée) ?') || '';
    await FraudAPI.review(detail.fraudDetectionID, status, comment);
    setDetail(null);
    load();
  };

  const columns = [
    { key: 'receiptNumber', label: 'N° Reçu', render: (r) => r.receiptNumber || '—' },
    { key: 'transactionType', label: 'Type' },
    { key: 'clientName', label: 'Client' },
    { key: 'collectorName', label: 'Collecteur', render: (r) => r.collectorName || '—' },
    { key: 'agenceNom', label: 'Agence' },
    { key: 'montant', label: 'Montant', render: (r) => fmt(r.montant) },
    { key: 'score', label: 'Score', render: (r) => <span className={`badge ${RISK_COLORS[r.riskLevel]}`}>{r.score}/100</span> },
    { key: 'riskLevel', label: 'Risque', render: (r) => r.riskLevel },
    { key: 'reviewStatus', label: 'Revue', render: (r) => r.reviewStatus },
    { key: 'createdDate', label: 'Date', render: (r) => fmtDate(r.createdDate) },
    { key: 'actions', label: 'Actions', sortable: false, render: (r) => <button className="btn-icon" onClick={() => openDetail(r)}><Eye size={15} /></button> },
  ];

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <div className="panel-title flex items-center gap-2"><ShieldAlert size={18} className="text-red-500" /> Fraud Detection</div>
          <div className="panel-subtitle">Score de risque transparent (règles pondérées explicables) sur chaque transaction — pas un modèle boîte noire.</div>
        </div>
      </div>

      {stats && (
        <div className="kpi-grid mb-4">
          <div className="kpi-card"><div className="kpi-label">Signalées aujourd'hui</div><div className="kpi-value text-red-600">{stats.todayFlagged}</div></div>
          <div className="kpi-card"><div className="kpi-label">En attente de revue</div><div className="kpi-value">{stats.pendingReview}</div></div>
          <div className="kpi-card"><div className="kpi-label">Critiques</div><div className="kpi-value text-red-600">{stats.totalCritical}</div></div>
          <div className="kpi-card"><div className="kpi-label">Élevées</div><div className="kpi-value text-amber-600">{stats.totalHigh}</div></div>
          <div className="kpi-card"><div className="kpi-label">Score moyen</div><div className="kpi-value">{stats.averageScore?.toFixed(1)}</div></div>
          <div className="kpi-card"><div className="kpi-label">Fraude confirmée</div><div className="kpi-value">{stats.confirmedFraudCount}</div></div>
          <div className="kpi-card"><div className="kpi-label">Disculpées</div><div className="kpi-value">{stats.clearedCount}</div></div>
        </div>
      )}

      <div className="toolbar flex-wrap gap-2">
        <select value={riskLevel} onChange={(e) => setRiskLevel(e.target.value)}>
          <option value="">Tous les niveaux</option>
          <option value="LOW">Faible</option>
          <option value="MEDIUM">Moyen</option>
          <option value="HIGH">Élevé</option>
          <option value="CRITICAL">Critique</option>
        </select>
        <select value={reviewStatus} onChange={(e) => setReviewStatus(e.target.value)}>
          <option value="">Tous les statuts</option>
          <option value="PENDING">En attente</option>
          <option value="CLEARED">Disculpée</option>
          <option value="CONFIRMED_FRAUD">Fraude confirmée</option>
          <option value="NONE">Non signalée</option>
        </select>
        <ExportDropdown filename="FRAUD_DETECTION" columns={columns.filter((c) => c.key !== 'actions')} rows={rows} />
      </div>

      <DataTable columns={columns} rows={rows} loading={loading} totalLabel={`TOTAL: ${rows.length}`} />

      {detail && (
        <WideModal title={`Analyse de risque — ${detail.receiptNumber || '#' + detail.transactionID}`} onClose={() => setDetail(null)}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div className="form-card">
              <div className="form-card-title">Transaction</div>
              <p className="text-xs normal-case space-y-1">
                <div>Client: <strong>{detail.clientName}</strong></div>
                <div>Collecteur: {detail.collectorName || '—'}</div>
                <div>Agence: {detail.agenceNom}</div>
                <div>Montant: {fmt(detail.montant)}</div>
                <div>Date: {fmtDate(detail.dateTransaction)}</div>
              </p>
            </div>
            <div className="form-card">
              <div className="form-card-title">Score de risque</div>
              <div className="text-3xl font-bold text-center mt-2">
                <span className={`badge ${RISK_COLORS[detail.riskLevel]}`} style={{ fontSize: 20, padding: '6px 14px' }}>{detail.score}/100</span>
              </div>
              <div className="text-center text-sm mt-1">{detail.riskLevel}</div>
            </div>
            <div className="form-card">
              <div className="form-card-title">Revue</div>
              <p className="text-xs normal-case">Statut: <strong>{detail.reviewStatus}</strong></p>
              {detail.reviewedBy && <p className="text-xs normal-case">Par {detail.reviewedBy} le {fmtDate(detail.reviewDate)}</p>}
              {detail.reviewComment && <p className="text-xs normal-case text-gray-500">"{detail.reviewComment}"</p>}
              {detail.reviewStatus === 'PENDING' && (
                <div className="flex gap-2 mt-2">
                  <button className="btn btn-primary btn-sm" onClick={() => review('CLEARED')}>Disculper</button>
                  <button className="btn btn-danger btn-sm" onClick={() => review('CONFIRMED_FRAUD')}>Confirmer fraude</button>
                </div>
              )}
            </div>
          </div>

          <div className="form-card">
            <div className="form-card-title">Facteurs de risque déclenchés ({detail.factors.length})</div>
            {detail.factors.length === 0 ? <p className="text-xs text-gray-400 normal-case mt-2">Aucun facteur de risque détecté.</p> : (
              <table className="w-full text-xs mt-2">
                <thead><tr className="text-left text-gray-400"><th>Règle</th><th>Poids</th><th>Explication</th></tr></thead>
                <tbody>
                  {detail.factors.map((f, i) => (
                    <tr key={i}><td className="font-mono">{f.rule}</td><td>+{f.weight}</td><td className="normal-case">{f.description}</td></tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </WideModal>
      )}
    </div>
  );
}
