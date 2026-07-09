import client from './client';

export const AuthAPI = {
  login: (username, password) => client.post('/api/auth/login', { username, password }),
  logout: (refreshToken) => client.post('/api/auth/logout', { refreshToken }),
  verifyPassword: (password) => client.post('/api/auth/verify-password', { password }),
};

export const CollectorAPI = {
  list: (search) => client.get('/api/collector', { params: { search } }),
  availableUsers: () => client.get('/api/collector/available-users'),
  pending: () => client.get('/api/collector/pending'),
  create: (payload) => client.post('/api/collector', payload),
  update: (id, payload) => client.put(`/api/collector/${id}`, payload),
  remove: (id) => client.delete(`/api/collector/${id}`),
  approve: (pendingId) => client.post(`/api/collector/pending/${pendingId}/approve`),
  reject: (pendingId, reason) => client.post(`/api/collector/pending/${pendingId}/reject`, { reason }),
};

export const ClientAPI = {
  list: (search) => client.get('/api/client', { params: { search } }),
  get: (id) => client.get(`/api/client/${id}`),
  pending: () => client.get('/api/client/pending'),
  create: (payload) => client.post('/api/client', payload),
  update: (id, payload) => client.put(`/api/client/${id}`, payload),
  remove: (id) => client.delete(`/api/client/${id}`),
  approve: (pendingId) => client.post(`/api/client/pending/${pendingId}/approve`),
  reject: (pendingId, reason) => client.post(`/api/client/pending/${pendingId}/reject`, { reason }),
  upload: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return client.post('/api/client/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
};

export const CommissionAPI = {
  types: () => client.get('/api/commission/types'),
  createType: (payload) => client.post('/api/commission/types', payload),
  updateType: (id, payload) => client.put(`/api/commission/types/${id}`, payload),
  removeType: (id) => client.delete(`/api/commission/types/${id}`),

  ranges: (commissionTypeId) => client.get('/api/commission/ranges', { params: { commissionTypeId } }),
  createRange: (payload) => client.post('/api/commission/ranges', payload),
  updateRange: (id, payload) => client.put(`/api/commission/ranges/${id}`, payload),
  removeRange: (id) => client.delete(`/api/commission/ranges/${id}`),
  pendingRanges: () => client.get('/api/commission/ranges/pending'),
  approveRange: (pendingId) => client.post(`/api/commission/ranges/pending/${pendingId}/approve`),
  rejectRange: (pendingId, reason) => client.post(`/api/commission/ranges/pending/${pendingId}/reject`, { reason }),
};

export const TransactionAPI = {
  list: (params) => client.get('/api/transaction', { params }),
  create: (payload) => client.post('/api/transaction', payload),
  dashboardSummary: () => client.get('/api/transaction/dashboard-summary'),
  clientLookup: (search) => client.get('/api/transaction/client-lookup', { params: { search } }),
  createImportBatch: (payload) => client.post('/api/transaction/import-batch', payload),
  pendingImportRows: () => client.get('/api/transaction/import-batch/pending'),
  approveImportRow: (rowId) => client.post(`/api/transaction/import-batch/row/${rowId}/approve`),
  rejectImportRow: (rowId, reason) => client.post(`/api/transaction/import-batch/row/${rowId}/reject`, { reason }),
};

export const CashSessionAPI = {
  current: () => client.get('/api/cashsession/current'),
  open: (payload) => client.post('/api/cashsession/open', payload),
  close: (payload) => client.post('/api/cashsession/close', payload),
  dashboard: () => client.get('/api/cashsession/dashboard'),
  history: (params) => client.get('/api/cashsession/history', { params }),
  getCalendar: (agenceId) => client.get('/api/cashsession/business-calendar', { params: { agenceId } }),
  saveCalendar: (agenceId, payload) => client.put('/api/cashsession/business-calendar', payload, { params: { agenceId } }),
};

export const ReportsAPI = {
  transactionHistory: (params) => client.get('/api/reports/transaction-history', { params }),
  transactionDetail: (id) => client.get(`/api/reports/transaction-history/${id}`),
  transactionStats: () => client.get('/api/reports/transaction-history/stats'),
  center: () => client.get('/api/reports/center'),
  cashSessions: (params) => client.get('/api/reports/cash-sessions', { params }),
  cashSessionDetail: (id) => client.get(`/api/reports/cash-sessions/${id}`),
  cashSessionStats: () => client.get('/api/reports/cash-sessions/stats'),
  clients: (params) => client.get('/api/reports/clients', { params }),
  clientDetail: (id) => client.get(`/api/reports/clients/${id}`),
  clientStats: () => client.get('/api/reports/clients/stats'),
  accounts: (params) => client.get('/api/reports/accounts', { params }),
  accountDetail: (id) => client.get(`/api/reports/accounts/${id}`),
  accountStats: () => client.get('/api/reports/accounts/stats'),
  contracts: (params) => client.get('/api/reports/contracts', { params }),
  contractDetail: (id) => client.get(`/api/reports/contracts/${id}`),
  contractStats: () => client.get('/api/reports/contracts/stats'),
  commissions: (params) => client.get('/api/reports/commissions', { params }),
  commissionByCollector: () => client.get('/api/reports/commissions/by-collector'),
  commissionByAgency: () => client.get('/api/reports/commissions/by-agency'),
  commissionStats: () => client.get('/api/reports/commissions/stats'),
  agencies: () => client.get('/api/reports/agencies'),
  agencyDetail: (id) => client.get(`/api/reports/agencies/${id}`),
  agencyStats: () => client.get('/api/reports/agencies/stats'),
  financialSummary: (params) => client.get('/api/reports/financial/summary', { params }),
  financialTrend: (days) => client.get('/api/reports/financial/trend', { params: { days } }),
  audit: (params) => client.get('/api/reports/audit', { params }),
  auditDetail: (entityType, id) => client.get(`/api/reports/audit/${entityType}/${id}`),
  loginHistory: (params) => client.get('/api/reports/audit/login-history', { params }),
  auditStats: () => client.get('/api/reports/audit/stats'),
  receipts: (params) => client.get('/api/reports/receipts', { params }),
  receiptStats: () => client.get('/api/reports/receipts/stats'),
  dailyCollections: (params) => client.get('/api/reports/daily-collections', { params }),
  dailyCollectionsByZone: () => client.get('/api/reports/daily-collections/by-zone'),
  dailyCollectionStats: () => client.get('/api/reports/daily-collections/stats'),
};

export const SecurityAPI = {
  failedLogins: (params) => client.get('/api/security/failed-logins', { params }),
  failedLoginStats: () => client.get('/api/security/failed-logins/stats'),
  lockedAccounts: () => client.get('/api/security/locked-accounts'),
  lockAccount: (codeUser, reason) => client.post(`/api/security/lock-account/${codeUser}`, { reason }),
  unlockAccount: (codeUser) => client.post(`/api/security/unlock-account/${codeUser}`),
  sessions: () => client.get('/api/security/sessions'),
  sessionStats: () => client.get('/api/security/sessions/stats'),
  terminateSession: (tokenId, reason) => client.post(`/api/security/sessions/${tokenId}/terminate`, { reason }),
  passwordPolicy: () => client.get('/api/security/password-policy'),
  savePasswordPolicy: (payload) => client.put('/api/security/password-policy', payload),
  changePassword: (payload) => client.post('/api/security/change-password', payload),
  passwordStrength: (password) => client.post('/api/security/password-strength', JSON.stringify(password), { headers: { 'Content-Type': 'application/json' } }),
  apiKeys: () => client.get('/api/security/api-keys'),
  createApiKey: (payload) => client.post('/api/security/api-keys', payload),
  revokeApiKey: (id) => client.post(`/api/security/api-keys/${id}/revoke`),
  errorLogs: (params) => client.get('/api/security/error-logs', { params }),
  systemHealth: () => client.get('/api/security/system-health'),
};

// Agency / Account / Contract / IMF / Users: same REST shape as Collector/Client
// (backend controllers for these follow the identical Maker-Checker pattern —
// see the .NET README for how to extend CollectorController's pattern to them).
export const AgencyAPI = {
  list: () => client.get('/api/agence'),
  create: (payload) => client.post('/api/agence', payload),
  update: (id, payload) => client.put(`/api/agence/${id}`, payload),
  remove: (id) => client.delete(`/api/agence/${id}`),
  pending: () => client.get('/api/agence/pending'),
  approve: (pendingId) => client.post(`/api/agence/pending/${pendingId}/approve`),
  reject: (pendingId, reason) => client.post(`/api/agence/pending/${pendingId}/reject`, { reason }),
};

export const AccountAPI = {
  list: (search) => client.get('/api/accounts', { params: { search } }),
  eligibleContracts: () => client.get('/api/accounts/eligible-contracts'),
  create: (payload) => client.post('/api/accounts', payload),
  update: (id, payload) => client.put(`/api/accounts/${id}`, payload),
  pending: () => client.get('/api/accounts/pending'),
  approve: (pendingId) => client.post(`/api/accounts/pending/${pendingId}/approve`),
  reject: (pendingId, reason) => client.post(`/api/accounts/pending/${pendingId}/reject`, { reason }),
  freeze: (id, reason) => client.post(`/api/accounts/${id}/freeze`, { reason }),
  unfreeze: (id) => client.post(`/api/accounts/${id}/unfreeze`),
  close: (id, reason) => client.post(`/api/accounts/${id}/close`, { reason }),
  statement: (id, params) => client.get(`/api/accounts/${id}/statement`, { params }),
};

export const ContractAPI = {
  list: () => client.get('/api/contract'),
  eligibleClients: () => client.get('/api/contract/eligible-clients'),
  create: (payload) => client.post('/api/contract', payload),
  update: (id, payload) => client.put(`/api/contract/${id}`, payload),
  pending: () => client.get('/api/contract/pending'),
  approve: (pendingId) => client.post(`/api/contract/pending/${pendingId}/approve`),
  reject: (pendingId, reason) => client.post(`/api/contract/pending/${pendingId}/reject`, { reason }),
  terminate: (id, reason) => client.post(`/api/contract/${id}/terminate`, { reason }),
};

export const IMFAPI = {
  list: () => client.get('/api/imf'),
  hasActive: () => client.get('/api/imf/has-active'),
  create: (payload) => client.post('/api/imf', payload),
  update: (code, payload) => client.put(`/api/imf/${code}`, payload),
  remove: (code) => client.delete(`/api/imf/${code}`),
  pending: () => client.get('/api/imf/pending'),
  approve: (pendingId) => client.post(`/api/imf/pending/${pendingId}/approve`),
  reject: (pendingId, reason) => client.post(`/api/imf/pending/${pendingId}/reject`, { reason }),
};

export const RoleAPI = {
  list: () => client.get('/api/roles'),
  active: () => client.get('/api/roles/active'),
  create: (payload) => client.post('/api/roles', payload),
  update: (id, payload) => client.put(`/api/roles/${id}`, payload),
  remove: (id) => client.delete(`/api/roles/${id}`),
  pending: () => client.get('/api/roles/pending'),
  approve: (pendingId) => client.post(`/api/roles/pending/${pendingId}/approve`),
  reject: (pendingId, reason) => client.post(`/api/roles/pending/${pendingId}/reject`, { reason }),
};

export const DepartmentAPI = {
  list: () => client.get('/api/department'),
  create: (payload) => client.post('/api/department', payload),
  update: (id, payload) => client.put(`/api/department/${id}`, payload),
  remove: (id) => client.delete(`/api/department/${id}`),
  pending: () => client.get('/api/department/pending'),
  approve: (pendingId) => client.post(`/api/department/pending/${pendingId}/approve`),
  reject: (pendingId, reason) => client.post(`/api/department/pending/${pendingId}/reject`, { reason }),
};

export const PermissionAPI = {
  all: () => client.get('/api/permissions'),
  forRole: (roleId) => client.get(`/api/permissions/role/${roleId}`),
  saveForRole: (roleId, permissions) => client.post(`/api/permissions/role/${roleId}`, { permissions }),
};

export const ContractTypeAPI = {
  list: () => client.get('/api/contracttype'),
  active: () => client.get('/api/contracttype/active'),
  create: (payload) => client.post('/api/contracttype', payload),
  update: (id, payload) => client.put(`/api/contracttype/${id}`, payload),
  remove: (id) => client.delete(`/api/contracttype/${id}`),
  pending: () => client.get('/api/contracttype/pending'),
  approve: (pendingId) => client.post(`/api/contracttype/pending/${pendingId}/approve`),
  reject: (pendingId, reason) => client.post(`/api/contracttype/pending/${pendingId}/reject`, { reason }),
};

export const NumberingParameterAPI = {
  list: () => client.get('/api/numberingparameter'),
  active: () => client.get('/api/numberingparameter/active'),
  create: (payload) => client.post('/api/numberingparameter', payload),
  update: (id, payload) => client.put(`/api/numberingparameter/${id}`, payload),
  remove: (id) => client.delete(`/api/numberingparameter/${id}`),
  preview: (payload) => client.post('/api/numberingparameter/preview', payload),
};

export const GeoAPI = {
  countries: () => client.get('/api/geo/countries'),
  cities: (paysId) => client.get('/api/geo/cities', { params: { paysId } }),
  currencies: () => client.get('/api/geo/currencies'),
  languages: () => client.get('/api/geo/languages'),
  timezones: () => client.get('/api/geo/timezones'),
};

export const ZoneAPI = {
  list: (search) => client.get('/api/zone', { params: { search } }),
  get: (id) => client.get(`/api/zone/${id}`),
  clients: (id) => client.get(`/api/zone/${id}/clients`),
  districts: (paysId) => client.get('/api/zone/districts', { params: { paysId } }),
  create: (payload) => client.post('/api/zone', payload),
  update: (id, payload) => client.put(`/api/zone/${id}`, payload),
  remove: (id) => client.delete(`/api/zone/${id}`),
};

export const CollectorZoneAssignmentAPI = {
  getForCollector: (collectorId) => client.get(`/api/collector-zone-assignment/${collectorId}`),
  assign: (payload) => client.post('/api/collector-zone-assignment/assign', payload),
  updateZones: (collectorId, payload) => client.put(`/api/collector-zone-assignment/${collectorId}/zones`, payload),
  transferClients: (payload) => client.post('/api/collector-zone-assignment/transfer-clients', payload),
  history: (params) => client.get('/api/collector-zone-assignment/history', { params }),
};

export const CollectorPerformanceAPI = {
  kpis: (filter) => client.get('/api/collector-performance/kpis', { params: filter }),
  table: (filter) => client.get('/api/collector-performance', { params: filter }),
  detail: (collectorId, filter) => client.get(`/api/collector-performance/${collectorId}`, { params: filter }),
  leaderboard: (filter, top = 10) => client.get('/api/collector-performance/leaderboard', { params: { ...filter, top } }),
  bottomPerformers: (filter) => client.get('/api/collector-performance/bottom-performers', { params: filter }),
  alerts: () => client.get('/api/collector-performance/alerts'),
  charts: (type, filter) => client.get('/api/collector-performance/charts', { params: { type, ...filter } }),
};

export const UserAPI = {
  list: () => client.get('/api/users'),
  create: (payload) => client.post('/api/users', payload),
  update: (codeUser, payload) => client.put(`/api/users/${codeUser}`, payload),
  remove: (codeUser) => client.delete(`/api/users/${codeUser}`),
  pending: () => client.get('/api/users/pending'),
  approve: (pendingId) => client.post(`/api/users/pending/${pendingId}/approve`),
  reject: (pendingId, reason) => client.post(`/api/users/pending/${pendingId}/reject`, { reason }),
};
