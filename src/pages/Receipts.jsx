import { useEffect, useState } from 'react';
import { Printer } from 'lucide-react';
import DataTable from '../components/DataTable';
import ExportDropdown from '../components/ExportDropdown';
import { ReportsAPI } from '../api/endpoints';

const fmt = (n) => new Intl.NumberFormat('fr-FR').format(n || 0);
const TYPE_LABELS = { DAILY_COLLECTION: 'Collecte', DEPOSIT: 'Dépôt', WITHDRAWAL: 'Retrait', TRANSFER: 'Transfert', LOAN_PAYMENT: 'Remb. prêt' };

export default function Receipts() {
  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const params = search ? { search } : {};
      const [{ data: list }, { data: st }] = await Promise.all([ReportsAPI.receipts(params), ReportsAPI.receiptStats()]);
      setRows(list);
      setStats(st);
    } catch { setRows([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line

  const printReceipt = (r) => {
    const w = window.open('', '_blank', 'width=400,height=600');
    w.document.write(`
      <html><head><title>Reçu ${r.receiptNumber}</title>
      <style>body{font-family:monospace;padding:20px;font-size:13px} h2{text-align:center} table{width:100%} td{padding:2px 0}</style>
      </head><body>
      <h2>Reçu ${r.receiptNumber}</h2>
      <table>
        <tr><td>Type</td><td style="text-align:right">${TYPE_LABELS[r.transactionType] || r.transactionType}</td></tr>
        <tr><td>Client</td><td style="text-align:right">${r.clientName}</td></tr>
        <tr><td>Collecteur</td><td style="text-align:right">${r.collectorName || '—'}</td></tr>
        <tr><td>Agence</td><td style="text-align:right">${r.agenceNom}</td></tr>
        <tr><td>Montant</td><td style="text-align:right"><strong>${fmt(r.montant)}</strong></td></tr>
        <tr><td>Mode</td><td style="text-align:right">${r.paymentMethod || '—'}</td></tr>
        <tr><td>Date</td><td style="text-align:right">${new Date(r.dateTransaction).toLocaleString('fr-FR')}</td></tr>
      </table>
      <p style="text-align:center;margin-top:20px">Merci pour votre confiance.</p>
      </body></html>
    `);
    w.document.close();
    w.print();
  };

  const columns = [
    { key: 'receiptNumber', label: 'N° Reçu' },
    { key: 'transactionType', label: 'Type', render: (r) => TYPE_LABELS[r.transactionType] || r.transactionType },
    { key: 'clientName', label: 'Client' },
    { key: 'collectorName', label: 'Collecteur', render: (r) => r.collectorName || '—' },
    { key: 'agenceNom', label: 'Agence' },
    { key: 'montant', label: 'Montant', render: (r) => fmt(r.montant) },
    { key: 'paymentMethod', label: 'Mode', render: (r) => r.paymentMethod || '—' },
    { key: 'dateTransaction', label: 'Date', render: (r) => new Date(r.dateTransaction).toLocaleString('fr-FR') },
    { key: 'actions', label: 'Actions', sortable: false, render: (r) => <button className="btn-icon" title="Imprimer" onClick={() => printReceipt(r)}><Printer size={15} /></button> },
  ];

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <div className="panel-title">Receipts</div>
          <div className="panel-subtitle">Reçus générés automatiquement à chaque transaction validée — consultables et réimprimables à tout moment.</div>
        </div>
      </div>

      {stats && (
        <div className="kpi-grid mb-4">
          <div className="kpi-card"><div className="kpi-label">Reçus aujourd'hui</div><div className="kpi-value">{stats.todayReceipts}</div></div>
          <div className="kpi-card"><div className="kpi-label">Total reçus</div><div className="kpi-value">{stats.totalReceipts}</div></div>
        </div>
      )}

      <div className="toolbar flex-wrap gap-2">
        <input className="search-input" placeholder="N° reçu, client…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <button className="btn btn-outline" onClick={load}>Filtrer</button>
        <ExportDropdown filename="RECEIPTS" columns={columns.filter((c) => c.key !== 'actions')} rows={rows} />
      </div>

      <DataTable columns={columns} rows={rows} loading={loading} totalLabel={`TOTAL: ${rows.length}`} />
    </div>
  );
}
