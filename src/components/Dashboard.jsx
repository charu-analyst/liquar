import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { 
  TrendingUp, TrendingDown, DollarSign, Package, 
  ShoppingBag, Calendar, AlertTriangle, Play, RefreshCw,
  PlusCircle, CreditCard, ArrowRight
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  Tooltip, BarChart, Bar, CartesianGrid, Legend 
} from 'recharts';

export default function Dashboard({ setCurrentTab, user, shops }) {
  const [selectedShop, setSelectedShop] = useState(user.shop_id || '');
  const [range, setRange] = useState('month'); // today, week, month, year
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [charts, setCharts] = useState(null);
  const [tables, setTables] = useState(null);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const qParams = `?shop_id=${selectedShop}&range=${range}`;
      const [sumData, chartData, tableData] = await Promise.all([
        api.get(`/dashboard/summary${qParams}`),
        api.get(`/dashboard/charts?shop_id=${selectedShop}`),
        api.get(`/dashboard/tables?shop_id=${selectedShop}`)
      ]);
      setSummary(sumData);
      setCharts(chartData);
      setTables(tableData);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch dashboard intelligence: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedShop, range]);

  if (loading && !summary) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-12rem)] space-y-3">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
        <span className="text-sm text-brand-textMuted">Loading ERP Dashboard...</span>
      </div>
    );
  }

  // Format currency helpers
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-100 tracking-tight">Enterprise Overview</h2>
          <p className="text-xs text-brand-textMuted mt-0.5">Real-time indicators and operational business metrics</p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Shop Selector (Enabled for Admin, Disabled/Hardcoded for Managers/Staff) */}
          {user.role === 'Admin' ? (
            <select
              value={selectedShop}
              onChange={(e) => setSelectedShop(e.target.value)}
              className="bg-brand-panelBg border border-brand-border text-gray-200 text-sm rounded-lg px-3 py-2 focus:ring-1 focus:ring-blue-500 outline-none"
            >
              <option value="">All Shops</option>
              {shops.map(shop => (
                <option key={shop.id} value={shop.id}>{shop.name}</option>
              ))}
            </select>
          ) : (
            <div className="bg-brand-panelBg/50 border border-brand-border px-3 py-2 rounded-lg text-sm text-brand-textMuted">
              Shop: <span className="text-gray-200 font-semibold">{user.shop_name}</span>
            </div>
          )}

          {/* Time presets */}
          <div className="bg-brand-panelBg border border-brand-border rounded-lg p-0.5 flex">
            {['today', 'week', 'month', 'year'].map((p) => (
              <button
                key={p}
                onClick={() => setRange(p)}
                className={`text-xs capitalize px-3 py-1.5 rounded-md font-medium transition-all ${
                  range === p 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'text-brand-textMuted hover:text-white'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <button 
            onClick={fetchDashboardData}
            className="p-2 bg-brand-panelBg border border-brand-border text-gray-400 hover:text-white rounded-lg transition-all"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-950/20 border border-red-900/50 p-4 rounded-xl flex items-center space-x-3 text-red-400 text-sm">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 1. Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <button
          onClick={() => setCurrentTab('sales')}
          className="flex items-center justify-between p-4 rounded-xl glass-panel glass-panel-hover text-left"
        >
          <div className="space-y-1">
            <span className="text-xs text-brand-textMuted font-medium block">Quick Action</span>
            <span className="text-sm font-semibold text-gray-200 block">Add New Sale</span>
          </div>
          <PlusCircle className="w-6 h-6 text-emerald-500" />
        </button>

        {user.role !== 'Staff' && (
          <button
            onClick={() => setCurrentTab('purchase')}
            className="flex items-center justify-between p-4 rounded-xl glass-panel glass-panel-hover text-left"
          >
            <div className="space-y-1">
              <span className="text-xs text-brand-textMuted font-medium block">Quick Action</span>
              <span className="text-sm font-semibold text-gray-200 block">Add Purchase</span>
            </div>
            <PlusCircle className="w-6 h-6 text-blue-500" />
          </button>
        )}

        {user.role !== 'Staff' && (
          <button
            onClick={() => setCurrentTab('expenses')}
            className="flex items-center justify-between p-4 rounded-xl glass-panel glass-panel-hover text-left"
          >
            <div className="space-y-1">
              <span className="text-xs text-brand-textMuted font-medium block">Quick Action</span>
              <span className="text-sm font-semibold text-gray-200 block">Record Expense</span>
            </div>
            <PlusCircle className="w-6 h-6 text-red-500" />
          </button>
        )}

        <button
          onClick={() => setCurrentTab('udhari')}
          className="flex items-center justify-between p-4 rounded-xl glass-panel glass-panel-hover text-left"
        >
          <div className="space-y-1">
            <span className="text-xs text-brand-textMuted font-medium block">Quick Action</span>
            <span className="text-sm font-semibold text-gray-200 block">Collect Udhari</span>
          </div>
          <CreditCard className="w-6 h-6 text-amber-500" />
        </button>
      </div>

      {/* 2. Statistical Cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="p-4 rounded-xl glass-panel relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 text-blue-500/10 group-hover:text-blue-500/20 transition-all">
              <Package className="w-12 h-12" />
            </div>
            <span className="text-xs text-brand-textMuted font-medium uppercase tracking-wider block">Stock Value</span>
            <span className="text-lg font-bold text-blue-400 block mt-2">{formatCurrency(summary.stockValue)}</span>
            <span className="text-[10px] text-brand-textMuted block mt-1">Asset cost valuation</span>
          </div>

          <div className="p-4 rounded-xl glass-panel relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 text-emerald-500/10 group-hover:text-emerald-500/20 transition-all">
              <DollarSign className="w-12 h-12" />
            </div>
            <span className="text-xs text-brand-textMuted font-medium uppercase tracking-wider block">Sales ({range})</span>
            <span className="text-lg font-bold text-emerald-400 block mt-2">{formatCurrency(summary.sales)}</span>
            <span className="text-[10px] text-emerald-500 block mt-1 font-medium">Profit: {formatCurrency(summary.salesProfit)}</span>
          </div>

          {user.role !== 'Staff' && (
            <div className="p-4 rounded-xl glass-panel relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-3 text-red-500/10 group-hover:text-red-500/20 transition-all">
                <ShoppingBag className="w-12 h-12" />
              </div>
              <span className="text-xs text-brand-textMuted font-medium uppercase tracking-wider block">Purchase ({range})</span>
              <span className="text-lg font-bold text-red-400 block mt-2">{formatCurrency(summary.purchases)}</span>
              <span className="text-[10px] text-brand-textMuted block mt-1">Inventory replenishment</span>
            </div>
          )}

          {user.role !== 'Staff' && (
            <div className="p-4 rounded-xl glass-panel relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-3 text-purple-500/10 group-hover:text-purple-500/20 transition-all">
                <Calendar className="w-12 h-12" />
              </div>
              <span className="text-xs text-brand-textMuted font-medium uppercase tracking-wider block">Expenses ({range})</span>
              <span className="text-lg font-bold text-purple-400 block mt-2">{formatCurrency(summary.expenses)}</span>
              <span className="text-[10px] text-brand-textMuted block mt-1">Operating overheads</span>
            </div>
          )}

          <div className="p-4 rounded-xl glass-panel relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 text-teal-500/10 group-hover:text-teal-500/20 transition-all">
              <TrendingUp className="w-12 h-12" />
            </div>
            <span className="text-xs text-brand-textMuted font-medium uppercase tracking-wider block">Net profit ({range})</span>
            <span className={`text-lg font-bold block mt-2 ${summary.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {formatCurrency(summary.netProfit)}
            </span>
            <span className="text-[10px] text-brand-textMuted block mt-1">Margin after expenses</span>
          </div>

          <div className="p-4 rounded-xl glass-panel relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 text-indigo-500/10 group-hover:text-indigo-500/20 transition-all">
              <DollarSign className="w-12 h-12" />
            </div>
            <span className="text-xs text-brand-textMuted font-medium uppercase tracking-wider block">Cash in Hand</span>
            <span className="text-lg font-bold text-indigo-400 block mt-2">{formatCurrency(summary.cashInHand)}</span>
            <span className="text-[10px] text-brand-textMuted block mt-1">Net cash liquidity</span>
          </div>

          {user.role !== 'Staff' && (
            <div className="p-4 rounded-xl glass-panel relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-3 text-orange-500/10 group-hover:text-orange-500/20 transition-all">
                <AlertTriangle className="w-12 h-12" />
              </div>
              <span className="text-xs text-brand-textMuted font-medium uppercase tracking-wider block">Supplier Bal</span>
              <span className="text-lg font-bold text-orange-400 block mt-2">{formatCurrency(summary.supplierOutstanding)}</span>
              <span className="text-[10px] text-brand-textMuted block mt-1">Unsettled purchase dues</span>
            </div>
          )}

          <div className="p-4 rounded-xl glass-panel relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 text-pink-500/10 group-hover:text-pink-500/20 transition-all">
              <AlertTriangle className="w-12 h-12" />
            </div>
            <span className="text-xs text-brand-textMuted font-medium uppercase tracking-wider block">Pending Udhari</span>
            <span className="text-lg font-bold text-pink-400 block mt-2">{formatCurrency(summary.udhariPending)}</span>
            <span className="text-[10px] text-brand-textMuted block mt-1">Receivables from credits</span>
          </div>

          <div className="p-4 rounded-xl glass-panel relative overflow-hidden group col-span-2 lg:col-span-1 border-red-500/20">
            <div className="absolute top-0 right-0 p-3 text-red-500/15">
              <AlertTriangle className="w-12 h-12 text-red-500 animate-pulse" />
            </div>
            <span className="text-xs text-red-400 font-semibold uppercase tracking-wider block">Low Stock Alert</span>
            <span className="text-lg font-bold text-red-500 block mt-2">{summary.lowStockCount} Items</span>
            <span className="text-[10px] text-red-400 font-medium block mt-1">Requires ordering</span>
          </div>
        </div>
      )}

      {/* 3. Trends Charts */}
      {charts && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sales & Profit Trend */}
          <div className="p-5 rounded-xl glass-panel space-y-4">
            <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wider">Sales & Net Margin Trends (Last 30 Days)</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={charts.salesTrend} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f293d" />
                  <XAxis dataKey="date" stroke="#9ca3af" fontSize={10} />
                  <YAxis stroke="#9ca3af" fontSize={10} />
                  <Tooltip contentStyle={{ backgroundColor: '#121824', borderColor: '#1f293d', color: '#fff' }} />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                  <Area name="Total Sales" type="monotone" dataKey="sales" stroke="#3b82f6" fillOpacity={1} fill="url(#colorSales)" />
                  <Area name="Margin Profit" type="monotone" dataKey="profit" stroke="#10b981" fillOpacity={1} fill="url(#colorProfit)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Purchases & Expenses Trend */}
          {user.role !== 'Staff' && (
            <div className="p-5 rounded-xl glass-panel space-y-4">
              <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wider">Purchase & Operating Expenses Trends</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts.purchaseTrend.map((item, idx) => ({
                    ...item,
                    expenses: charts.expenseTrend[idx]?.expenses || 0
                  }))} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f293d" />
                    <XAxis dataKey="date" stroke="#9ca3af" fontSize={10} />
                    <YAxis stroke="#9ca3af" fontSize={10} />
                    <Tooltip contentStyle={{ backgroundColor: '#121824', borderColor: '#1f293d', color: '#fff' }} />
                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                    <Bar name="Purchases" dataKey="purchases" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    <Bar name="Expenses" dataKey="expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. Tables / Details */}
      {tables && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Low Stock Items */}
          <div className="p-5 rounded-xl glass-panel space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wider flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />
                <span>Low Stock Items</span>
              </h3>
              <button onClick={() => setCurrentTab('inventory')} className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center space-x-1">
                <span>View Inventory</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-brand-border text-brand-textMuted uppercase font-semibold">
                    <th className="py-2.5">Brand</th>
                    <th className="py-2.5">Cat & Size</th>
                    <th className="py-2.5 text-center">Closing Stock</th>
                    <th className="py-2.5 text-center">Min Alert</th>
                  </tr>
                </thead>
                <tbody>
                  {tables.lowStock.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-brand-textMuted">All stocks are within safe margins.</td>
                    </tr>
                  ) : (
                    tables.lowStock.map((item, idx) => (
                      <tr key={idx} className="border-b border-brand-border/50 hover:bg-brand-panelBg/20">
                        <td className="py-3 font-medium text-gray-200">{item.brand_name}</td>
                        <td className="py-3 text-brand-textMuted">{item.category} • {item.size}</td>
                        <td className="py-3 text-center"><span className="px-2 py-0.5 bg-red-950 text-red-400 rounded-md font-bold">{item.closing_qty}</span></td>
                        <td className="py-3 text-center text-brand-textMuted">{item.min_stock}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pending Customer Udhari */}
          <div className="p-5 rounded-xl glass-panel space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wider flex items-center space-x-2">
                <CreditCard className="w-4 h-4 text-pink-500" />
                <span>Pending Customer Udhari</span>
              </h3>
              <button onClick={() => setCurrentTab('udhari')} className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center space-x-1">
                <span>Go to Ledger</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-brand-border text-brand-textMuted uppercase font-semibold">
                    <th className="py-2.5">Customer</th>
                    <th className="py-2.5">Sale Date</th>
                    <th className="py-2.5 text-center">Due Date</th>
                    <th className="py-2.5 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {tables.pendingUdhari.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-brand-textMuted">No outstanding customer credits.</td>
                    </tr>
                  ) : (
                    tables.pendingUdhari.map((item, idx) => (
                      <tr key={idx} className="border-b border-brand-border/50 hover:bg-brand-panelBg/20">
                        <td className="py-3">
                          <span className="font-medium text-gray-200 block">{item.customer_name}</span>
                          <span className="text-[10px] text-brand-textMuted block">{item.mobile}</span>
                        </td>
                        <td className="py-3 text-brand-textMuted">{item.sale_date}</td>
                        <td className="py-3 text-center font-medium text-red-400">{item.due_date}</td>
                        <td className="py-3 text-right font-bold text-pink-400">{formatCurrency(item.total_amount)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Sales Activity */}
          <div className="p-5 rounded-xl glass-panel space-y-4">
            <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wider">Recent Sales Invoice Activity</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-brand-border text-brand-textMuted uppercase font-semibold">
                    <th className="py-2.5">Invoice</th>
                    <th className="py-2.5">Date</th>
                    <th className="py-2.5">Mode</th>
                    <th className="py-2.5 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {tables.recentSales.map((item) => (
                    <tr key={item.id} className="border-b border-brand-border/50 hover:bg-brand-panelBg/20">
                      <td className="py-3">
                        <span className="font-medium text-gray-200 block">INV-00{item.id}</span>
                        <span className="text-[10px] text-brand-textMuted block">{item.customer_name || 'Walk-in Customer'}</span>
                      </td>
                      <td className="py-3 text-brand-textMuted">{item.sale_date}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.payment_type === 'Cash' ? 'bg-emerald-950 text-emerald-400' : 'bg-pink-950 text-pink-400'
                        }`}>
                          {item.payment_type}
                        </span>
                      </td>
                      <td className="py-3 text-right font-bold text-gray-200">{formatCurrency(item.total_amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pending Supplier Payments */}
          {user.role !== 'Staff' && (
            <div className="p-5 rounded-xl glass-panel space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wider">Pending Supplier Payments</h3>
                <button onClick={() => setCurrentTab('suppliers')} className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center space-x-1">
                  <span>Manage Suppliers</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-brand-border text-brand-textMuted uppercase font-semibold">
                      <th className="py-2.5">Supplier</th>
                      <th className="py-2.5">Purchase Date</th>
                      <th className="py-2.5 text-right">Outstanding</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tables.pendingSupplierPayments.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="py-4 text-center text-brand-textMuted">No outstanding supplier balances.</td>
                      </tr>
                    ) : (
                      tables.pendingSupplierPayments.map((item) => (
                        <tr key={item.id} className="border-b border-brand-border/50 hover:bg-brand-panelBg/20">
                          <td className="py-3 font-medium text-gray-200">{item.supplier_name}</td>
                          <td className="py-3 text-brand-textMuted">{item.purchase_date}</td>
                          <td className="py-3 text-right font-bold text-orange-400">{formatCurrency(item.total_amount)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
