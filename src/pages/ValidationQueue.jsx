import { useEffect, useState } from 'react';
import DataTable from '../components/DataTable';
import { CollectorAPI, ClientAPI, CommissionAPI } from '../api/endpoints';

export default function ValidationQueue() {
  const [module, setModule] = useState('collectors');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const loaders = {
    collectors: () => CollectorAPI.pending(),
    clients: () => ClientAPI.pending(),
    commissionRanges: () => CommissionAPI.pendingRanges(),
  };

  const approvers = {
    collectors: (id) => CollectorAPI.approve(id),
    clients: (id) => ClientAPI.approve(id),
    commissionRanges: (id) => CommissionAPI.approveRange(id),
  };

  const rejecters = {
    collectors: (id, reason) => CollectorAPI.reject(id, reason),
    clients: (id, reason) => ClientAPI.reject(id, reason),
    commissionRanges: (id, reason) => CommissionAPI.rejectRange(id, reason),
  };

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await loaders[module]();
      setRows(data);
    } catch { setRows([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [module]);

  const handleApprove = async (id) => { await approvers[module](id); load(); };
  const handleReject = async (id) => {
    const reason = window.prompt('Motif du rejet ?') || 'Non spécifié';
    await rejecters[module](id, reason);
    load();
  };

  const columns = [
    { key: 'pendingID', label: 'Pending ID' },
    { key: 'actionType', label: 'Action' },
    { key: 'requestUser', label: 'Demandé par' },
    { key: 'requestDate', label: 'Date de demande', render: (r) => new Date(r.requestDate).toLocaleString('fr-FR') },
    { key: 'pendingStatus', label: 'Statut' },
    {
      key: 'actions', label: 'Actions', render: (r) => (
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn btn-primary btn-sm" onClick={() => handleApprove(r.pendingID)}>Valider</button>
          <button className="btn btn-danger btn-sm" onClick={() => handleReject(r.pendingID)}>Rejeter</button>
        </div>
      )
    },
  ];

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <div className="panel-title">File d'attente de validation (Maker-Checker)</div>
          <div className="panel-subtitle">Toute création, modification ou suppression passe ici avant d'atteindre la production.</div>
        </div>
      </div>

      <div className="toolbar">
        <div className="toggle-group">
          <button className={`toggle-btn${module === 'collectors' ? ' active' : ''}`} onClick={() => setModule('collectors')}>Collecteurs</button>
          <button className={`toggle-btn${module === 'clients' ? ' active' : ''}`} onClick={() => setModule('clients')}>Clients</button>
          <button className={`toggle-btn${module === 'commissionRanges' ? ' active' : ''}`} onClick={() => setModule('commissionRanges')}>Commission Ranges</button>
        </div>
      </div>

      <DataTable columns={columns} rows={rows} loading={loading} totalLabel={`EN ATTENTE: ${rows.length}`} />
    </div>
  );
}
