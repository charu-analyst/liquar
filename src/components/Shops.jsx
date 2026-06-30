import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Store, Plus, Edit2, Trash2, X, RefreshCw, AlertTriangle, Check } from 'lucide-react';

export default function Shops({ shops, setShops }) {
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingShop, setEditingShop] = useState(null);
  
  const [form, setForm] = useState({
    name: '', address: '', license_number: '', contact_phone: ''
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchShops = async () => {
    setLoading(true);
    try {
      const data = await api.get('/shops');
      setShops(data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch shops: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      if (editingShop) {
        await api.put(`/shops/${editingShop.id}`, form);
        setSuccess('Shop details updated successfully');
      } else {
        await api.post('/shops', form);
        setSuccess('New shop registered and synced to databases');
      }
      setShowModal(false);
      setEditingShop(null);
      setForm({ name: '', address: '', license_number: '', contact_phone: '' });
      fetchShops();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEditClick = (shop) => {
    setEditingShop(shop);
    setForm({
      name: shop.name,
      address: shop.address || '',
      license_number: shop.license_number || '',
      contact_phone: shop.contact_phone || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Wiping a shop deletes all corresponding sales, purchases, and stocks! Are you absolutely sure?')) return;
    setError('');
    try {
      await api.delete(`/shops/${id}`);
      setSuccess('Shop removed from directory');
      fetchShops();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-100 tracking-tight">Shop Outlet Registry</h2>
          <p className="text-xs text-brand-textMuted mt-0.5">Configure operational store locations, license profiles, and contact registries</p>
        </div>

        <button
          onClick={() => {
            setEditingShop(null);
            setForm({ name: '', address: '', license_number: '', contact_phone: '' });
            setShowModal(true);
          }}
          className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center space-x-1.5 shadow"
        >
          <Plus className="w-4 h-4" />
          <span>Add Shop</span>
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

      {/* Main Grid Card layout */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 space-y-3">
          <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
          <span className="text-xs text-brand-textMuted">Refreshing Shop Outlets...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {shops.map((shop) => (
            <div key={shop.id} className="glass-panel rounded-xl p-5 flex flex-col justify-between h-48 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 text-blue-500/10 group-hover:text-blue-500/20 transition-all">
                <Store className="w-16 h-16" />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <h4 className="text-base font-bold text-gray-100">{shop.name}</h4>
                  <span className="text-[10px] font-bold bg-blue-950 text-blue-400 px-1.5 py-0.5 rounded">ID: {shop.id}</span>
                </div>
                
                <p className="text-xs text-brand-textMuted font-medium">License: <span className="text-gray-300">{shop.license_number || 'N/A'}</span></p>
                <p className="text-xs text-brand-textMuted truncate">Address: <span className="text-gray-300">{shop.address || 'N/A'}</span></p>
                <p className="text-xs text-brand-textMuted">Phone: <span className="text-gray-300">{shop.contact_phone || 'N/A'}</span></p>
              </div>

              {/* Action buttons */}
              <div className="flex items-center space-x-2 border-t border-brand-border/40 pt-3 mt-3">
                <button
                  onClick={() => handleEditClick(shop)}
                  className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center space-x-1"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Shop</span>
                </button>
                
                <button
                  onClick={() => handleDelete(shop.id)}
                  className="text-xs text-red-400 hover:text-red-300 font-semibold flex items-center space-x-1 ml-auto"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* MODAL: Shop form */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-panel rounded-2xl p-6 relative">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-semibold text-gray-200 mb-4">{editingShop ? 'Edit Shop Profile' : 'Register Shop Outlet'}</h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[11px] font-semibold text-brand-textMuted uppercase block mb-1">Outlet Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-brand-panelBg border border-brand-border text-gray-200 text-xs rounded-lg p-2.5 outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-brand-textMuted uppercase block mb-1">License Number</label>
                <input
                  type="text"
                  value={form.license_number}
                  onChange={(e) => setForm({ ...form, license_number: e.target.value })}
                  className="w-full bg-brand-panelBg border border-brand-border text-gray-200 text-xs rounded-lg p-2.5 outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-brand-textMuted uppercase block mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={form.contact_phone}
                  onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
                  className="w-full bg-brand-panelBg border border-brand-border text-gray-200 text-xs rounded-lg p-2.5 outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-brand-textMuted uppercase block mb-1">Full Address</label>
                <textarea
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full bg-brand-panelBg border border-brand-border text-gray-200 text-xs rounded-lg p-2.5 h-20 outline-none resize-none"
                />
              </div>

              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded-xl font-semibold text-xs text-white">
                {editingShop ? 'Save Outlet Changes' : 'Register Shop Outlet'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
