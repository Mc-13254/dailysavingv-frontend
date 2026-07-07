import client from './client';

export const AuthAPI = {
  login: (username, password) => client.post('/api/auth/login', { username, password }),
  logout: (refreshToken) => client.post('/api/auth/logout', { refreshToken }),
};

export const CollectorAPI = {
  list: (search) => client.get('/api/collector', { params: { search } }),
  pending: () => client.get('/api/collector/pending'),
  create: (payload) => client.post('/api/collector', payload),
  update: (id, payload) => client.put(`/api/collector/${id}`, payload),
  remove: (id) => client.delete(`/api/collector/${id}`),
  approve: (pendingId) => client.post(`/api/collector/pending/${pendingId}/approve`),
  reject: (pendingId, reason) => client.post(`/api/collector/pending/${pendingId}/reject`, { reason }),
};

export const ClientAPI = {
  list: (search) => client.get('/api/client', { params: { search } }),
  pending: () => client.get('/api/client/pending'),
  create: (payload) => client.post('/api/client', payload),
  update: (id, payload) => client.put(`/api/client/${id}`, payload),
  remove: (id) => client.delete(`/api/client/${id}`),
  approve: (pendingId) => client.post(`/api/client/pending/${pendingId}/approve`),
  reject: (pendingId, reason) => client.post(`/api/client/pending/${pendingId}/reject`, { reason }),
};

export const CommissionAPI = {
  types: () => client.get('/api/commission/types'),
  createType: (payload) => client.post('/api/commission/types', payload),
  updateType: (id, payload) => client.put(`/api/commission/types/${id}`, payload),
  removeType: (id) => client.delete(`/api/commission/types/${id}`),
  pendingTypes: () => client.get('/api/commission/types/pending'),
  approveType: (pendingId) => client.post(`/api/commission/types/pending/${pendingId}/approve`),
  rejectType: (pendingId, reason) => client.post(`/api/commission/types/pending/${pendingId}/reject`, { reason }),

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
  create: (payload) => client.post('/api/accounts', payload),
  update: (id, payload) => client.put(`/api/accounts/${id}`, payload),
  remove: (id) => client.delete(`/api/accounts/${id}`),
  pending: () => client.get('/api/accounts/pending'),
  approve: (pendingId) => client.post(`/api/accounts/pending/${pendingId}/approve`),
  reject: (pendingId, reason) => client.post(`/api/accounts/pending/${pendingId}/reject`, { reason }),
};

export const ContractAPI = {
  list: () => client.get('/api/contract'),
  create: (payload) => client.post('/api/contract', payload),
  update: (id, payload) => client.put(`/api/contract/${id}`, payload),
  remove: (id) => client.delete(`/api/contract/${id}`),
  pending: () => client.get('/api/contract/pending'),
  approve: (pendingId) => client.post(`/api/contract/pending/${pendingId}/approve`),
  reject: (pendingId, reason) => client.post(`/api/contract/pending/${pendingId}/reject`, { reason }),
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

export const GeoAPI = {
  countries: () => client.get('/api/geo/countries'),
  cities: (paysId) => client.get('/api/geo/cities', { params: { paysId } }),
  currencies: () => client.get('/api/geo/currencies'),
  languages: () => client.get('/api/geo/languages'),
  timezones: () => client.get('/api/geo/timezones'),
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
