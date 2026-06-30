import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { 
  FileSpreadsheet, Printer, Search, RefreshCw, 
  TrendingUp, TrendingDown, DollarSign, Calculator, AlertTriangle
} from 'lucide-react';

export default function Reports({ user, shops }) {
  const [reportType, setReportType] = useState('sales'); // sales, pl
  const [shopId, setShopId] = useState(user.shop_id || '');
  const [startDate, setStartDate] = useState(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]); // past week
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');

  // Results
  const [salesData, setSalesData] = useState([]);
  const [plData, setPlData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchProducts = async () => {
    try {
      const data = await api.get('/products');
      setProducts(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const runReport = async () => {
    setLoading(true);
    setError('');
    const params = `?start_date=${startDate}&end_date=${endDate}&shop_id=${shopId}&brand_id=${selectedProductId}`;
    
    try {
      if (reportType === 'sales') {
        const data = await api.get(`/reports/sales${params}`);
        setSalesData(data);
      } else {
        const data = await api.get(`/reports/profit-loss${params}`);
        setPlData(data);
      }
    } catch (err) {
      console.error(err);
      setError('Report compilation failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runReport();
  }, [reportType, shopId, startDate, endDate, selectedProductId]);

  const handlePrint = () => {
    window.print();
  };

  // Convert JSON report to CSV and trigger browser download
  const handleExportCSV = () => {
    if (reportType === 'sales') {
      if (salesData.length === 0) return;
      const headers = ['Sale Date', 'Shop', 'Brand', 'Category', 'Size', 'Qty Sold', 'Selling Price', 'Profit'];
      const rows = salesData.map(item => [
        item.sale_date,
        item.shop_name,
        item.brand_name,
        item.category,
        item.size,
        item.qty,
        item.selling_price,
        item.profit_margin * item.qty
      ]);
      
      const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      triggerCSVDownload(csvContent, 'sales_report.csv');
    } else {
      if (!plData) return;
      const csvContent = [
        ['Profit & Loss Statement (Summary)', `${startDate} to ${endDate}`].join(','),
        ['Metric', 'Value (INR)'].join(','),
        ['Total Sales Revenue', plData.sales],
        ['Gross Profit Margin', plData.grossProfit],
        ['Inventory Purchases Cost', plData.purchases],
        ['Operating Overhead Expenses', plData.expenses],
        ['Net Operating Profit / Loss', plData.netProfit],
        ['', ''],
        ['Expense Breakdown Category', 'Amount (INR)'],
        ...plData.expenseBreakdown.map(e => [e.type, e.sum])
      ].map(e => e.join(',')).join('\n');
      
      triggerCSVDownload(csvContent, 'profit_loss_report.csv');
    }
  };

  const triggerCSVDownload = (content, filename) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Title & Type Selectors */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 no-print">
        <div>
          <h2 className="text-2xl font-bold text-gray-100 tracking-tight">Intelligence Reporting</h2>
          <p className="text-xs text-brand-textMuted mt-0.5">Generate daily spreadsheets, sales breakdowns, and Profit & Loss statement sheets</p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Report Tab controls */}
          <div className="bg-brand-panelBg border border-brand-border rounded-lg p-0.5 flex">
            <button
              onClick={() => setReportType('sales')}
              className={`text-xs px-3 py-1.5 rounded-md font-semibold transition-all ${
                reportType === 'sales' ? 'bg-blue-600 text-white' : 'text-brand-textMuted hover:text-white'
              }`}
            >
              Sales Spreadsheets
            </button>
            <button
              onClick={() => setReportType('pl')}
              className={`text-xs px-3 py-1.5 rounded-md font-semibold transition-all ${
                reportType === 'pl' ? 'bg-blue-600 text-white' : 'text-brand-textMuted hover:text-white'
              }`}
            >
              Profit & Loss statement
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            className="bg-brand-panelBg border border-brand-border hover:bg-brand-panelBg/80 text-gray-200 text-xs font-semibold px-4 py-2 rounded-lg flex items-center space-x-1.5"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Excel (CSV)</span>
          </button>

          <button
            onClick={handlePrint}
            className="bg-brand-panelBg border border-brand-border hover:bg-brand-panelBg/80 text-gray-200 text-xs font-semibold px-4 py-2 rounded-lg flex items-center space-x-1.5"
          >
            <Printer className="w-4 h-4 text-indigo-400" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* FILTERS PANEL */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-5 rounded-xl glass-panel no-print">
        {/* Date presets */}
        <div>
          <label className="text-[10px] font-semibold text-brand-textMuted uppercase block mb-1">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full bg-brand-panelBg border border-brand-border text-gray-200 text-xs rounded-lg p-2.5 outline-none"
          />
        </div>

        <div>
          <label className="text-[10px] font-semibold text-brand-textMuted uppercase block mb-1">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full bg-brand-panelBg border border-brand-border text-gray-200 text-xs rounded-lg p-2.5 outline-none"
          />
        </div>

        {/* Shop Outlet */}
        <div>
          <label className="text-[10px] font-semibold text-brand-textMuted uppercase block mb-1">Shop Outlet</label>
          {user.role === 'Admin' ? (
            <select
              value={shopId}
              onChange={(e) => setShopId(e.target.value)}
              className="w-full bg-brand-panelBg border border-brand-border text-gray-200 text-xs rounded-lg p-2.5 outline-none"
            >
              <option value="">All Outlets</option>
              {shops.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          ) : (
            <div className="bg-brand-panelBg/30 border border-brand-border px-3 py-2.5 rounded-lg text-xs text-brand-textMuted">
              {user.shop_name}
            </div>
          )}
        </div>

        {/* Brand/Product Filter */}
        {reportType === 'sales' && (
          <div>
            <label className="text-[10px] font-semibold text-brand-textMuted uppercase block mb-1">Filter Brand</label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full bg-brand-panelBg border border-brand-border text-gray-200 text-xs rounded-lg p-2.5 outline-none"
            >
              <option value="">All Brands</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.brand_name} ({p.size})</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-950/20 border border-red-900/50 p-4 rounded-xl flex items-center space-x-3 text-red-400 text-sm no-print">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* COMPILED SHEETS */}
      <div className="glass-panel rounded-xl overflow-hidden p-5">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-3">
            <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
            <span className="text-xs text-brand-textMuted font-medium">Running SQL aggregates...</span>
          </div>
        ) : reportType === 'sales' ? (
          /* SALES DATA TABLE SHEET */
          <div>
            <div className="border-b border-brand-border pb-3 mb-4">
              <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wider">Compiled Sales Spreadsheet ({startDate} to {endDate})</h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-brand-border text-brand-textMuted uppercase font-semibold">
                    <th className="py-2.5">Date</th>
                    <th className="py-2.5">Outlet</th>
                    <th className="py-2.5">Brand</th>
                    <th className="py-2.5">Category & Size</th>
                    <th className="py-2.5 text-center">Qty Sold</th>
                    <th className="py-2.5 text-right">Selling Price</th>
                    <th className="py-2.5 text-right text-emerald-400">Total Profit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border/40">
                  {salesData.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-brand-textMuted">No matching transaction records found.</td>
                    </tr>
                  ) : (
                    salesData.map((item, idx) => (
                      <tr key={idx} className="hover:bg-brand-panelBg/20">
                        <td className="py-3 text-gray-300">{item.sale_date}</td>
                        <td className="py-3 text-brand-textMuted">{item.shop_name}</td>
                        <td className="py-3 font-semibold text-gray-200">{item.brand_name}</td>
                        <td className="py-3 text-brand-textMuted">{item.category} • {item.size}</td>
                        <td className="py-3 text-center font-bold text-gray-200">{item.qty}</td>
                        <td className="py-3 text-right">₹{item.selling_price}</td>
                        <td className="py-3 text-right font-bold text-emerald-400">₹{item.qty * item.profit_margin}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* PROFIT & LOSS SHEETS PANEL */
          plData && (
            <div className="space-y-6">
              <div className="border-b border-brand-border pb-3">
                <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wider">Profit & Loss Statement Summary</h3>
                <p className="text-[10px] text-brand-textMuted">For period: {startDate} to {endDate}</p>
              </div>

              {/* Aggregated KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-brand-panelBg border border-brand-border">
                  <span className="text-[10px] text-brand-textMuted font-semibold uppercase tracking-wider block">Gross Sales Revenue</span>
                  <span className="text-lg font-bold text-gray-100 block mt-1">₹{new Intl.NumberFormat('en-IN').format(plData.sales)}</span>
                </div>

                <div className="p-4 rounded-xl bg-brand-panelBg border border-brand-border">
                  <span className="text-[10px] text-brand-textMuted font-semibold uppercase tracking-wider block">Gross Profit Margin</span>
                  <span className="text-lg font-bold text-emerald-400 block mt-1">₹{new Intl.NumberFormat('en-IN').format(plData.grossProfit)}</span>
                </div>

                <div className="p-4 rounded-xl bg-brand-panelBg border border-brand-border">
                  <span className="text-[10px] text-brand-textMuted font-semibold uppercase tracking-wider block">Operating Expenses</span>
                  <span className="text-lg font-bold text-red-400 block mt-1">₹{new Intl.NumberFormat('en-IN').format(plData.expenses)}</span>
                </div>

                <div className="p-4 rounded-xl bg-brand-panelBg border border-red-500/20">
                  <span className="text-[10px] text-brand-textMuted font-semibold uppercase tracking-wider block">Net Business Profit</span>
                  <span className={`text-lg font-bold block mt-1 ${plData.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    ₹{new Intl.NumberFormat('en-IN').format(plData.netProfit)}
                  </span>
                </div>
              </div>

              {/* Expense breakdown table */}
              <div className="pt-4 border-t border-brand-border/40">
                <h4 className="text-xs font-semibold text-gray-200 uppercase tracking-wider mb-3">Operating Expense Breakdown</h4>
                <div className="max-w-md overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-brand-border text-brand-textMuted font-semibold uppercase">
                        <th className="py-2">Category Type</th>
                        <th className="py-2 text-right">Logged Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {plData.expenseBreakdown.length === 0 ? (
                        <tr>
                          <td colSpan={2} className="py-4 text-center text-brand-textMuted">No expenses recorded for this period.</td>
                        </tr>
                      ) : (
                        plData.expenseBreakdown.map((item, idx) => (
                          <tr key={idx} className="border-b border-brand-border/30 hover:bg-brand-panelBg/20">
                            <td className="py-2.5 font-medium text-gray-300">{item.type}</td>
                            <td className="py-2.5 text-right font-bold text-red-400">₹{new Intl.NumberFormat('en-IN').format(item.sum)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )
        )}
      </div>

    </div>
  );
}
