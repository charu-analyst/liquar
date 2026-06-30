import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { 
  ArrowDownRight, Plus, RefreshCw, X, AlertTriangle, Check 
} from 'lucide-react';

export default function Expenses({ user, shops }) {
  const [shopId, setShopId] = useState(user.shop_id || '');
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  
  const [form, setForm] = useState({
    shop_id: user.shop_id || '',
    expense_type: 'Salary',
    description: '',
    amount: '',
    expense_date: new Date().toISOString().split('T')[0]
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const q = shopId ? `?shop_id=${shopId}` : '';
      const data = await api.get(`/expenses${q}`);
      setExpenses(data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch expenses: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [shopId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!form.shop_id) {
      setError('Please select a shop location');
      return;
    }

    try {
      await api.post('/expenses', form);
      setSuccess('Expense logged successfully');
      setShowAddModal(false);
      setForm({
        shop_id: user.shop_id || '',
        expense_type: 'Salary',
        description: '',
        amount: '',
        expense_date: new Date().toISOString().split('T')[0]
      });
      fetchExpenses();
    } catch (err) {
      setError(err.message);
    }
  };

  // Grouped aggregates
  const totalOverhead = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-100 tracking-tight">Operating Expenses</h2>
          <p className="text-xs text-brand-textMuted mt-0.5">Log utility charges, salaries, rent, maintenance, and logistics overheads</p>
        </div>

        <div className="flex items-center space-x-3">
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
              Shop Context: <span className="text-gray-200 font-semibold">{user.shop_name}</span>
            </div>
          )}

          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center space-x-1.5 shadow"
          >
            <Plus className="w-4 h-4" />
            <span>Record Expense</span>
          </button>
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

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl glass-panel relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 text-red-500/10">
            <ArrowDownRight className="w-12 h-12 text-red-500" />
          </div>
          <span className="text-xs text-brand-textMuted font-medium uppercase tracking-wider block">Total Logged Overhead</span>
          <span className="text-xl font-bold text-red-400 block mt-1">₹{new Intl.NumberFormat('en-IN').format(totalOverhead)}</span>
        </div>
      </div>

      {/* Main Expenses Table */}
      <div className="glass-panel rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-3">
            <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
            <span className="text-xs text-brand-textMuted">Refreshing Expense Sheet...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-brand-border text-brand-textMuted uppercase font-semibold bg-brand-panelBg/40">
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Shop Outlet</th>
                  <th className="px-4 py-3">Expense Type</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/40">
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-brand-textMuted">No operational expenses logged.</td>
                  </tr>
                ) : (
                  expenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-brand-panelBg/20">
                      <td className="px-4 py-3 font-medium text-gray-200">{exp.expense_date}</td>
                      <td className="px-4 py-3 text-brand-textMuted">{exp.shop_name}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          exp.expense_type === 'Rent' ? 'bg-red-950 text-red-400' :
                          exp.expense_type === 'Electricity' ? 'bg-amber-950 text-amber-400' :
                          exp.expense_type === 'Salary' ? 'bg-purple-950 text-purple-400' :
                          exp.expense_type === 'Maintenance' ? 'bg-indigo-950 text-indigo-400' :
                          exp.expense_type === 'Transport' ? 'bg-blue-950 text-blue-400' :
                          'bg-gray-900 text-gray-400'
                        }`}>
                          {exp.expense_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-brand-textMuted">{exp.description || 'N/A'}</td>
                      <td className="px-4 py-3 text-right font-bold text-red-400">₹{new Intl.NumberFormat('en-IN').format(exp.amount)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: Record Expense */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-panel rounded-2xl p-6 relative">
            <button onClick={() => setShowAddModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-semibold text-gray-200 mb-4">Record Operating Expense</h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-semibold text-brand-textMuted uppercase block mb-1">Target Shop</label>
                  <select
                    value={form.shop_id}
                    onChange={(e) => setForm({ ...form, shop_id: e.target.value })}
                    className="w-full bg-brand-panelBg border border-brand-border text-gray-200 text-xs rounded-lg p-2.5 outline-none"
                    required
                  >
                    <option value="">Select Outlet...</option>
                    {shops.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-brand-textMuted uppercase block mb-1">Expense Type</label>
                  <select
                    value={form.expense_type}
                    onChange={(e) => setForm({ ...form, expense_type: e.target.value })}
                    className="w-full bg-brand-panelBg border border-brand-border text-gray-200 text-xs rounded-lg p-2.5 outline-none"
                  >
                    {['Salary', 'Rent', 'Electricity', 'Maintenance', 'Transport', 'Misc'].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-semibold text-brand-textMuted uppercase block mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className="w-full bg-brand-panelBg border border-brand-border text-gray-200 text-xs rounded-lg p-2.5 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-brand-textMuted uppercase block mb-1">Date</label>
                  <input
                    type="date"
                    value={form.expense_date}
                    onChange={(e) => setForm({ ...form, expense_date: e.target.value })}
                    className="w-full bg-brand-panelBg border border-brand-border text-gray-200 text-xs rounded-lg p-2.5 outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-brand-textMuted uppercase block mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full bg-brand-panelBg border border-brand-border text-gray-200 text-xs rounded-lg p-2.5 h-20 outline-none resize-none"
                />
              </div>

              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded-xl font-semibold text-xs text-white">
                Log Expense Entry
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
