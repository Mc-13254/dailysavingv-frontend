import { useEffect, useState } from 'react';
import { ReportsAPI } from '../api/endpoints';

const fmt = (n) => new Intl.NumberFormat('fr-FR').format(n || 0);

export default function FinancialReports() {
  const [summary, setSummary] = useState(null);
  const [trend, setTrend] = useState([]);
  const [filters, setFilters] = useState({ from: '', to: '' });

  const load = async () => {
    const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
    const [{ data: s }, { data: t }] = await Promise.all([
      ReportsAPI.financialSummary(params),
      ReportsAPI.financialTrend(14),
    ]);
    setSummary(s);
    setTrend(t);
  };

  useEffect(() => { load(); }, []); // eslint-disable-line

  const maxTrend = Math.max(1, ...trend.map((t) => t.collections + t.deposits + t.withdrawals + t.transfers));

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <div className="panel-title">Financial Reports</div>
          <div className="panel-subtitle">Synthèse financière exécutive — collectes, dépôts, retraits, transferts, commission, trésorerie.</div>
        </div>
      </div>

      <div className="toolbar flex-wrap gap-2 mb-2">
        <input type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} />
        <input type="date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} />
        <button className="btn btn-outline" onClick={load}>Filtrer</button>
      </div>

      {summary && (
        <div className="kpi-grid mb-4">
          <div className="kpi-card"><div className="kpi-label">Collectes</div><div className="kpi-value">{fmt(summary.totalCollections)}</div></div>
          <div className="kpi-card"><div className="kpi-label">Dépôts</div><div className="kpi-value">{fmt(summary.totalDeposits)}</div></div>
          <div className="kpi-card"><div className="kpi-label">Retraits</div><div className="kpi-value">{fmt(summary.totalWithdrawals)}</div></div>
          <div className="kpi-card"><div className="kpi-label">Transferts</div><div className="kpi-value">{fmt(summary.totalTransfers)}</div></div>
          <div className="kpi-card"><div className="kpi-label">Flux net de trésorerie</div><div className="kpi-value accent">{fmt(summary.netCashFlow)}</div></div>
          <div className="kpi-card"><div className="kpi-label">Caisse actuelle (sessions ouvertes)</div><div className="kpi-value">{fmt(summary.currentCashBalance)}</div></div>
          <div className="kpi-card"><div className="kpi-label">Commission totale versée</div><div className="kpi-value">{fmt(summary.totalCommissionPaid)}</div></div>
          <div className="kpi-card"><div className="kpi-label">Nb transactions</div><div className="kpi-value">{summary.transactionCount}</div></div>
          <div className="kpi-card"><div className="kpi-label">Collecte moyenne / jour</div><div className="kpi-value">{fmt(summary.averageDailyCollection)}</div></div>
          <div className="kpi-card"><div className="kpi-label">Revenu aujourd'hui</div><div className="kpi-value">{fmt(summary.todayRevenue)}</div></div>
          <div className="kpi-card"><div className="kpi-label">Sorties aujourd'hui</div><div className="kpi-value">{fmt(summary.todayExpenses)}</div></div>
        </div>
      )}

      <div className="form-card">
        <div className="form-card-title">Tendance sur 14 jours</div>
        <div className="flex items-end gap-1 mt-3" style={{ height: 160 }}>
          {trend.map((t, i) => {
            const total = t.collections + t.deposits + t.withdrawals + t.transfers;
            const h = Math.max(2, (total / maxTrend) * 140);
            return (
              <div key={i} className="flex-1 flex flex-col items-center justify-end" title={`${t.label}: ${fmt(total)}`}>
                <div className="w-full bg-brand-blue/70 rounded-t" style={{ height: h }} />
                <div className="text-[9px] text-gray-400 mt-1 rotate-0">{t.label}</div>
              </div>
            );
          })}
        </div>
        <p className="text-[11px] text-gray-400 normal-case mt-2">Total quotidien (collectes + dépôts + retraits + transferts).</p>
      </div>
    </div>
  );
}
