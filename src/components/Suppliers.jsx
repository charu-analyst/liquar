import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { 
  Handshake, Plus, Calendar, CreditCard, 
  RefreshCw, Check, AlertTriangle, ChevronRight, ArrowLeft 
} from 'lucide-react';

export default function Suppliers({ user, shops }) {
  const [shopId, setShopId] = useState(user.shop_id || '');
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null); // for ledger view
  const [ledger, setLedger] = useState([]);

  // New Supplier Form
  const [showAddModal, setShowAddModal] = useState(false);
  const [supForm, setSupForm] = useState({ name: '', contact_phone: '', email: '' });

  // Settle Payment state
  const [settlingInvoice, setSettlingInvoice] = useState(null);
  const [settleMode, setSettleMode] = useState('Cash');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const q = shopId ? `?shop_id=${shopId}` : '';
      const data = await api.get(`/suppliers${q}`);
      setSuppliers(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load suppliers: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchLedger = async (supplier) => {
    setSelectedSupplier(supplier);
    try {
      const q = shopId ? `?shop_id=${shopId}` : '';
      const data = await api.get(`/suppliers/${supplier.id}/ledger${q}`);
      setLedger(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load ledger: ' + err.message);
    }
  };

  useEffect(() => {
    fetchSuppliers();
    setSelectedSupplier(null);
  }, [shopId]);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await api.post('/suppliers', supForm);
      setSuccess('Supplier registered successfully');
      setShowAddModal(false);
      setSupForm({ name: '', contact_phone: '', email: '' });
      fetchSuppliers();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSettleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await api.post('/suppliers/settle', {
        purchase_id: settlingInvoice.id,
        payment_mode: settleMode
      });
      setSuccess('Outstanding invoice settled successfully');
      setSettlingInvoice(null);
      
      // refresh
      fetchSuppliers();
      if (selectedSupplier) {
        fetchLedger(selectedSupplier);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-100 tracking-tight">
            {selectedSupplier ? `${selectedSupplier.name} - Ledger` : 'Supplier Directories'}
          </h2>
          <p className="text-xs text-brand-textMuted mt-0.5">
            {selectedSupplier ? 'Chronological timeline of orders and payments' : 'Track raw material suppliers and pending accounts payable'}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {selectedSupplier && (
            <button
              onClick={() => setSelectedSupplier(null)}
              className="bg-brand-panelBg border border-brand-border hover:bg-brand-panelBg/80 text-gray-200 text-xs font-semibold px-4 py-2 rounded-lg flex items-center space-x-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Directory</span>
            </button>
          )}

          {!selectedSupplier && (
            <>
              {user.role === 'Admin' ? (
                <select
                  value={shopId}
                  onChange={(e) => setShopId(e.target.value)}
                  className="bg-brand-panelBg border border-brand-border text-gray-200 text-sm rounded-lg px-3 py-2 outline-none"
                >
                  <option value="">All Shops</option>
                  {shops.map(shop => (
                    <option key={shop.id} value={shop.id}>{shop.name}</option>
                  ))}
                </select>
              ) : (
                <div className="bg-brand-panelBg/50 border border-brand-border px-3 py-2 rounded-lg text-sm text-brand-textMuted">
                  Shop Filter: <span className="text-gray-200 font-semibold">{user.shop_name}</span>
                </div>
              )}

              <button
                onClick={() => setShowAddModal(true)}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center space-x-1.5 shadow"
              >
                <Plus className="w-4 h-4" />
                <span>Add Supplier</span>
              </button>
            </>
          )}
        </div>
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

      {/* Main Views */}
      {!selectedSupplier ? (
        /* LIST DIRECTORY VIEW */
        <div className="glass-panel rounded-xl overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
              <span className="text-xs text-brand-textMuted">Loading Accounts Payable...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-brand-border text-brand-textMuted uppercase font-semibold bg-brand-panelBg/40">
                    <th className="px-4 py-3">Supplier Info</th>
                    <th className="px-4 py-3">Total Purchases</th>
                    <th className="px-4 py-3 text-orange-400">Pending Outstanding</th>
                    <th className="px-4 py-3">Last Purchase Date</th>
                    <th className="px-4 py-3 text-center">Ledger Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border/40">
                  {suppliers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-brand-textMuted">No supplier records configured.</td>
                    </tr>
                  ) : (
                    suppliers.map((sup) => (
                      <tr key={sup.id} className="hover:bg-brand-panelBg/20">
                        <td className="px-4 py-3">
                          <span className="font-semibold text-gray-200 block text-sm">{sup.name}</span>
                          <span className="text-[10px] text-brand-textMuted block">{sup.contact_phone || 'N/A'} • {sup.email || 'N/A'}</span>
                        </td>
                        <td className="px-4 py-3 text-gray-300 font-medium">₹{new Intl.NumberFormat('en-IN').format(sup.total_purchase)}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded font-bold ${
                            sup.pending_balance > 0 ? 'bg-orange-950 text-orange-400' : 'bg-emerald-950 text-emerald-400'
                          }`}>
                            ₹{new Intl.NumberFormat('en-IN').format(sup.pending_balance)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-brand-textMuted">{sup.last_payment_date || 'No Transaction'}</td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => fetchLedger(sup)}
                            className="bg-brand-panelBg border border-brand-border hover:border-blue-500 text-gray-200 px-3 py-1.5 rounded-lg flex items-center space-x-1 mx-auto"
                          >
                            <span>Ledger View</span>
                            <ChevronRight className="w-3.5 h-3.5 text-blue-400" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* LEDGER DETAIL VIEW */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Timeline */}
          <div className="lg:col-span-2 glass-panel rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wider">Purchase History</h3>
            
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
              {ledger.length === 0 ? (
                <div className="text-center py-8 text-brand-textMuted text-xs">No transaction history recorded for this supplier.</div>
              ) : (
                ledger.map((tx) => (
                  <div key={tx.id} className="p-3.5 rounded-xl border border-brand-border bg-brand-panelBg/40 flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-[10px] text-brand-textMuted uppercase font-bold tracking-wider">{tx.type} Invoice #00{tx.id}</span>
                      <h4 className="text-xs font-semibold text-gray-200">Date: {tx.date}</h4>
                      <p className="text-[10px] text-brand-textMuted">Status: <span className={tx.details === 'Paid' ? 'text-emerald-400' : 'text-orange-400'}>{tx.details}</span></p>
                    </div>

                    <div className="flex items-center space-x-4">
                      <span className="text-sm font-bold text-gray-100">₹{new Intl.NumberFormat('en-IN').format(tx.amount)}</span>
                      {tx.details !== 'Paid' && (
                        <button
                          onClick={() => setSettlingInvoice(tx)}
                          className="bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-semibold px-3 py-1.5 rounded"
                        >
                          Settle
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Supplier Summary Card */}
          <div className="glass-panel rounded-xl p-5 space-y-4 h-fit">
            <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wider">Account Metrics</h3>
            
            <div className="space-y-3 bg-brand-panelBg/50 p-4 rounded-xl text-xs">
              <div className="flex justify-between">
                <span className="text-brand-textMuted">Total Orders Value:</span>
                <span className="font-semibold text-gray-200">₹{new Intl.NumberFormat('en-IN').format(selectedSupplier.total_purchase)}</span>
              </div>
              <div className="flex justify-between border-t border-brand-border/40 pt-2.5 mt-2.5">
                <span className="text-brand-textMuted text-orange-400">Total Outstanding Balance:</span>
                <span className="font-bold text-orange-400">₹{new Intl.NumberFormat('en-IN').format(selectedSupplier.pending_balance)}</span>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-blue-950/20 border border-blue-900/30 text-blue-400 text-[11px]">
              Click "Settle" next to any pending invoice to clear the outstanding debt and log the cash ledger update.
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: Add Supplier */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-panel rounded-2xl p-6 relative">
            <button onClick={() => setShowAddModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-semibold text-gray-200 mb-4">Register Supplier</h3>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="text-[11px] font-semibold text-brand-textMuted uppercase block mb-1">Supplier / Agency Name</label>
                <input
                  type="text"
                  value={supForm.name}
                  onChange={(e) => setSupForm({ ...supForm, name: e.target.value })}
                  className="w-full bg-brand-panelBg border border-brand-border text-gray-200 text-xs rounded-lg p-2.5 outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-brand-textMuted uppercase block mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={supForm.contact_phone}
                  onChange={(e) => setSupForm({ ...supForm, contact_phone: e.target.value })}
                  className="w-full bg-brand-panelBg border border-brand-border text-gray-200 text-xs rounded-lg p-2.5 outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-brand-textMuted uppercase block mb-1">Email Address</label>
                <input
                  type="email"
                  value={supForm.email}
                  onChange={(e) => setSupForm({ ...supForm, email: e.target.value })}
                  className="w-full bg-brand-panelBg border border-brand-border text-gray-200 text-xs rounded-lg p-2.5 outline-none"
                />
              </div>

              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded-xl font-semibold text-xs text-white">
                Add Supplier to Directory
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Settle Invoice Outstanding */}
      {settlingInvoice && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm glass-panel rounded-2xl p-6 relative">
            <button onClick={() => setSettlingInvoice(null)} className="absolute top-4 right-4 text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-semibold text-gray-200 mb-4">Settle Invoice #00{settlingInvoice.id}</h3>

            <form onSubmit={handleSettleSubmit} className="space-y-4">
              <div className="bg-brand-panelBg/50 p-3.5 rounded-lg text-xs space-y-1">
                <div className="flex justify-between text-brand-textMuted">
                  <span>Outstanding Due:</span>
                  <span className="font-bold text-orange-400">₹{new Intl.NumberFormat('en-IN').format(settlingInvoice.amount)}</span>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-brand-textMuted uppercase block mb-1">Settlement Payment Mode</label>
                <select
                  value={settleMode}
                  onChange={(e) => setSettleMode(e.target.value)}
                  className="w-full bg-brand-panelBg border border-brand-border text-gray-200 text-xs rounded-lg p-2.5 outline-none"
                >
                  {['Cash', 'Bank', 'UPI'].map(mode => (
                    <option key={mode} value={mode}>{mode}</option>
                  ))}
                </select>
              </div>

              <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 py-3 rounded-xl font-semibold text-xs text-white">
                Submit Settlement Payment
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
