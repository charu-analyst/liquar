import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { 
  ShoppingCart, Plus, Trash2, Check, RefreshCw, 
  AlertTriangle, UserPlus, FileText 
} from 'lucide-react';

export default function PurchaseModule({ user, shops }) {
  const [shopId, setShopId] = useState(user.shop_id || '');
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentStatus, setPaymentStatus] = useState('Paid');
  const [paymentMode, setPaymentMode] = useState('Cash');

  // Purchase items cart
  const [items, setItems] = useState([]);
  
  // Current Item form
  const [currentProdId, setCurrentProdId] = useState('');
  const [currentQty, setCurrentQty] = useState('');
  const [currentRate, setCurrentRate] = useState('');

  // Inline supplier addition
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [newSupName, setNewSupName] = useState('');
  const [newSupPhone, setNewSupPhone] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchDependencies = async () => {
    try {
      const [supData, prodData] = await Promise.all([
        api.get('/suppliers'),
        api.get('/products')
      ]);
      setSuppliers(supData);
      setProducts(prodData);
      if (prodData.length > 0) {
        setCurrentProdId(prodData[0].id);
        setCurrentRate(prodData[0].purchase_price);
      }
    } catch (err) {
      console.error(err);
      setError('Dependencies failed to load: ' + err.message);
    }
  };

  useEffect(() => {
    fetchDependencies();
  }, []);

  // Update purchase rate dynamically when user changes selected product
  const handleProductChange = (id) => {
    setCurrentProdId(id);
    const prod = products.find(p => p.id === parseInt(id));
    if (prod) {
      setCurrentRate(prod.purchase_price);
    }
  };

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!currentProdId || !currentQty || !currentRate) return;

    const prod = products.find(p => p.id === parseInt(currentProdId));
    if (!prod) return;

    // Check if product is already in the list
    const existing = items.find(i => i.product_id === prod.id);
    if (existing) {
      setItems(items.map(i => 
        i.product_id === prod.id 
          ? { ...i, qty: i.qty + parseInt(currentQty) } 
          : i
      ));
    } else {
      setItems([...items, {
        product_id: prod.id,
        brand_name: prod.brand_name,
        size: prod.size,
        qty: parseInt(currentQty),
        rate: parseFloat(currentRate)
      }]);
    }
    setCurrentQty('');
  };

  const handleRemoveItem = (idx) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const handleAddSupplierSubmit = async (e) => {
    e.preventDefault();
    if (!newSupName.trim()) return;

    try {
      const res = await api.post('/suppliers', { name: newSupName, contact_phone: newSupPhone });
      setSuppliers([...suppliers, res]);
      setSelectedSupplierId(res.id);
      setNewSupName('');
      setNewSupPhone('');
      setShowAddSupplier(false);
      setSuccess('Supplier added and selected');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError('Failed to add supplier: ' + err.message);
    }
  };

  const handlePurchaseSubmit = async (e) => {
    e.preventDefault();
    if (!shopId) {
      setError('Please select a target shop location');
      return;
    }
    if (!selectedSupplierId) {
      setError('Please select a supplier');
      return;
    }
    if (items.length === 0) {
      setError('Cart is empty. Add at least one item');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    const payload = {
      shop_id: parseInt(shopId),
      supplier_id: parseInt(selectedSupplierId),
      purchase_date: purchaseDate,
      payment_status: paymentStatus,
      payment_mode: paymentMode,
      items: items.map(i => ({
        product_id: i.product_id,
        qty: i.qty,
        rate: i.rate
      }))
    };

    try {
      await api.post('/purchases', payload);
      setSuccess('Purchase recorded successfully and stock has been incremented.');
      setItems([]);
      setSelectedSupplierId('');
      setError('');
    } catch (err) {
      setError('Failed to log purchase: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const grandTotal = items.reduce((sum, item) => sum + (item.qty * item.rate), 0);

  return (
    <div className="space-y-6">
      {/* Module Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-100 tracking-tight">Stock Purchase Entry</h2>
          <p className="text-xs text-brand-textMuted mt-0.5">Replenish inventories and record supplier bills</p>
        </div>

        {user.role === 'Admin' ? (
          <select
            value={shopId}
            onChange={(e) => setShopId(e.target.value)}
            className="bg-brand-panelBg border border-brand-border text-gray-200 text-sm rounded-lg px-3 py-2 outline-none"
          >
            <option value="">Select Target Shop...</option>
            {shops.map(shop => (
              <option key={shop.id} value={shop.id}>{shop.name}</option>
            ))}
          </select>
        ) : (
          <div className="bg-brand-panelBg border border-brand-border px-3 py-2 rounded-lg text-sm text-brand-textMuted">
            Receiving Shop: <span className="text-gray-200 font-semibold">{user.shop_name}</span>
          </div>
        )}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT: Add Items & Invoice Config */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Purchase details */}
          <div className="glass-panel rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wider flex items-center space-x-2">
              <FileText className="w-4 h-4 text-blue-500" />
              <span>Purchase Invoice Header</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Date */}
              <div>
                <label className="text-[10px] font-semibold text-brand-textMuted uppercase block mb-1">Invoice Date</label>
                <input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="w-full bg-brand-panelBg border border-brand-border text-gray-200 text-xs rounded-lg p-2.5 outline-none"
                  required
                />
              </div>

              {/* Supplier Selection */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-semibold text-brand-textMuted uppercase block">Supplier</label>
                  <button 
                    onClick={() => setShowAddSupplier(!showAddSupplier)}
                    className="text-[10px] text-blue-400 hover:text-blue-300 font-semibold"
                  >
                    {showAddSupplier ? 'Select Supplier' : '+ Add Supplier'}
                  </button>
                </div>

                {showAddSupplier ? (
                  <div className="bg-brand-panelBg/30 border border-brand-border p-2.5 rounded-lg space-y-2">
                    <input
                      type="text"
                      placeholder="Supplier Name"
                      value={newSupName}
                      onChange={(e) => setNewSupName(e.target.value)}
                      className="w-full bg-brand-panelBg border border-brand-border text-gray-200 text-xs rounded p-1.5 outline-none"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Contact Phone"
                      value={newSupPhone}
                      onChange={(e) => setNewSupPhone(e.target.value)}
                      className="w-full bg-brand-panelBg border border-brand-border text-gray-200 text-xs rounded p-1.5 outline-none"
                    />
                    <button onClick={handleAddSupplierSubmit} className="w-full py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-semibold rounded">
                      Save & Select Supplier
                    </button>
                  </div>
                ) : (
                  <select
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                    className="w-full bg-brand-panelBg border border-brand-border text-gray-200 text-xs rounded-lg p-2.5 outline-none"
                    required
                  >
                    <option value="">Select Supplier...</option>
                    {suppliers.map(sup => (
                      <option key={sup.id} value={sup.id}>{sup.name}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </div>

          {/* Add product line item */}
          <div className="glass-panel rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wider">Add Products to Invoice</h3>
            
            <form onSubmit={handleAddItem} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
              <div className="sm:col-span-2">
                <label className="text-[10px] font-semibold text-brand-textMuted uppercase block mb-1">Select Product</label>
                <select
                  value={currentProdId}
                  onChange={(e) => handleProductChange(e.target.value)}
                  className="w-full bg-brand-panelBg border border-brand-border text-gray-200 text-xs rounded-lg p-2.5 outline-none"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.brand_name} ({p.size})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-brand-textMuted uppercase block mb-1">Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={currentQty}
                  onChange={(e) => setCurrentQty(e.target.value)}
                  placeholder="Units"
                  className="w-full bg-brand-panelBg border border-brand-border text-gray-200 text-xs rounded-lg p-2.5 outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-brand-textMuted uppercase block mb-1">Purchase Rate (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={currentRate}
                  onChange={(e) => setCurrentRate(e.target.value)}
                  className="w-full bg-brand-panelBg border border-brand-border text-gray-200 text-xs rounded-lg p-2.5 outline-none"
                  required
                />
              </div>

              <div className="sm:col-span-4 flex justify-end">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-5 py-2.5 rounded-lg flex items-center space-x-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Line Item</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* RIGHT: Invoice Items List & Settlement */}
        <div className="glass-panel rounded-xl p-4 flex flex-col justify-between h-[520px]">
          <div>
            <div className="pb-3 border-b border-brand-border">
              <h3 className="text-sm font-semibold text-gray-200 flex items-center space-x-2">
                <ShoppingCart className="w-4 h-4 text-orange-500" />
                <span>Invoice Items ({items.length})</span>
              </h3>
            </div>

            {/* List */}
            <div className="space-y-3 mt-3 overflow-y-auto max-h-[190px] pr-1">
              {items.length === 0 ? (
                <div className="text-center py-12 text-xs text-brand-textMuted">
                  Line items list is empty. Add products on the left.
                </div>
              ) : (
                items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg bg-brand-panelBg/50 border border-brand-border/40 text-xs">
                    <div className="w-2/3">
                      <h4 className="font-semibold text-gray-200 truncate">{item.brand_name}</h4>
                      <span className="text-[10px] text-brand-textMuted">Size: {item.size} • Qty: {item.qty} @ ₹{item.rate}</span>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span className="font-bold text-gray-200">
                        ₹{item.qty * item.rate}
                      </span>
                      <button 
                        onClick={() => handleRemoveItem(idx)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Settle Details */}
          <div className="border-t border-brand-border pt-4 mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Payment Mode */}
              <div>
                <label className="text-[10px] font-semibold text-brand-textMuted uppercase block mb-1">Payment Mode</label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="w-full bg-brand-panelBg border border-brand-border text-gray-200 text-xs rounded-lg p-2 outline-none"
                >
                  {['Cash', 'Bank', 'UPI', 'Credit'].map(mode => (
                    <option key={mode} value={mode}>{mode}</option>
                  ))}
                </select>
              </div>

              {/* Payment Status */}
              <div>
                <label className="text-[10px] font-semibold text-brand-textMuted uppercase block mb-1">Status</label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                  className="w-full bg-brand-panelBg border border-brand-border text-gray-200 text-xs rounded-lg p-2 outline-none"
                >
                  {['Paid', 'Pending', 'Partial'].map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Total Panel */}
            <div className="bg-brand-panelBg/50 border border-brand-border/40 p-3 rounded-lg flex items-center justify-between">
              <span className="text-xs text-brand-textMuted">Invoice Grand Total:</span>
              <span className="text-base font-bold text-orange-400">
                ₹{new Intl.NumberFormat('en-IN').format(grandTotal)}
              </span>
            </div>

            <button
              onClick={handlePurchaseSubmit}
              disabled={items.length === 0 || loading}
              className={`
                w-full py-3 rounded-xl font-semibold text-xs flex items-center justify-center space-x-2 transition-all
                ${items.length === 0 
                  ? 'bg-brand-panelBg border border-brand-border text-brand-textMuted cursor-not-allowed' 
                  : 'bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white shadow-lg shadow-orange-500/10'}
              `}
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              <span>{loading ? 'Submitting Invoice...' : 'Register Purchase Invoice'}</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
