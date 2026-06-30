import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { 
  BookOpen, Calendar, CreditCard, RefreshCw, 
  Check, AlertTriangle, ChevronRight, ArrowLeft 
} from 'lucide-react';

export default function Udhari({ user, shops }) {
  const [shopId, setShopId] = useState(user.shop_id || '');
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null); // for ledger view
  const [ledger, setLedger] = useState([]);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const q = shopId ? `?shop_id=${shopId}` : '';
      const data = await api.get(`/udhari${q}`);
      setCustomers(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load credit ledgers: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchLedger = async (cust) => {
    setSelectedCustomer(cust);
    try {
      const data = await api.get(`/udhari/${cust.customer_id}/ledger`);
      setLedger(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load customer ledger: ' + err.message);
    }
  };

  useEffect(() => {
    fetchCustomers();
    setSelectedCustomer(null);
  }, [shopId]);

  const handleCollectSubmit = async (saleId) => {
    if (!window.confirm('Are you sure you want to collect and clear this credit amount?')) return;
    setError('');
    setSuccess('');
    try {
      await api.post('/udhari/collect', { sale_id: saleId });
      setSuccess('Repayment recorded and credit balance cleared!');
      
      // refresh
      fetchCustomers();
      if (selectedCustomer) {
        // refetch same ledger
        const data = await api.get(`/udhari/${selectedCustomer.customer_id}/ledger`);
        setLedger(data);
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
            {selectedCustomer ? `${selectedCustomer.name} - Credit Ledger` : 'Customer Udhari Ledger'}
          </h2>
          <p className="text-xs text-brand-textMuted mt-0.5">
            {selectedCustomer ? `Repayment logs and credit invoice timeline for mobile: ${selectedCustomer.mobile || 'N/A'}` : 'Manage credit logs and outstanding receivables'}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {selectedCustomer && (
            <button
              onClick={() => setSelectedCustomer(null)}
              className="bg-brand-panelBg border border-brand-border hover:bg-brand-panelBg/80 text-gray-200 text-xs font-semibold px-4 py-2 rounded-lg flex items-center space-x-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Udhari list</span>
            </button>
          )}

          {!selectedCustomer && (
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
      {!selectedCustomer ? (
        /* LIST DIRECTORY VIEW */
        <div className="glass-panel rounded-xl overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
              <span className="text-xs text-brand-textMuted">Loading Accounts Receivable...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-brand-border text-brand-textMuted uppercase font-semibold bg-brand-panelBg/40">
                    <th className="px-4 py-3">Customer Info</th>
                    <th className="px-4 py-3">Assigned Shop</th>
                    <th className="px-4 py-3 text-pink-400">Total Pending Udhari</th>
                    <th className="px-4 py-3 text-center">Unpaid Invoices</th>
                    <th className="px-4 py-3 text-center">Earliest Overdue Date</th>
                    <th className="px-4 py-3 text-center">Ledger Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border/40">
                  {customers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-brand-textMuted">No credit records found for this shop.</td>
                    </tr>
                  ) : (
                    customers.map((cust) => (
                      <tr key={cust.customer_id} className="hover:bg-brand-panelBg/20">
                        <td className="px-4 py-3">
                          <span className="font-semibold text-gray-200 block text-sm">{cust.name}</span>
                          <span className="text-[10px] text-brand-textMuted block">Mobile: {cust.mobile || 'N/A'}</span>
                        </td>
                        <td className="px-4 py-3 text-brand-textMuted">{cust.shop_name}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded font-bold ${
                            cust.total_udhari > 0 ? 'bg-pink-950 text-pink-400' : 'bg-emerald-950 text-emerald-400'
                          }`}>
                            ₹{new Intl.NumberFormat('en-IN').format(cust.total_udhari)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-gray-300 font-semibold">{cust.pending_bills_count} bills</td>
                        <td className="px-4 py-3 text-center font-medium text-red-400">{cust.earliest_due_date || 'No Dues'}</td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => fetchLedger(cust)}
                            className="bg-brand-panelBg border border-brand-border hover:border-blue-500 text-gray-200 px-3 py-1.5 rounded-lg flex items-center space-x-1 mx-auto"
                          >
                            <span>Repayments Ledger</span>
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
          {/* Timeline of Sales / Repayments */}
          <div className="lg:col-span-2 glass-panel rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wider">Transaction Ledger Chronology</h3>
            
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
              {ledger.length === 0 ? (
                <div className="text-center py-8 text-brand-textMuted text-xs">No invoices mapped to this profile.</div>
              ) : (
                ledger.map((tx) => (
                  <div key={tx.id} className="p-3.5 rounded-xl border border-brand-border bg-brand-panelBg/40 flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] text-brand-textMuted uppercase font-bold tracking-wider">Sale Invoice #00{tx.id}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                          tx.amount_due <= 0 
                            ? 'bg-emerald-950 text-emerald-400' 
                            : tx.amount_paid > 0 
                              ? 'bg-amber-950 text-amber-400' 
                              : 'bg-red-950 text-red-400'
                        }`}>
                          {tx.amount_due <= 0 
                            ? 'Cleared' 
                            : tx.amount_paid > 0 
                              ? `Partial (Paid ₹${tx.amount_paid})` 
                              : 'Unpaid (Credit)'}
                        </span>
                      </div>
                      <h4 className="text-xs font-semibold text-gray-200">Sale Date: {tx.date}</h4>
                      {tx.due_date && tx.amount_due > 0 && <p className="text-[10px] text-red-400">Due Repayment: {tx.due_date}</p>}
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <span className="text-sm font-bold text-gray-100 block">₹{new Intl.NumberFormat('en-IN').format(tx.total_amount)}</span>
                        {tx.amount_due > 0 && (
                          <span className="text-[10px] text-pink-400 font-semibold block">Outstanding: ₹{tx.amount_due}</span>
                        )}
                      </div>
                      {tx.amount_due > 0 && (
                        <button
                          onClick={() => handleCollectSubmit(tx.id)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold px-3 py-1.5 rounded"
                        >
                          Collect ₹{tx.amount_due}
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Account receivables detail stats */}
          <div className="glass-panel rounded-xl p-5 space-y-4 h-fit">
            <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wider">Repayment Summary</h3>
            
            <div className="space-y-3 bg-brand-panelBg/50 p-4 rounded-xl text-xs">
              <div className="flex justify-between">
                <span className="text-brand-textMuted">Customer Contact:</span>
                <span className="font-semibold text-gray-200">{selectedCustomer.mobile || 'N/A'}</span>
              </div>
              <div className="flex justify-between border-t border-brand-border/40 pt-2.5 mt-2.5">
                <span className="text-brand-textMuted text-pink-400 font-semibold">Outstanding Due Udhari:</span>
                <span className="font-bold text-pink-400">₹{new Intl.NumberFormat('en-IN').format(selectedCustomer.total_udhari)}</span>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-emerald-950/20 border border-emerald-900/30 text-emerald-400 text-[11px]">
              Click "Collect Cash" to record manual payment and clear outstanding credit receipts immediately.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
