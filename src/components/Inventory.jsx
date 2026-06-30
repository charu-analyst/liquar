import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { 
  Plus, Search, Edit2, Trash2, ArrowLeftRight, 
  ShieldAlert, RefreshCw, X, AlertTriangle, Check
} from 'lucide-react';

export default function Inventory({ user, shops }) {
  const [shopId, setShopId] = useState(user.shop_id || '');
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  
  // Product Master Modal
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [prodForm, setProdForm] = useState({
    brand_name: '', category: 'Whisky', size: '750ml', 
    barcode: '', min_stock: 10, purchase_price: '', selling_price: '', opening_qty: 0
  });

  // Transfer Stock Modal
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferForm, setTransferForm] = useState({
    product_id: '', from_shop_id: '', to_shop_id: '', qty: ''
  });
  
  // Damage Stock Modal
  const [showDamageModal, setShowDamageModal] = useState(false);
  const [damageForm, setDamageForm] = useState({
    product_id: '', shop_id: '', qty: '', description: ''
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const q = shopId ? `?shop_id=${shopId}` : '';
      const data = await api.get(`/inventory${q}`);
      setInventory(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load inventory: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [shopId]);

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, prodForm);
        setSuccess('Product details updated successfully');
      } else {
        await api.post('/products', prodForm);
        setSuccess('New product registered and linked to all shops');
      }
      setShowProductModal(false);
      setEditingProduct(null);
      resetProductForm();
      fetchInventory();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product? This will wipe all its stock records.')) return;
    setError('');
    try {
      await api.delete(`/products/${id}`);
      setSuccess('Product deleted successfully');
      fetchInventory();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await api.post('/inventory/transfer', transferForm);
      setSuccess(`Transferred stock successfully!`);
      setShowTransferModal(false);
      fetchInventory();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDamageSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await api.post('/inventory/damage', damageForm);
      setSuccess('Damage logged, stock updated');
      setShowDamageModal(false);
      fetchInventory();
    } catch (err) {
      setError(err.message);
    }
  };

  const openEditModal = (prod) => {
    setEditingProduct({ id: prod.product_id });
    setProdForm({
      brand_name: prod.brand_name,
      category: prod.category,
      size: prod.size,
      barcode: prod.barcode || '',
      min_stock: prod.min_stock,
      purchase_price: prod.purchase_price,
      selling_price: prod.selling_price,
      opening_qty: prod.opening_qty
    });
    setShowProductModal(true);
  };

  const resetProductForm = () => {
    setProdForm({
      brand_name: '', category: 'Whisky', size: '750ml', 
      barcode: '', min_stock: 10, purchase_price: '', selling_price: '', opening_qty: 0
    });
  };

  const filtered = inventory.filter(item => {
    const matchesSearch = item.brand_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.barcode?.includes(searchQuery);
    const matchesCat = categoryFilter ? item.category === categoryFilter : true;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-100 tracking-tight">Inventory Stock Ledger</h2>
          <p className="text-xs text-brand-textMuted mt-0.5">Shop-wise inventory formulas, transfers, and wastage logs</p>
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
              Terminal: <span className="text-gray-200 font-semibold">{user.shop_name}</span>
            </div>
          )}

          {user.role !== 'Staff' && (
            <button
              onClick={() => { resetProductForm(); setEditingProduct(null); setShowProductModal(true); }}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center space-x-1.5 shadow"
            >
              <Plus className="w-4 h-4" />
              <span>Add Product</span>
            </button>
          )}

          {user.role !== 'Staff' && (
            <button
              onClick={() => {
                setTransferForm({
                  product_id: inventory[0]?.product_id || '',
                  from_shop_id: user.shop_id || '1',
                  to_shop_id: '',
                  qty: ''
                });
                setShowTransferModal(true);
              }}
              className="bg-brand-panelBg border border-brand-border hover:bg-brand-panelBg/80 text-gray-200 text-xs font-semibold px-4 py-2 rounded-lg flex items-center space-x-1.5"
            >
              <ArrowLeftRight className="w-4 h-4 text-blue-400" />
              <span>Transfer Stock</span>
            </button>
          )}

          <button
            onClick={() => {
              setDamageForm({
                product_id: inventory[0]?.product_id || '',
                shop_id: shopId || '1',
                qty: '',
                description: ''
              });
              setShowDamageModal(true);
            }}
            className="bg-brand-panelBg border border-brand-border hover:bg-brand-panelBg/80 text-gray-200 text-xs font-semibold px-4 py-2 rounded-lg flex items-center space-x-1.5"
          >
            <ShieldAlert className="w-4 h-4 text-red-400" />
            <span>Log Waste / Damage</span>
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

      {/* Filters & Search */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative md:col-span-2">
          <Search className="absolute top-3 left-3 w-4 h-4 text-brand-textMuted" />
          <input
            type="text"
            placeholder="Search products by brand name or barcode..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-brand-panelBg border border-brand-border text-gray-200 placeholder-gray-500 text-sm rounded-lg pl-9 pr-4 py-2.5 outline-none"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-brand-panelBg border border-brand-border text-gray-200 text-sm rounded-lg px-3 py-2 outline-none"
        >
          <option value="">All Categories</option>
          {['Whisky', 'Beer', 'Rum', 'Vodka', 'Wine', 'Gin', 'Tequila'].map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Main Stock Table */}
      <div className="glass-panel rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-3">
            <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
            <span className="text-xs text-brand-textMuted">Refreshing Stock Levels...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-brand-border text-brand-textMuted uppercase font-semibold bg-brand-panelBg/40">
                  <th className="px-4 py-3">Brand & Size</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3 text-center">Opening</th>
                  <th className="px-4 py-3 text-center">Purchased</th>
                  <th className="px-4 py-3 text-center">Sold</th>
                  <th className="px-4 py-3 text-center">Damaged</th>
                  <th className="px-4 py-3 text-center">Transferred</th>
                  <th className="px-4 py-3 text-center">Closing Stock</th>
                  <th className="px-4 py-3 text-right">Value (Rate)</th>
                  {user.role !== 'Staff' && <th className="px-4 py-3 text-center">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/40">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-4 py-8 text-center text-brand-textMuted">No products found matching filters.</td>
                  </tr>
                ) : (
                  filtered.map((item, idx) => {
                    const isLow = item.closing_qty <= item.min_stock;
                    
                    return (
                      <tr key={idx} className="hover:bg-brand-panelBg/20">
                        <td className="px-4 py-3">
                          <span className="font-semibold text-gray-200 block">{item.brand_name}</span>
                          <span className="text-[10px] text-brand-textMuted block">{item.size} {item.barcode ? `• Barcode: ${item.barcode}` : ''}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[10px] bg-brand-panelBg border border-brand-border px-2 py-0.5 rounded-full text-blue-400 font-semibold uppercase">{item.category}</span>
                        </td>
                        <td className="px-4 py-3 text-center text-brand-textMuted">{item.opening_qty}</td>
                        <td className="px-4 py-3 text-center text-emerald-500 font-medium">+{item.purchase_qty}</td>
                        <td className="px-4 py-3 text-center text-blue-500 font-medium">-{item.sold_qty}</td>
                        <td className="px-4 py-3 text-center text-red-500 font-medium">-{item.damaged_qty}</td>
                        <td className="px-4 py-3 text-center font-medium">
                          {item.transfer_qty > 0 ? `+${item.transfer_qty}` : item.transfer_qty < 0 ? item.transfer_qty : 0}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-0.5 rounded font-bold ${
                            isLow ? 'bg-red-950 text-red-400 border border-red-900/30' : 'bg-blue-950 text-blue-400'
                          }`}>
                            {item.closing_qty}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-semibold text-gray-200 block">₹{item.closing_qty * item.purchase_price}</span>
                          <span className="text-[10px] text-brand-textMuted block">Rate: ₹{item.purchase_price} / S: ₹{item.selling_price}</span>
                        </td>
                        {user.role !== 'Staff' && (
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center space-x-2">
                              <button onClick={() => openEditModal(item)} className="p-1 hover:text-blue-400 transition" title="Edit Product">
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              {user.role === 'Admin' && (
                                <button onClick={() => handleDeleteProduct(item.product_id)} className="p-1 hover:text-red-400 transition" title="Delete Product">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: Product Master Form */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg glass-panel rounded-2xl p-6 relative">
            <button onClick={() => setShowProductModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-semibold text-gray-200 mb-4">{editingProduct ? 'Edit Product Parameters' : 'Register New Product'}</h3>
            
            <form onSubmit={handleProductSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-[11px] font-semibold text-brand-textMuted uppercase block mb-1">Brand Name</label>
                  <input
                    type="text"
                    value={prodForm.brand_name}
                    onChange={(e) => setProdForm({ ...prodForm, brand_name: e.target.value })}
                    className="w-full bg-brand-panelBg border border-brand-border text-gray-200 text-xs rounded-lg p-2.5 outline-none"
                    required
                  />
                </div>
                
                <div>
                  <label className="text-[11px] font-semibold text-brand-textMuted uppercase block mb-1">Category</label>
                  <select
                    value={prodForm.category}
                    onChange={(e) => setProdForm({ ...prodForm, category: e.target.value })}
                    className="w-full bg-brand-panelBg border border-brand-border text-gray-200 text-xs rounded-lg p-2.5 outline-none"
                  >
                    {['Whisky', 'Beer', 'Rum', 'Vodka', 'Wine', 'Gin', 'Tequila'].map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-brand-textMuted uppercase block mb-1">Bottle Size</label>
                  <select
                    value={prodForm.size}
                    onChange={(e) => setProdForm({ ...prodForm, size: e.target.value })}
                    className="w-full bg-brand-panelBg border border-brand-border text-gray-200 text-xs rounded-lg p-2.5 outline-none"
                  >
                    {['180ml', '375ml', '650ml', '750ml', '1000ml'].map(sz => (
                      <option key={sz} value={sz}>{sz}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-brand-textMuted uppercase block mb-1">Barcode (Optional)</label>
                  <input
                    type="text"
                    value={prodForm.barcode}
                    onChange={(e) => setProdForm({ ...prodForm, barcode: e.target.value })}
                    className="w-full bg-brand-panelBg border border-brand-border text-gray-200 text-xs rounded-lg p-2.5 outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-brand-textMuted uppercase block mb-1">Min Stock Threshold</label>
                  <input
                    type="number"
                    value={prodForm.min_stock}
                    onChange={(e) => setProdForm({ ...prodForm, min_stock: e.target.value })}
                    className="w-full bg-brand-panelBg border border-brand-border text-gray-200 text-xs rounded-lg p-2.5 outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-brand-textMuted uppercase block mb-1">Purchase Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={prodForm.purchase_price}
                    onChange={(e) => setProdForm({ ...prodForm, purchase_price: e.target.value })}
                    className="w-full bg-brand-panelBg border border-brand-border text-gray-200 text-xs rounded-lg p-2.5 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-brand-textMuted uppercase block mb-1">Selling Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={prodForm.selling_price}
                    onChange={(e) => setProdForm({ ...prodForm, selling_price: e.target.value })}
                    className="w-full bg-brand-panelBg border border-brand-border text-gray-200 text-xs rounded-lg p-2.5 outline-none"
                    required
                  />
                </div>

                {!editingProduct && (
                  <div className="col-span-2">
                    <label className="text-[11px] font-semibold text-brand-textMuted uppercase block mb-1">Opening Stock Quantity (Assigned to all shops)</label>
                    <input
                      type="number"
                      value={prodForm.opening_qty}
                      onChange={(e) => setProdForm({ ...prodForm, opening_qty: e.target.value })}
                      className="w-full bg-brand-panelBg border border-brand-border text-gray-200 text-xs rounded-lg p-2.5 outline-none"
                    />
                  </div>
                )}
              </div>

              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded-xl font-semibold text-xs text-white">
                {editingProduct ? 'Update Product Master' : 'Create Product Master'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Transfer Stock */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-panel rounded-2xl p-6 relative">
            <button onClick={() => setShowTransferModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-semibold text-gray-200 mb-4">Stock Shop-to-Shop Transfer</h3>

            <form onSubmit={handleTransferSubmit} className="space-y-4">
              <div>
                <label className="text-[11px] font-semibold text-brand-textMuted uppercase block mb-1">Select Product</label>
                <select
                  value={transferForm.product_id}
                  onChange={(e) => setTransferForm({ ...transferForm, product_id: e.target.value })}
                  className="w-full bg-brand-panelBg border border-brand-border text-gray-200 text-xs rounded-lg p-2.5 outline-none"
                >
                  {inventory.map(item => (
                    <option key={item.product_id} value={item.product_id}>{item.brand_name} ({item.size}) - Avail: {item.closing_qty}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-semibold text-brand-textMuted uppercase block mb-1">From Shop</label>
                  <select
                    value={transferForm.from_shop_id}
                    onChange={(e) => setTransferForm({ ...transferForm, from_shop_id: e.target.value })}
                    className="w-full bg-brand-panelBg border border-brand-border text-gray-200 text-xs rounded-lg p-2.5 outline-none"
                  >
                    {shops.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-brand-textMuted uppercase block mb-1">To Shop</label>
                  <select
                    value={transferForm.to_shop_id}
                    onChange={(e) => setTransferForm({ ...transferForm, to_shop_id: e.target.value })}
                    className="w-full bg-brand-panelBg border border-brand-border text-gray-200 text-xs rounded-lg p-2.5 outline-none"
                    required
                  >
                    <option value="">Select Target...</option>
                    {shops.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-brand-textMuted uppercase block mb-1">Transfer Quantity</label>
                <input
                  type="number"
                  value={transferForm.qty}
                  onChange={(e) => setTransferForm({ ...transferForm, qty: e.target.value })}
                  className="w-full bg-brand-panelBg border border-brand-border text-gray-200 text-xs rounded-lg p-2.5 outline-none"
                  required
                />
              </div>

              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded-xl font-semibold text-xs text-white">
                Approve & Execute Stock Transfer
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Damage Stock */}
      {showDamageModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-panel rounded-2xl p-6 relative">
            <button onClick={() => setShowDamageModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-semibold text-gray-200 mb-4">Record Damaged / Broken Bottle Stock</h3>

            <form onSubmit={handleDamageSubmit} className="space-y-4">
              <div>
                <label className="text-[11px] font-semibold text-brand-textMuted uppercase block mb-1">Select Product</label>
                <select
                  value={damageForm.product_id}
                  onChange={(e) => setDamageForm({ ...damageForm, product_id: e.target.value })}
                  className="w-full bg-brand-panelBg border border-brand-border text-gray-200 text-xs rounded-lg p-2.5 outline-none"
                >
                  {inventory.map(item => (
                    <option key={item.product_id} value={item.product_id}>{item.brand_name} ({item.size}) - Avail: {item.closing_qty}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-semibold text-brand-textMuted uppercase block mb-1">Shop Context</label>
                  <select
                    value={damageForm.shop_id}
                    onChange={(e) => setDamageForm({ ...damageForm, shop_id: e.target.value })}
                    className="w-full bg-brand-panelBg border border-brand-border text-gray-200 text-xs rounded-lg p-2.5 outline-none"
                  >
                    {shops.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-brand-textMuted uppercase block mb-1">Wastage Quantity</label>
                  <input
                    type="number"
                    value={damageForm.qty}
                    onChange={(e) => setDamageForm({ ...damageForm, qty: e.target.value })}
                    className="w-full bg-brand-panelBg border border-brand-border text-gray-200 text-xs rounded-lg p-2.5 outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-brand-textMuted uppercase block mb-1">Damage Description (e.g. Broke on receipt)</label>
                <textarea
                  value={damageForm.description}
                  onChange={(e) => setDamageForm({ ...damageForm, description: e.target.value })}
                  className="w-full bg-brand-panelBg border border-brand-border text-gray-200 text-xs rounded-lg p-2.5 h-20 outline-none resize-none"
                  required
                />
              </div>

              <button type="submit" className="w-full bg-red-600 hover:bg-red-500 py-3 rounded-xl font-semibold text-xs text-white">
                Log Wastage & Deduct Stock
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
