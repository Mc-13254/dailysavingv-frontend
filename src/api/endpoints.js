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
  approve: (pendingId) => client.post(`/api/client/pending/${pendingId}/approve`),
  reject: (pendingId, reason) => client.post(`/api/client/pending/${pendingId}/reject`, { reason }),
};

export const CommissionAPI = {
  types: () => client.get('/api/commission/types'),
  ranges: (commissionTypeId) => client.get('/api/commission/ranges', { params: { commissionTypeId } }),
  createRange: (payload) => client.post('/api/commission/ranges', payload),
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
  pending: () => client.get('/api/agence/pending'),
  approve: (pendingId) => client.post(`/api/agence/pending/${pendingId}/approve`),
  reject: (pendingId, reason) => client.post(`/api/agence/pending/${pendingId}/reject`, { reason }),
};

export const AccountAPI = {
  list: (search) => client.get('/api/accounts', { params: { search } }),
  create: (payload) => client.post('/api/accounts', payload),
  pending: () => client.get('/api/accounts/pending'),
  approve: (pendingId) => client.post(`/api/accounts/pending/${pendingId}/approve`),
  reject: (pendingId, reason) => client.post(`/api/accounts/pending/${pendingId}/reject`, { reason }),
};

export const ContractAPI = {
  list: () => client.get('/api/contract'),
  create: (payload) => client.post('/api/contract', payload),
  pending: () => client.get('/api/contract/pending'),
  approve: (pendingId) => client.post(`/api/contract/pending/${pendingId}/approve`),
  reject: (pendingId, reason) => client.post(`/api/contract/pending/${pendingId}/reject`, { reason }),
};

export const IMFAPI = {
  list: () => client.get('/api/imf'),
  create: (payload) => client.post('/api/imf', payload),
  pending: () => client.get('/api/imf/pending'),
  approve: (pendingId) => client.post(`/api/imf/pending/${pendingId}/approve`),
  reject: (pendingId, reason) => client.post(`/api/imf/pending/${pendingId}/reject`, { reason }),
};

export const UserAPI = {
  list: () => client.get('/api/users'),
  create: (payload) => client.post('/api/users', payload),
  pending: () => client.get('/api/users/pending'),
  approve: (pendingId) => client.post(`/api/users/pending/${pendingId}/approve`),
  reject: (pendingId, reason) => client.post(`/api/users/pending/${pendingId}/reject`, { reason }),
};
