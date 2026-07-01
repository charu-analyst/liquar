const API_BASE = 'https://liquarbackend.onrender.com/api';


// Helper to get auth header
function getHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
}

export const api = {
  async get(endpoint) {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: getHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Unknown API error' }));
      throw new Error(err.error || `HTTP error ${res.status}`);
    }
    return res.json();
  },

  async post(endpoint, body) {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Unknown API error' }));
      throw new Error(err.error || `HTTP error ${res.status}`);
    }
    return res.json();
  },

  async put(endpoint, body) {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Unknown API error' }));
      throw new Error(err.error || `HTTP error ${res.status}`);
    }
    return res.json();
  },

  async delete(endpoint) {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Unknown API error' }));
      throw new Error(err.error || `HTTP error ${res.status}`);
    }
    return res.json();
  },

  // Database Backup endpoint
  getBackupUrl() {
    const token = localStorage.getItem('token');
    return `${API_BASE}/settings/backup?token=${token}`;
  }
};
