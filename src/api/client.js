import axios from 'axios';

// Point this to your deployed .NET API (see Program.cs CORS config on the backend)
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://localhost:7001';

const client = axios.create({ baseURL: API_BASE_URL });

function getTokens() {
  return {
    accessToken: localStorage.getItem('dsv_access_token'),
    refreshToken: localStorage.getItem('dsv_refresh_token'),
  };
}

export function setTokens({ accessToken, refreshToken }) {
  if (accessToken) localStorage.setItem('dsv_access_token', accessToken);
  if (refreshToken) localStorage.setItem('dsv_refresh_token', refreshToken);
}

export function clearTokens() {
  localStorage.removeItem('dsv_access_token');
  localStorage.removeItem('dsv_refresh_token');
  localStorage.removeItem('dsv_user');
}

client.interceptors.request.use((config) => {
  const { accessToken } = getTokens();
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

let isRefreshing = false;
let queue = [];

client.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const { refreshToken } = getTokens();
      if (!refreshToken) {
        clearTokens();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          queue.push({ resolve, reject, original });
        });
      }

      isRefreshing = true;
      try {
        const { data } = await axios.post(`${API_BASE_URL}/api/auth/refresh`, { refreshToken });
        setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
        queue.forEach(({ resolve, original: o }) => {
          o.headers.Authorization = `Bearer ${data.accessToken}`;
          resolve(client(o));
        });
        queue = [];
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return client(original);
      } catch (refreshErr) {
        queue.forEach(({ reject }) => reject(refreshErr));
        queue = [];
        clearTokens();
        window.location.href = '/login';
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default client;
