import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api';
import { 
  Search, Trash2, Plus, Minus, CreditCard, 
  UserPlus, ShoppingCart, Check, RefreshCw, AlertTriangle, Printer
} from 'lucide-react';

export default function SalesModule({ user, shops }) {
  const [shopId, setShopId] = useState(user.shop_id || '');
  const [inventory, setInventory] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  
  // Cart
  const [cart, setCart] = useState([]);
  const [paymentType, setPaymentType] = useState('Cash');
  const [partialPaid, setPartialPaid] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [dueDate, setDueDate] = useState('');
  
  // Inline Customer Creation
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustMobile, setNewCustMobile] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  // Printing invoice state
  const [lastInvoice, setLastInvoice] = useState(null);

  const barcodeRef = useRef(null);

  const fetchInventory = async () => {
    if (!shopId) return;
    try {
      const data = await api.get(`/inventory?shop_id=${shopId}`);
      setInventory(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCustomers = async () => {
    if (!shopId) return;
    try {
      const data = await api.get(`/customers?shop_id=${shopId}`);
      setCustomers(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchInventory();
    fetchCustomers();
    setCart([]);
  }, [shopId]);

  // Focus barcode input on mount
  useEffect(() => {
    if (barcodeRef.current) {
      barcodeRef.current.focus();
    }
  }, []);

  // Barcode Handler (Instant Add)
  const handleBarcodeSubmit = (e) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;
    
    // Find matching item in inventory
    const matched = inventory.find(item => item.barcode === barcodeInput.trim());
    if (matched) {
      addToCart(matched);
      setSuccessMsg(`Scanned: ${matched.brand_name}`);
      setTimeout(() => setSuccessMsg(''), 2000);
    } else {
      setErrorMsg(`Product with barcode "${barcodeInput}" not found in current shop inventory.`);
      setTimeout(() => setErrorMsg(''), 4000);
    }
    setBarcodeInput('');
  };

  // Add Item to Cart
  const addToCart = (product) => {
    setErrorMsg('');
    const existing = cart.find(item => item.product_id === product.product_id);
    const currentQty = existing ? existing.qty : 0;
    
    // Validate stock
    if (product.closing_qty <= currentQty) {
      setErrorMsg(`Cannot add more. Insufficient stock! Available: ${product.closing_qty}`);
      return;
    }

    if (existing) {
      setCart(cart.map(item => 
        item.product_id === product.product_id 
          ? { ...item, qty: item.qty + 1 } 
          : item
      ));
    } else {
      setCart([...cart, {
        product_id: product.product_id,
        brand_name: product.brand_name,
        category: product.category,
        size: product.size,
        selling_price: product.selling_price,
        purchase_price: product.purchase_price,
        max_stock: product.closing_qty,
        qty: 1
      }]);
    }
  };

  // Update Cart Qty
  const updateQty = (productId, delta) => {
    setErrorMsg('');
    const item = cart.find(item => item.product_id === productId);
    if (!item) return;

    const newQty = item.qty + delta;
    if (newQty <= 0) {
      removeFromCart(productId);
      return;
    }

    if (newQty > item.max_stock) {
      setErrorMsg(`Insufficient Stock! Maximum available is ${item.max_stock}`);
      return;
    }

    setCart(cart.map(i => i.product_id === productId ? { ...i, qty: newQty } : i));
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.product_id !== productId));
  };

  // Quick Inline Customer Creation
  const handleAddCustomerSubmit = async (e) => {
    e.preventDefault();
    if (!newCustName.trim()) return;

    try {
      const result = await api.post('/customers', {
        name: newCustName,
        mobile: newCustMobile,
        shop_id: shopId
      });
      setCustomers([...customers, result]);
      setSelectedCustomerId(result.id);
      setNewCustName('');
      setNewCustMobile('');
      setShowAddCustomer(false);
      setSuccessMsg('Customer added and selected');
      setTimeout(() => setSuccessMsg(''), 2000);
    } catch (err) {
      setErrorMsg('Failed to add customer: ' + err.message);
    }
  };

  // Totals calculations
  const cartSubtotal = cart.reduce((acc, item) => acc + (item.qty * item.selling_price), 0);
  const cartTotalProfit = cart.reduce((acc, item) => acc + (item.qty * (item.selling_price - item.purchase_price)), 0);
  const totalMarginPct = cartSubtotal > 0 ? ((cartTotalProfit / cartSubtotal) * 100).toFixed(1) : 0;

  // Checkout
  const handleCheckout = async () => {
    if (cart.length === 0) {
      setErrorMsg('Cart is empty');
      return;
    }

    if ((paymentType === 'Udhari' || paymentType === 'Partial') && !selectedCustomerId) {
      setErrorMsg('Please select a customer for credit mapping');
      return;
    }

    if (paymentType === 'Partial') {
      const paidAmt = parseFloat(partialPaid) || 0;
      if (paidAmt <= 0 || paidAmt >= cartSubtotal) {
        setErrorMsg('Paid amount must be greater than 0 and less than total invoice amount');
        return;
      }
    }

    setLoading(true);
    setErrorMsg('');

    const paidVal = paymentType === 'Cash' ? cartSubtotal : (paymentType === 'Udhari' ? 0 : parseFloat(partialPaid));
    const dueVal = paymentType === 'Cash' ? 0 : (paymentType === 'Udhari' ? cartSubtotal : (cartSubtotal - parseFloat(partialPaid)));

    const payload = {
      shop_id: shopId,
      customer_id: selectedCustomerId || null,
      sale_date: new Date().toISOString().split('T')[0],
      payment_type: paymentType,
      amount_paid: paidVal,
      amount_due: dueVal,
      due_date: (paymentType === 'Udhari' || paymentType === 'Partial') ? dueDate || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : null,
      items: cart.map(item => ({
        product_id: item.product_id,
        qty: item.qty,
        selling_price: item.selling_price
      }))
    };

    try {
      const result = await api.post('/sales', payload);
      
      // Save for receipt print preview
      const customer = customers.find(c => c.id === parseInt(selectedCustomerId));
      setLastInvoice({
        id: result.id,
        shopName: shops.find(s => s.id === parseInt(shopId))?.name || 'Store',
        customerName: customer?.name || 'Walk-in Customer',
        customerMobile: customer?.mobile || '',
        date: payload.sale_date,
        items: cart,
        total: cartSubtotal,
        paymentType,
        amountDue: dueVal
      });

      setCart([]);
      setSelectedCustomerId('');
      setPaymentType('Cash');
      setPartialPaid('');
      setDueDate('');
      setSuccessMsg(`Invoice registered successfully! Invoice: INV-00${result.id}`);
      fetchInventory(); // refresh stocks
      
      // Auto-trigger invoice print simulation
      setTimeout(() => {
        window.print();
      }, 500);

    } catch (err) {
      setErrorMsg('Transaction failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = inventory.filter(item => 
    item.brand_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.barcode?.includes(searchQuery)
  );

  return (
    <div className="space-y-6 no-print">
      {/* Module Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-100 tracking-tight">Sales POS Terminal</h2>
          <p className="text-xs text-brand-textMuted mt-0.5">Rapid entry billing console with real-time margins</p>
        </div>

        {/* Shop selector for billing context */}
        {user.role === 'Admin' ? (
          <select
            value={shopId}
            onChange={(e) => setShopId(e.target.value)}
            className="bg-brand-panelBg border border-brand-border text-gray-200 text-sm rounded-lg px-3 py-2 outline-none"
          >
            <option value="">Select Shop for Checkout...</option>
            {shops.map(shop => (
              <option key={shop.id} value={shop.id}>{shop.name}</option>
            ))}
          </select>
        ) : (
          <div className="bg-brand-panelBg border border-brand-border px-3 py-2 rounded-lg text-sm text-brand-textMuted">
            Store Terminal: <span className="text-gray-200 font-semibold">{user.shop_name}</span>
          </div>
        )}
      </div>

      {!shopId ? (
        <div className="p-8 rounded-xl glass-panel text-center text-brand-textMuted">
          Please select a shop location from the top dropdown to activate the sales terminal.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT: Search, Product List, Scanner */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* Barcode scanner simulator */}
            <form onSubmit={handleBarcodeSubmit} className="flex space-x-2">
              <input
                type="text"
                ref={barcodeRef}
                placeholder="Simulate Barcode Scan (e.g. 8901001, 8901002)..."
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                className="flex-1 bg-brand-panelBg border border-brand-border text-gray-200 placeholder-gray-500 text-sm rounded-lg px-4 py-2.5 outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 rounded-lg flex items-center space-x-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Scan</span>
              </button>
            </form>

            {/* Product Quick-Search */}
            <div className="relative">
              <Search className="absolute top-3 left-3 w-4 h-4 text-brand-textMuted" />
              <input
                type="text"
                placeholder="Quick-search by brand, category, or size..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-brand-panelBg border border-brand-border text-gray-200 placeholder-gray-500 text-sm rounded-lg pl-9 pr-4 py-2.5 outline-none focus:border-blue-500"
              />
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto pr-1">
              {filteredProducts.map((prod) => {
                const isOutOfStock = prod.closing_qty <= 0;
                const isLowStock = prod.closing_qty <= prod.min_stock;
                
                return (
                  <button
                    key={prod.product_id}
                    onClick={() => !isOutOfStock && addToCart(prod)}
                    disabled={isOutOfStock}
                    className={`
                      p-3.5 rounded-xl text-left glass-panel relative flex flex-col justify-between h-32 transition-all
                      ${isOutOfStock ? 'opacity-40 cursor-not-allowed' : 'glass-panel-hover'}
                      ${isLowStock && !isOutOfStock ? 'border-amber-500/20' : ''}
                    `}
                  >
                    <div>
                      <span className="text-[10px] uppercase font-bold text-blue-400">{prod.category}</span>
                      <h4 className="text-xs font-semibold text-gray-100 line-clamp-2 mt-0.5">{prod.brand_name}</h4>
                    </div>

                    <div className="flex items-end justify-between w-full mt-2">
                      <div>
                        <span className="text-[10px] text-brand-textMuted block">{prod.size}</span>
                        <span className="text-xs font-extrabold text-emerald-400">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(prod.selling_price)}</span>
                      </div>

                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        isOutOfStock 
                          ? 'bg-red-950 text-red-500' 
                          : isLowStock 
                            ? 'bg-amber-950 text-amber-500' 
                            : 'bg-brand-border text-brand-textMuted'
                      }`}>
                        Stock: {prod.closing_qty}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* RIGHT: Cart and Checkout Summary */}
          <div className="glass-panel rounded-xl p-4 flex flex-col justify-between h-[600px]">
            
            {/* Header info */}
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-brand-border">
                <h3 className="text-sm font-semibold text-gray-200 flex items-center space-x-2">
                  <ShoppingCart className="w-4 h-4 text-blue-500" />
                  <span>Cart Items ({cart.length})</span>
                </h3>
                {cart.length > 0 && (
                  <button 
                    onClick={() => setCart([])}
                    className="text-xs text-red-400 hover:text-red-300 flex items-center space-x-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear</span>
                  </button>
                )}
              </div>

              {/* Status boxes */}
              {successMsg && (
                <div className="bg-emerald-950/20 border border-emerald-900/50 p-2 rounded-lg text-emerald-400 text-xs mt-2 flex items-center space-x-1">
                  <Check className="w-4 h-4" />
                  <span>{successMsg}</span>
                </div>
              )}

              {errorMsg && (
                <div className="bg-red-950/20 border border-red-900/50 p-2 rounded-lg text-red-400 text-xs mt-2 flex items-center space-x-1.5">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Cart List */}
              <div className="space-y-3 mt-3 overflow-y-auto max-h-[220px] pr-1">
                {cart.length === 0 ? (
                  <div className="text-center py-8 text-xs text-brand-textMuted">
                    Basket is empty. Select products on the left or scan a barcode to add.
                  </div>
                ) : (
                  cart.map((item) => (
                    <div key={item.product_id} className="flex items-center justify-between p-2 rounded-lg bg-brand-panelBg/50 border border-brand-border/40">
                      <div className="w-1/2">
                        <h4 className="text-xs font-medium text-gray-200 truncate">{item.brand_name}</h4>
                        <span className="text-[10px] text-brand-textMuted">{item.size} • {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(item.selling_price)}</span>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => updateQty(item.product_id, -1)}
                          className="p-1 bg-brand-border rounded text-gray-400 hover:text-white"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs text-gray-100 font-bold w-4 text-center">{item.qty}</span>
                        <button 
                          onClick={() => updateQty(item.product_id, 1)}
                          className="p-1 bg-brand-border rounded text-gray-400 hover:text-white"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <span className="text-xs font-bold text-gray-200 w-16 text-right">
                        {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(item.qty * item.selling_price)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Customer Details & Checkout controls */}
            <div className="border-t border-brand-border pt-4 mt-4 space-y-4">
              
              {/* Payment Type Toggle */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-brand-textMuted font-medium">Payment Mode:</span>
                <div className="bg-brand-panelBg border border-brand-border rounded-lg p-0.5 flex">
                  {['Cash', 'Udhari', 'Partial'].map((mode) => (
                    <button
                      key={mode}
                      onClick={() => {
                        setPaymentType(mode);
                        if (mode !== 'Partial') setPartialPaid('');
                      }}
                      className={`text-xs px-2.5 py-1 rounded-md font-medium transition-all ${
                        paymentType === mode 
                          ? 'bg-blue-600 text-white shadow-sm' 
                          : 'text-brand-textMuted hover:text-white'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              {/* Partial Payment configuration inputs */}
              {paymentType === 'Partial' && (
                <div className="space-y-3 p-3 rounded-lg bg-brand-panelBg/30 border border-brand-border/60">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-brand-textMuted font-medium">Cash Paid (₹):</span>
                    <input
                      type="number"
                      value={partialPaid}
                      onChange={(e) => setPartialPaid(e.target.value)}
                      placeholder="Enter cash paid"
                      className="bg-brand-panelBg border border-brand-border text-gray-200 text-xs rounded p-1.5 w-32 outline-none text-right focus:border-blue-500 font-bold"
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-brand-textMuted">Remaining Udhari:</span>
                    <span className="text-pink-400 font-bold">
                      ₹{new Intl.NumberFormat('en-IN').format(Math.max(0, cartSubtotal - (parseFloat(partialPaid) || 0)))}
                    </span>
                  </div>
                </div>
              )}

              {/* Customer Selector / Inline Add */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-brand-textMuted font-medium">
                    Customer { (paymentType === 'Udhari' || paymentType === 'Partial') ? <span className="text-red-400 font-bold">*</span> : '' }:
                  </span>
                  <button 
                    onClick={() => setShowAddCustomer(!showAddCustomer)}
                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center space-x-0.5"
                  >
                    <UserPlus className="w-3 h-3" />
                    <span>{showAddCustomer ? 'Select Customer' : 'Add New'}</span>
                  </button>
                </div>

                {showAddCustomer ? (
                  <form onSubmit={handleAddCustomerSubmit} className="bg-brand-panelBg/30 border border-brand-border p-2.5 rounded-lg space-y-2">
                    <input
                      type="text"
                      placeholder="Customer Name"
                      value={newCustName}
                      onChange={(e) => setNewCustName(e.target.value)}
                      className="w-full bg-brand-panelBg border border-brand-border text-gray-200 text-xs rounded p-1.5 outline-none"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Mobile Number"
                      value={newCustMobile}
                      onChange={(e) => setNewCustMobile(e.target.value)}
                      className="w-full bg-brand-panelBg border border-brand-border text-gray-200 text-xs rounded p-1.5 outline-none"
                    />
                    <button type="submit" className="w-full py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold rounded">
                      Save & Select Customer
                    </button>
                  </form>
                ) : (
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="w-full bg-brand-panelBg border border-brand-border text-gray-200 text-xs rounded-lg p-2 outline-none"
                  >
                    <option value="">Walk-in Customer (No Ledger)</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name} {c.mobile ? `(${c.mobile})` : ''}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Udhari due date config */}
              {(paymentType === 'Udhari' || paymentType === 'Partial') && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-brand-textMuted font-medium">Udhari Due Date:</span>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="bg-brand-panelBg border border-brand-border text-gray-200 text-xs rounded p-1.5 outline-none"
                  />
                </div>
              )}

              {/* Margin & Subtotal panels */}
              <div className="space-y-1 bg-brand-panelBg/50 border border-brand-border/40 p-3 rounded-lg text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-brand-textMuted">Profit Margin Estimate:</span>
                  <span className="text-emerald-400 font-semibold">
                    {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(cartTotalProfit)} ({totalMarginPct}%)
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm font-bold border-t border-brand-border/30 pt-2 mt-2">
                  <span className="text-gray-200">Total Payable:</span>
                  <span className="text-blue-400 text-base">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(cartSubtotal)}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                onClick={handleCheckout}
                disabled={cart.length === 0 || loading}
                className={`
                  w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center space-x-2 transition-all
                  ${cart.length === 0 
                    ? 'bg-brand-panelBg border border-brand-border text-brand-textMuted cursor-not-allowed' 
                    : 'bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-400 text-white shadow-lg shadow-blue-500/10'}
                `}
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                <span>{loading ? 'Processing Transaction...' : 'Settle Invoice (Ctrl + Enter)'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Embedded hidden print template structure (Activated only under print media queries) */}
      {lastInvoice && (
        <div className="print-only p-8 text-black text-sm bg-white" style={{ fontFamily: 'monospace' }}>
          <div className="text-center space-y-1.5 border-b border-black pb-4">
            <h2 className="text-lg font-bold uppercase">{lastInvoice.shopName}</h2>
            <p>LICENSE NO: LIC-2026-DEMO</p>
            <p>DATE: {lastInvoice.date}</p>
            <p>INVOICE NO: INV-00{lastInvoice.id}</p>
          </div>
          
          <div className="py-4 border-b border-black text-xs">
            <p><strong>Customer:</strong> {lastInvoice.customerName}</p>
            {lastInvoice.customerMobile && <p><strong>Mobile:</strong> {lastInvoice.customerMobile}</p>}
            <p><strong>Payment Mode:</strong> {lastInvoice.paymentType}</p>
          </div>

          <table className="w-full text-left py-4 text-xs">
            <thead>
              <tr className="border-b border-black">
                <th className="py-2">Item Description</th>
                <th className="py-2 text-center">Qty</th>
                <th className="py-2 text-right">Price</th>
                <th className="py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {lastInvoice.items.map((item, idx) => (
                <tr key={idx} className="border-b border-dashed border-gray-300">
                  <td className="py-2">{item.brand_name} ({item.size})</td>
                  <td className="py-2 text-center">{item.qty}</td>
                  <td className="py-2 text-right">{item.selling_price}</td>
                  <td className="py-2 text-right">{item.qty * item.selling_price}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="text-right py-4 space-y-1.5 font-bold text-xs border-t border-black mt-4">
            <p>SUBTOTAL: ₹{lastInvoice.total}</p>
            <p>GST/TAX (0%): ₹0</p>
            <p className="text-sm">TOTAL AMOUNT: ₹{lastInvoice.total}</p>
            {lastInvoice.paymentType !== 'Cash' && (
              <>
                <p>CASH PAID: ₹{lastInvoice.paymentType === 'Udhari' ? 0 : (lastInvoice.total - lastInvoice.amountDue)}</p>
                <p className="text-red-600">CREDIT BALANCE (UDHAR) DUE: ₹{lastInvoice.amountDue}</p>
              </>
            )}
          </div>

          <div className="text-center pt-8 border-t border-black text-[10px]">
            <p>Thank you for your business!</p>
            <p>Please drink responsibly.</p>
          </div>
        </div>
      )}
    </div>
  );
}
