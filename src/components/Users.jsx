import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Users as UsersIcon, Plus, Edit2, Trash2, X, RefreshCw, AlertTriangle, Check } from 'lucide-react';

export default function Users({ shops }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const [form, setForm] = useState({
    username: '', password: '', role: 'Staff', shop_id: '', email: ''
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await api.get('/users');
      setUsers(data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch user accounts: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    const payload = {
      username: form.username,
      role: form.role,
      shop_id: form.role === 'Admin' ? null : (form.shop_id || null),
      email: form.email,
      ...(form.password ? { password: form.password } : {})
    };

    try {
      if (editingUser) {
        await api.put(`/users/${editingUser.id}`, payload);
        setSuccess('User profile credentials updated');
      } else {
        if (!form.password) {
          setError('Password is required for new accounts');
          return;
        }
        await api.post('/users', payload);
        setSuccess('New user account registered');
      }
      setShowModal(false);
      setEditingUser(null);
      setForm({ username: '', password: '', role: 'Staff', shop_id: '', email: '' });
      fetchUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEditClick = (u) => {
    setEditingUser(u);
    setForm({
      username: u.username,
      password: '', // blank by default
      role: u.role,
      shop_id: u.shop_id || '',
      email: u.email || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user account permanently?')) return;
    setError('');
    try {
      await api.delete(`/users/${id}`);
      setSuccess('User account removed successfully');
      fetchUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-100 tracking-tight">System User Accounts</h2>
          <p className="text-xs text-brand-textMuted mt-0.5">Manage user credentials, operational roles, and store access limits</p>
        </div>

        <button
          onClick={() => {
            setEditingUser(null);
            setForm({ username: '', password: '', role: 'Staff', shop_id: '', email: '' });
            setShowModal(true);
          }}
          className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center space-x-1.5 shadow"
        >
          <Plus className="w-4 h-4" />
          <span>Add User Account</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-950/20 border border-red-900/50 p-4 rounded-xl flex items-center space-x-3 text-red-400 text-sm">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-emerald-950/20 border border-emerald-900/50 p-4 rounded-xl flex items-center space-x-3 text-emerald-400 text-sm">
          <Check className="w-5 h-5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Main Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 space-y-3">
          <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
          <span className="text-xs text-brand-textMuted">Refreshing User Accounts...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((u) => (
            <div key={u.id} className="glass-panel rounded-xl p-5 flex flex-col justify-between h-48 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 text-blue-500/10 group-hover:text-blue-500/20 transition-all">
                <UsersIcon className="w-16 h-16" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <h4 className="text-base font-bold text-gray-100">{u.username}</h4>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                    u.role === 'Admin' ? 'bg-red-950 text-red-400' :
                    u.role === 'Shop Manager' ? 'bg-blue-950 text-blue-400' :
                    'bg-gray-900 text-gray-400'
                  }`}>
                    {u.role}
                  </span>
                </div>

                <p className="text-xs text-brand-textMuted font-medium">Email: <span className="text-gray-300">{u.email || 'N/A'}</span></p>
                <p className="text-xs text-brand-textMuted">Assigned Shop: <span className="text-gray-200 font-semibold">{u.role === 'Admin' ? 'All Outlets' : (u.shop_name || 'None')}</span></p>
              </div>

              {/* Action buttons */}
              <div className="flex items-center space-x-2 border-t border-brand-border/40 pt-3 mt-3">
                <button
                  onClick={() => handleEditClick(u)}
                  className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center space-x-1"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Update Account</span>
                </button>

                <button
                  onClick={() => handleDelete(u.id)}
                  className="text-xs text-red-400 hover:text-red-300 font-semibold flex items-center space-x-1 ml-auto"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* MODAL: User account form */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-panel rounded-2xl p-6 relative">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-semibold text-gray-200 mb-4">{editingUser ? 'Edit User Credentials' : 'Create User Account'}</h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[11px] font-semibold text-brand-textMuted uppercase block mb-1">Username / Login ID</label>
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  className="w-full bg-brand-panelBg border border-brand-border text-gray-200 text-xs rounded-lg p-2.5 outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-brand-textMuted uppercase block mb-1">Email Address</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-brand-panelBg border border-brand-border text-gray-200 text-xs rounded-lg p-2.5 outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-brand-textMuted uppercase block mb-1">
                  Password {editingUser ? '(Leave blank to retain original)' : ''}
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full bg-brand-panelBg border border-brand-border text-gray-200 text-xs rounded-lg p-2.5 outline-none"
                  placeholder={editingUser ? '••••••••' : ''}
                  required={!editingUser}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-semibold text-brand-textMuted uppercase block mb-1">Select Role</label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="w-full bg-brand-panelBg border border-brand-border text-gray-200 text-xs rounded-lg p-2.5 outline-none"
                  >
                    {['Admin', 'Shop Manager', 'Staff'].map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>

                {form.role !== 'Admin' && (
                  <div>
                    <label className="text-[11px] font-semibold text-brand-textMuted uppercase block mb-1">Assign Shop Outlet</label>
                    <select
                      value={form.shop_id}
                      onChange={(e) => setForm({ ...form, shop_id: e.target.value })}
                      className="w-full bg-brand-panelBg border border-brand-border text-gray-200 text-xs rounded-lg p-2.5 outline-none"
                      required
                    >
                      <option value="">Select Shop...</option>
                      {shops.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded-xl font-semibold text-xs text-white">
                {editingUser ? 'Save User Settings' : 'Register User Account'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
