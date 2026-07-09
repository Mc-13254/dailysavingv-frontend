import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  History, Receipt, CalendarCheck, UserCog, Users, Wallet, FileText,
  Percent, Wallet2, Building2, ScrollText, ArrowRight,
} from 'lucide-react';
import { ReportsAPI } from '../api/endpoints';

const fmt = (n) => new Intl.NumberFormat('fr-FR').format(n || 0);

const REPORTS = [
  { to: '/reports/transaction-history', label: 'Transaction History', icon: History, statKey: 'transactions_today', ready: true },
  { to: '/reports/receipts', label: 'Receipts', icon: Receipt, ready: false },
  { to: '/reports/daily-collections', label: 'Daily Collection Reports', icon: CalendarCheck, ready: false },
  { to: '/collector-performance', label: 'Collector Reports', icon: UserCog, ready: true },
  { to: '/reports/clients', label: 'Client Reports', icon: Users, ready: true },
  { to: '/reports/accounts', label: 'Account Reports', icon: Wallet, ready: true },
  { to: '/reports/contracts', label: 'Contract Reports', icon: FileText, ready: true },
  { to: '/reports/commissions', label: 'Commission Reports', icon: Percent, ready: false },
  { to: '/reports/cash-sessions', label: 'Cash Session Reports', icon: Wallet2, ready: true },
  { to: '/reports/agencies', label: 'Agency Reports', icon: Building2, ready: false },
  { to: '/reports/financial', label: 'Financial Reports', icon: FileText, ready: false },
  { to: '/reports/audit', label: 'Audit Reports', icon: ScrollText, ready: false },
];

export default function ReportCenter() {
  const [cards, setCards] = useState([]);

  useEffect(() => {
    ReportsAPI.center().then(({ data }) => setCards(data)).catch(() => setCards([]));
  }, []);

  const findStat = (key) => cards.find((c) => c.key === key);

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <div className="panel-title">Report Center</div>
          <div className="panel-subtitle">Point d'entrée centralisé vers tous les rapports du système.</div>
        </div>
      </div>

      <div className="kpi-grid mb-5">
        {cards.map((c) => (
          <div key={c.key} className="kpi-card">
            <div className="kpi-label">{c.label}</div>
            <div className="kpi-value">{fmt(c.count)}</div>
            {c.amount != null && <div className="text-xs text-gray-400">{fmt(c.amount)}</div>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {REPORTS.map(({ to, label, icon: Icon, statKey, ready }) => {
          const stat = statKey ? findStat(statKey) : null;
          const Wrapper = ready ? Link : 'div';
          return (
            <Wrapper key={to} to={ready ? to : undefined} className={`form-card flex items-center gap-3 ${ready ? 'hover:shadow-md hover:border-blue-200 cursor-pointer transition' : 'opacity-60'}`}>
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-brand-blue flex items-center justify-center shrink-0">
                <Icon size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm">{label}</div>
                <div className="text-xs text-gray-400 normal-case">
                  {ready ? (stat ? `${fmt(stat.count)} aujourd'hui` : 'Disponible') : 'Bientôt disponible'}
                </div>
              </div>
              {ready && <ArrowRight size={16} className="text-gray-300 shrink-0" />}
            </Wrapper>
          );
        })}
      </div>
    </div>
  );
}
