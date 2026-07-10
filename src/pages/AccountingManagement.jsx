import { useEffect, useState } from 'react';
import Modal from '../components/Modal';
import { AccountingAPI } from '../api/endpoints';

const fmt = (n) => new Intl.NumberFormat('fr-FR').format(n || 0);
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';

const TABS = [
  { key: 'trial', label: 'Trial Balance' },
  { key: 'gl', label: 'General Ledger' },
  { key: 'bs', label: 'Balance Sheet' },
  { key: 'pl', label: 'Profit & Loss' },
  { key: 'cb', label: 'Cash Book' },
  { key: 'cf', label: 'Cash Flow' },
  { key: 'admin', label: 'Administration' },
];

function Balanced({ ok }) {
  return <span className={`badge ${ok ? 'badge-success' : 'badge-danger'}`}>{ok ? 'Équilibré ✓' : 'DÉSÉQUILIBRÉ ⚠'}</span>;
}

export default function AccountingManagement() {
  const [tab, setTab] = useState('trial');
  const [accounts, setAccounts] = useState([]);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('');

  const [trial, setTrial] = useState(null);
  const [gl, setGl] = useState(null);
  const [bs, setBs] = useState(null);
  const [pl, setPl] = useState(null);
  const [cb, setCb] = useState(null);
  const [cf, setCf] = useState(null);
  const [periods, setPeriods] = useState([]);
  const [manualEntries, setManualEntries] = useState([]);
  const [activityLog, setActivityLog] = useState([]);
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [entryForm, setEntryForm] = useState({ entryType: 'MANUAL', description: '', lines: [{ glAccountID: '', debit: '', credit: '', description: '' }] });
  const [entryError, setEntryError] = useState('');
  const [closeYear, setCloseYear] = useState(new Date().getFullYear());
  const [closeMonth, setCloseMonth] = useState(new Date().getMonth() + 1);

  useEffect(() => { AccountingAPI.chartOfAccounts().then(({ data }) => { setAccounts(data); if (data.length) setSelectedAccount(data[0].glAccountID); }); }, []);

  const params = () => Object.fromEntries(Object.entries({ from, to }).filter(([, v]) => v));

  const load = async () => {
    if (tab === 'trial') setTrial((await AccountingAPI.trialBalance(params())).data);
    if (tab === 'gl' && selectedAccount) setGl((await AccountingAPI.generalLedger(selectedAccount, params())).data);
    if (tab === 'bs') setBs((await AccountingAPI.balanceSheet(to ? { asOf: to } : {})).data);
    if (tab === 'pl') setPl((await AccountingAPI.profitAndLoss(params())).data);
    if (tab === 'cb') setCb((await AccountingAPI.cashBook(params())).data);
    if (tab === 'cf') setCf((await AccountingAPI.cashFlow(params())).data);
    if (tab === 'admin') {
      setPeriods((await AccountingAPI.periods()).data);
      setManualEntries((await AccountingAPI.manualEntries({})).data);
      setActivityLog((await AccountingAPI.activityLog({})).data);
    }
  };

  useEffect(() => { load(); }, [tab, selectedAccount]); // eslint-disable-line

  const closePeriod = async () => {
    if (!window.confirm(`Clôturer la période ${closeYear}-${String(closeMonth).padStart(2, '0')} ? Aucune écriture manuelle ne pourra plus y être ajoutée.`)) return;
    try {
      await AccountingAPI.closePeriod(closeYear, closeMonth);
      load();
    } catch (err) { alert(err?.response?.data?.message || 'Échec.'); }
  };

  const reopenPeriod = async (p) => {
    if (!window.confirm(`Rouvrir la période ${p.year}-${String(p.month).padStart(2, '0')} ?`)) return;
    await AccountingAPI.reopenPeriod(p.year, p.month);
    load();
  };

  const addLine = () => setEntryForm({ ...entryForm, lines: [...entryForm.lines, { glAccountID: '', debit: '', credit: '', description: '' }] });
  const updateLine = (i, field, value) => {
    const lines = [...entryForm.lines];
    lines[i] = { ...lines[i], [field]: value };
    setEntryForm({ ...entryForm, lines });
  };
  const removeLine = (i) => setEntryForm({ ...entryForm, lines: entryForm.lines.filter((_, idx) => idx !== i) });

  const submitManualEntry = async () => {
    setEntryError('');
    try {
      await AccountingAPI.createManualEntry({
        entryType: entryForm.entryType,
        description: entryForm.description,
        lines: entryForm.lines.map((l) => ({ glAccountID: Number(l.glAccountID), debit: Number(l.debit) || 0, credit: Number(l.credit) || 0, description: l.description || null })),
      });
      setShowNewEntry(false);
      setEntryForm({ entryType: 'MANUAL', description: '', lines: [{ glAccountID: '', debit: '', credit: '', description: '' }] });
      load();
    } catch (err) {
      setEntryError(err?.response?.data?.message || 'Échec de la soumission.');
    }
  };

  const approveEntry = async (d) => {
    try {
      await AccountingAPI.approveManualEntry(d.manualJournalEntryDraftID);
      load();
    } catch (err) { alert(err?.response?.data?.message || 'Échec.'); }
  };
  const rejectEntry = async (d) => {
    const reason = window.prompt('Motif du rejet ?');
    if (!reason) return;
    await AccountingAPI.rejectManualEntry(d.manualJournalEntryDraftID, reason);
    load();
  };

  const lineTotal = (field) => entryForm.lines.reduce((sum, l) => sum + (Number(l[field]) || 0), 0);

  const reverseEntry = async (line) => {
    if (!window.confirm(`Contre-passer l'écriture ${line.entryNumber} ?`)) return;
    try {
      await AccountingAPI.reverseEntry(line.journalEntryID);
      load();
    } catch (err) { alert(err?.response?.data?.message || 'Échec.'); }
  };

  const AccountsTable = ({ rows }) => (
    <table className="w-full text-xs mt-2">
      <thead><tr className="text-left text-gray-400"><th>Code</th><th>Compte</th><th>Débit</th><th>Crédit</th><th>Solde</th></tr></thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.code}><td>{r.code}</td><td>{r.name}</td><td>{fmt(r.totalDebit)}</td><td>{fmt(r.totalCredit)}</td><td className="font-semibold">{fmt(r.balance)}</td></tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <div className="panel-title">Accounting Management</div>
          <div className="panel-subtitle">Comptabilité en partie double — plan comptable, écritures automatiques, états financiers.</div>
        </div>
      </div>

      <div className="toggle-group mb-3" style={{ flexWrap: 'wrap' }}>
        {TABS.map((t) => <button key={t.key} className={`toggle-btn${tab === t.key ? ' active' : ''}`} onClick={() => setTab(t.key)}>{t.label}</button>)}
      </div>

      <div className="toolbar flex-wrap gap-2 mb-3">
        {tab !== 'bs' && (
          <>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} placeholder="Du" />
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} placeholder="Au" />
          </>
        )}
        {tab === 'bs' && <input type="date" value={to} onChange={(e) => setTo(e.target.value)} placeholder="À la date du" />}
        {tab === 'gl' && (
          <select value={selectedAccount} onChange={(e) => setSelectedAccount(e.target.value)}>
            {accounts.map((a) => <option key={a.glAccountID} value={a.glAccountID}>{a.code} — {a.name}</option>)}
          </select>
        )}
        <button className="btn btn-outline" onClick={load}>Actualiser</button>
      </div>

      {tab === 'trial' && trial && (
        <div className="form-card">
          <div className="flex items-center justify-between mb-2">
            <div className="form-card-title">Balance générale</div>
            <Balanced ok={trial.isBalanced} />
          </div>
          <AccountsTable rows={trial.rows} />
          <div className="flex justify-between mt-3 pt-2 border-t text-sm font-bold">
            <span>Total Débit: {fmt(trial.totalDebit)}</span>
            <span>Total Crédit: {fmt(trial.totalCredit)}</span>
          </div>
        </div>
      )}

      {tab === 'gl' && gl && (
        <div className="form-card">
          <div className="form-card-title">{gl.accountCode} — {gl.accountName}</div>
          <p className="text-xs text-gray-500 normal-case">Solde d'ouverture: <strong>{fmt(gl.openingBalance)}</strong></p>
          <table className="w-full text-xs mt-2">
            <thead><tr className="text-left text-gray-400"><th>Date</th><th>N° Écriture</th><th>Description</th><th>Source</th><th>Débit</th><th>Crédit</th><th>Solde</th><th></th></tr></thead>
            <tbody>
              {gl.lines.map((l, i) => (
                <tr key={i}><td>{fmtDate(l.entryDate)}</td><td>{l.entryNumber}</td><td>{l.description}</td><td>{l.sourceType}</td><td>{fmt(l.debit)}</td><td>{fmt(l.credit)}</td><td className="font-semibold">{fmt(l.runningBalance)}</td>
                  <td><button className="text-[10px] text-gray-400 underline" onClick={() => reverseEntry(l)}>Contre-passer</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs text-gray-500 normal-case mt-2">Solde de clôture: <strong>{fmt(gl.closingBalance)}</strong></p>
        </div>
      )}

      {tab === 'bs' && bs && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500 normal-case">Au {fmtDate(bs.asOf)}</span>
            <Balanced ok={bs.isBalanced} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="form-card">
              <div className="form-card-title">{bs.assets.label}</div>
              <AccountsTable rows={bs.assets.accounts} />
              <div className="text-sm font-bold mt-2 pt-2 border-t">Total: {fmt(bs.assets.total)}</div>
            </div>
            <div className="form-card">
              <div className="form-card-title">{bs.liabilities.label}</div>
              <AccountsTable rows={bs.liabilities.accounts} />
              <div className="text-sm font-bold mt-2 pt-2 border-t">Total: {fmt(bs.liabilities.total)}</div>
              <div className="form-card-title mt-4">{bs.equity.label} (incl. résultat net {fmt(bs.netIncome)})</div>
              <AccountsTable rows={bs.equity.accounts} />
              <div className="text-sm font-bold mt-2 pt-2 border-t">Total: {fmt(bs.equity.total)}</div>
            </div>
          </div>
        </div>
      )}

      {tab === 'pl' && pl && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="form-card">
            <div className="form-card-title text-emerald-600">Revenus</div>
            <AccountsTable rows={pl.revenue} />
            <div className="text-sm font-bold mt-2 pt-2 border-t">Total Revenus: {fmt(pl.totalRevenue)}</div>
          </div>
          <div className="form-card">
            <div className="form-card-title text-red-600">Charges</div>
            <AccountsTable rows={pl.expenses} />
            <div className="text-sm font-bold mt-2 pt-2 border-t">Total Charges: {fmt(pl.totalExpenses)}</div>
          </div>
          <div className="form-card sm:col-span-2 text-center">
            <div className="text-xs text-gray-400">Résultat net ({fmtDate(pl.from)} — {fmtDate(pl.to)})</div>
            <div className={`text-2xl font-bold ${pl.netIncome >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{fmt(pl.netIncome)}</div>
          </div>
        </div>
      )}

      {tab === 'cb' && cb && (
        <div className="form-card">
          <div className="form-card-title">Livre de caisse</div>
          <p className="text-xs text-gray-500 normal-case">Solde d'ouverture: <strong>{fmt(cb.openingBalance)}</strong></p>
          <table className="w-full text-xs mt-2">
            <thead><tr className="text-left text-gray-400"><th>Date</th><th>N° Écriture</th><th>Description</th><th>Entrée</th><th>Sortie</th><th>Solde</th></tr></thead>
            <tbody>
              {cb.lines.map((l, i) => (
                <tr key={i}><td>{fmtDate(l.date)}</td><td>{l.entryNumber}</td><td>{l.description}</td><td>{fmt(l.in)}</td><td>{fmt(l.out)}</td><td className="font-semibold">{fmt(l.runningBalance)}</td></tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-between mt-3 pt-2 border-t text-sm font-bold">
            <span>Total entrées: {fmt(cb.totalIn)}</span>
            <span>Total sorties: {fmt(cb.totalOut)}</span>
            <span>Solde de clôture: {fmt(cb.closingBalance)}</span>
          </div>
        </div>
      )}

      {tab === 'cf' && cf && (
        <div className="form-card">
          <div className="form-card-title">Tableau des flux de trésorerie ({fmtDate(cf.from)} — {fmtDate(cf.to)})</div>
          <p className="text-xs text-gray-500 normal-case mt-2">Trésorerie d'ouverture: <strong>{fmt(cf.openingCash)}</strong></p>
          <table className="w-full text-xs mt-2">
            <thead><tr className="text-left text-gray-400"><th>Catégorie</th><th>Montant</th></tr></thead>
            <tbody>
              {cf.lines.map((l, i) => <tr key={i}><td>{l.label}</td><td className={l.amount >= 0 ? 'text-emerald-600' : 'text-red-600'}>{fmt(l.amount)}</td></tr>)}
            </tbody>
          </table>
          <div className="flex justify-between mt-3 pt-2 border-t text-sm font-bold">
            <span>Variation nette: {fmt(cf.netChange)}</span>
            <span>Trésorerie de clôture: {fmt(cf.closingCash)}</span>
          </div>
        </div>
      )}
      {tab === 'admin' && (
        <div className="space-y-4">
          <div className="form-card">
            <div className="form-card-title">Clôture de période fiscale</div>
            <div className="flex items-center gap-2 mt-2">
              <input type="number" className="w-24" value={closeYear} onChange={(e) => setCloseYear(Number(e.target.value))} />
              <select value={closeMonth} onChange={(e) => setCloseMonth(Number(e.target.value))}>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
              <button className="btn btn-primary btn-sm" onClick={closePeriod}>Clôturer</button>
            </div>
            <table className="w-full text-xs mt-3">
              <thead><tr className="text-left text-gray-400"><th>Période</th><th>Statut</th><th>Clôturé par</th><th>Date</th><th></th></tr></thead>
              <tbody>
                {periods.map((p) => (
                  <tr key={p.accountingPeriodID}>
                    <td>{p.year}-{String(p.month).padStart(2, '0')}</td>
                    <td>{p.isClosed ? <span className="badge badge-danger">Clôturée</span> : <span className="badge badge-success">Ouverte</span>}</td>
                    <td>{p.closedBy || '—'}</td><td>{fmtDate(p.closedDate)}</td>
                    <td>{p.isClosed && <button className="btn btn-outline btn-sm" onClick={() => reopenPeriod(p)}>Rouvrir</button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="form-card">
            <div className="flex items-center justify-between">
              <div className="form-card-title">Écritures manuelles / Contre-passations (Maker-Checker)</div>
              <button className="btn btn-primary btn-sm" onClick={() => setShowNewEntry(true)}>+ Nouvelle écriture</button>
            </div>
            <table className="w-full text-xs mt-2">
              <thead><tr className="text-left text-gray-400"><th>Type</th><th>Description</th><th>Demandé par</th><th>Date</th><th>Statut</th><th>Actions</th></tr></thead>
              <tbody>
                {manualEntries.map((d) => (
                  <tr key={d.manualJournalEntryDraftID}>
                    <td>{d.entryType}</td><td>{d.description}</td><td>{d.requestedBy}</td><td>{fmtDate(d.requestDate)}</td>
                    <td>{d.status}</td>
                    <td>
                      {d.status === 'PENDING' && (
                        <div className="flex gap-1">
                          <button className="btn btn-primary btn-sm" onClick={() => approveEntry(d)}>Approuver</button>
                          <button className="btn btn-danger btn-sm" onClick={() => rejectEntry(d)}>Rejeter</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="form-card">
            <div className="form-card-title">Journal d'activité comptable</div>
            <table className="w-full text-xs mt-2">
              <thead><tr className="text-left text-gray-400"><th>Date</th><th>Utilisateur</th><th>Action</th><th>Rapport</th><th>Détails</th></tr></thead>
              <tbody>
                {activityLog.map((l) => (
                  <tr key={l.accountingActivityLogID}><td>{fmtDate(l.actionDate)}</td><td>{l.codeUser}</td><td>{l.action}</td><td>{l.reportType || '—'}</td><td>{l.details || '—'}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showNewEntry && (
        <Modal title="Nouvelle écriture manuelle" onClose={() => setShowNewEntry(false)} footer={
          <>
            <button className="btn btn-outline" onClick={() => setShowNewEntry(false)}>Annuler</button>
            <button className="btn btn-primary" onClick={submitManualEntry}>Soumettre pour approbation</button>
          </>
        }>
          {entryError && <div className="error-banner mb-2">{entryError}</div>}
          <div className="form-group">
            <label>Type</label>
            <select value={entryForm.entryType} onChange={(e) => setEntryForm({ ...entryForm, entryType: e.target.value })}>
              <option value="MANUAL">Écriture manuelle</option>
              <option value="ADJUSTMENT">Ajustement</option>
            </select>
          </div>
          <div className="form-group"><label>Description</label><input value={entryForm.description} onChange={(e) => setEntryForm({ ...entryForm, description: e.target.value })} /></div>

          <table className="w-full text-xs mt-2">
            <thead><tr className="text-left text-gray-400"><th>Compte</th><th>Débit</th><th>Crédit</th><th>Description</th><th></th></tr></thead>
            <tbody>
              {entryForm.lines.map((l, i) => (
                <tr key={i}>
                  <td>
                    <select value={l.glAccountID} onChange={(e) => updateLine(i, 'glAccountID', e.target.value)}>
                      <option value="">—</option>
                      {accounts.map((a) => <option key={a.glAccountID} value={a.glAccountID}>{a.code} — {a.name}</option>)}
                    </select>
                  </td>
                  <td><input type="number" style={{ width: 90 }} value={l.debit} onChange={(e) => updateLine(i, 'debit', e.target.value)} /></td>
                  <td><input type="number" style={{ width: 90 }} value={l.credit} onChange={(e) => updateLine(i, 'credit', e.target.value)} /></td>
                  <td><input value={l.description} onChange={(e) => updateLine(i, 'description', e.target.value)} /></td>
                  <td>{entryForm.lines.length > 2 && <button className="btn-icon text-red-500" onClick={() => removeLine(i)}>✕</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <button className="btn btn-outline btn-sm mt-2" onClick={addLine}>+ Ligne</button>
          <div className="flex justify-between mt-2 text-xs font-bold">
            <span className={lineTotal('debit') !== lineTotal('credit') ? 'text-red-600' : 'text-emerald-600'}>
              Débit: {fmt(lineTotal('debit'))} — Crédit: {fmt(lineTotal('credit'))} {lineTotal('debit') === lineTotal('credit') ? '✓ Équilibré' : '⚠ Déséquilibré'}
            </span>
          </div>
        </Modal>
      )}
    </div>
  );
}
