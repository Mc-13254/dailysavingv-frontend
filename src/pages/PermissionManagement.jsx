import { useEffect, useMemo, useState } from 'react';
import { ShieldCheck, CheckSquare, Square } from 'lucide-react';
import SearchableSelect from '../components/SearchableSelect';
import ExportDropdown from '../components/ExportDropdown';
import { RoleAPI, PermissionAPI } from '../api/endpoints';

export default function PermissionManagement() {
  const [roles, setRoles] = useState([]);
  const [roleId, setRoleId] = useState('');
  const [permissions, setPermissions] = useState([]); // { permissionID, permissionName, module, action, allowed }
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [dirty, setDirty] = useState(false);

  useEffect(() => { RoleAPI.list().then(({ data }) => setRoles(data)).catch(() => {}); }, []);

  const roleOptions = roles.map((r) => ({ value: r.roleID, label: r.libelle }));
  const selectedRole = roles.find((r) => r.roleID === roleId);
  const isAdminRole = selectedRole?.code === 'ADMIN';

  const loadMatrix = async (id) => {
    if (!id) { setPermissions([]); return; }
    setLoading(true);
    try {
      const { data } = await PermissionAPI.forRole(id);
      setPermissions(data.map((p) => ({ ...p, allowed: p.allowed })));
      setDirty(false);
    } catch { setPermissions([]); }
    finally { setLoading(false); }
  };

  const handleRoleChange = (id) => {
    setRoleId(id);
    setNotice('');
    loadMatrix(id);
  };

  const grouped = useMemo(() => {
    const term = search.toLowerCase();
    const filtered = permissions.filter((p) =>
      !term || p.module.toLowerCase().includes(term) || p.permissionName.toLowerCase().includes(term)
    );
    const map = {};
    for (const p of filtered) {
      if (!map[p.module]) map[p.module] = [];
      map[p.module].push(p);
    }
    return map;
  }, [permissions, search]);

  const totalAllowed = permissions.filter((p) => p.allowed).length;
  const totalDisabled = permissions.length - totalAllowed;

  const toggle = (permissionID) => {
    if (isAdminRole) return;
    setPermissions((prev) => prev.map((p) => p.permissionID === permissionID ? { ...p, allowed: !p.allowed } : p));
    setDirty(true);
  };

  const toggleModule = (module, value) => {
    if (isAdminRole) return;
    setPermissions((prev) => prev.map((p) => p.module === module ? { ...p, allowed: value } : p));
    setDirty(true);
  };

  const selectAll = () => {
    if (isAdminRole) return;
    setPermissions((prev) => prev.map((p) => ({ ...p, allowed: true })));
    setDirty(true);
  };
  const clearAll = () => {
    if (isAdminRole) return;
    setPermissions((prev) => prev.map((p) => ({ ...p, allowed: false })));
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setNotice('');
    try {
      await PermissionAPI.saveForRole(roleId, permissions.map((p) => ({ permissionID: p.permissionID, allowed: p.allowed })));
      setNotice('Permissions enregistrées.');
      setDirty(false);
    } catch (err) {
      setNotice(err.response?.data?.message || "Erreur lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  };

  const exportColumns = [
    { key: 'module', label: 'Module' },
    { key: 'permissionName', label: 'Permission' },
    { key: 'allowed', label: 'Allowed', format: (r) => (r.allowed ? 'YES' : 'NO') },
  ];

  return (
    <div className="panel flex flex-col" style={{ minHeight: '80vh' }}>
      <div className="panel-header">
        <div>
          <div className="panel-title">Permission Management</div>
          <div className="panel-subtitle">Les rôles définissent QUI l'utilisateur est. Les permissions définissent CE QU'IL peut faire.</div>
        </div>
      </div>

      <div className="toolbar">
        <div className="form-group" style={{ minWidth: 260, flex: 'none' }}>
          <SearchableSelect options={roleOptions} value={roleId} onChange={handleRoleChange} placeholder="Choisir un rôle…" />
        </div>
        <input className="search-input" placeholder="Search permission or module…" value={search} onChange={(e) => setSearch(e.target.value)} disabled={!roleId} />
        <ExportDropdown filename={`PERMISSIONS_${selectedRole?.libelle || ''}`} columns={exportColumns} rows={permissions} />
      </div>

      {!roleId ? (
        <div className="empty-state">Sélectionnez un rôle pour afficher sa matrice de permissions.</div>
      ) : loading ? (
        <div className="empty-state">Chargement…</div>
      ) : (
        <>
          {/* Summary */}
          <div className="flex items-center gap-4 flex-wrap mb-3">
            <div className="flex items-center gap-2 bg-brand-blue/10 text-brand-blue px-3 py-1.5 rounded-md text-xs font-bold">
              <ShieldCheck size={14} /> {selectedRole?.libelle}
            </div>
            <span className="text-xs text-green-600 font-semibold">{totalAllowed} Permissions Enabled</span>
            <span className="text-xs text-gray-400 font-semibold">{totalDisabled} Disabled</span>
            {isAdminRole && <span className="text-[11px] text-gray-400 italic">Administrator possède toujours tous les droits — non modifiable.</span>}
            <div className="ml-auto flex items-center gap-2">
              <button className="btn btn-outline btn-sm" onClick={clearAll} disabled={isAdminRole}>Clear All</button>
              <button className="btn btn-outline btn-sm" onClick={selectAll} disabled={isAdminRole}>Select All</button>
            </div>
          </div>

          {notice && <div className="error-banner mb-3" style={{ background: dirty ? undefined : '#dcfce7', color: dirty ? undefined : '#16a34a' }}>{notice}</div>}

          {/* Matrix */}
          <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {Object.entries(grouped).map(([module, perms]) => {
              const allChecked = perms.every((p) => p.allowed);
              return (
                <div key={module} className="form-card">
                  <div className="flex items-center justify-between form-card-title !mb-2">
                    <span>{module}</span>
                    <button className="flex items-center gap-1 text-[10px] text-brand-blue normal-case font-semibold" onClick={() => toggleModule(module, !allChecked)} disabled={isAdminRole}>
                      {allChecked ? <CheckSquare size={13} /> : <Square size={13} />} Select All
                    </button>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {perms.map((p) => (
                      <label key={p.permissionID} className="flex items-center gap-2 text-[12px] cursor-pointer">
                        <input type="checkbox" className="w-3.5 h-3.5" checked={p.allowed} disabled={isAdminRole} onChange={() => toggle(p.permissionID)} />
                        {p.permissionName}
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sticky save footer */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 pt-3 mt-3 flex justify-end">
            <button className="btn btn-primary" onClick={handleSave} disabled={saving || isAdminRole || !dirty}>
              {saving ? 'Enregistrement…' : 'Save Permissions'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
