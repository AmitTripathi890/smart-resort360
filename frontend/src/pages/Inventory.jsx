import React, { useState, useEffect } from 'react';
import { departmentsAPI, inventoryAPI } from '../services/api';
import { Package, AlertTriangle, CheckCircle2, ShoppingCart, RefreshCw, ArrowUpRight } from 'lucide-react';
import { getStatusColor, formatDateTime } from '../utils/helpers';
import { getDepartmentNameForCategory, matchesDepartment } from '../utils/departments';

export const Inventory = () => {
  const [items, setItems] = useState([]);
  const [pos, setPos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('inventory');
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [itemsRes, posRes, departmentsRes] = await Promise.all([
        inventoryAPI.getItems(),
        inventoryAPI.getPurchaseOrders(),
        departmentsAPI.getAll()
      ]);
      setItems(itemsRes.data);
      setPos(posRes.data);
      setDepartments(departmentsRes.data);
    } catch (err) {
      console.error('Failed to fetch inventory data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReceivePO = async (poId) => {
    try {
      await inventoryAPI.receivePurchaseOrder(poId);
      await fetchData();
      alert('Purchase order marked as received! Inventory restocked.');
    } catch (err) {
      alert('Failed to receive order: ' + (err.response?.data?.detail || err.message));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-8 h-8 text-sky-400 animate-spin" />
      </div>
    );
  }

  const filteredItems = items.filter((item) => matchesDepartment(
    getDepartmentNameForCategory(item.category),
    selectedDepartment
  ));
  const filteredPos = pos.filter((po) => matchesDepartment(
    getDepartmentNameForCategory(po.category),
    selectedDepartment
  ));
  const criticalItems = filteredItems.filter(i => i.stockout_risk === 'CRITICAL' || i.stockout_risk === 'HIGH');

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <Package className="w-8 h-8 text-amber-400" />
          Inventory & Purchase Orders
        </h1>
        <p className="text-sm text-slate-400">
          Predictive stockout alerts based on 7-day occupancy forecast demand
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
            activeTab === 'inventory'
              ? 'bg-sky-600 text-white shadow-md'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          Inventory Items ({items.length})
        </button>
        <button
          onClick={() => setActiveTab('pos')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
            activeTab === 'pos'
              ? 'bg-sky-600 text-white shadow-md'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          Purchase Orders ({pos.length})
        </button>
      </div>

      <div className="flex items-center gap-2 mb-6">
        <label htmlFor="inventory-department" className="text-xs font-semibold text-slate-400">Department</label>
        <select
          id="inventory-department"
          value={selectedDepartment}
          onChange={(e) => setSelectedDepartment(e.target.value)}
          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white border border-ivory-300 text-charcoal-700"
        >
          <option value="all">All Departments</option>
          {departments.map((department) => (
            <option key={department.id} value={department.name}>{department.name}</option>
          ))}
        </select>
      </div>

      {activeTab === 'inventory' && (
        <div className="space-y-6">
          {/* Critical Risk Banner */}
          {criticalItems.length > 0 && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <div>
                  <p className="text-sm font-bold text-red-300">
                    {criticalItems.length} items at critical risk of stockout within lead time!
                  </p>
                  <p className="text-xs text-red-400/80">
                    High occupancy demand requires immediate replenishment.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Inventory Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="bg-slate-800/80 border border-slate-700 rounded-xl p-5 shadow-lg relative overflow-hidden"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="text-[10px] font-mono font-medium text-slate-400 uppercase">
                      {item.category}
                    </span>
                    <h3 className="font-bold text-white text-base">{item.name}</h3>
                  </div>
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold rounded border ${
                      item.stockout_risk === 'CRITICAL'
                        ? 'bg-red-500/20 text-red-400 border-red-500/30'
                        : item.stockout_risk === 'HIGH'
                        ? 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    }`}
                  >
                    {item.stockout_risk} RISK
                  </span>
                </div>

                <div className="space-y-2 text-xs text-slate-300 mb-4 bg-slate-900/60 p-3 rounded-lg border border-slate-700/50">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Current Stock:</span>
                    <span className="font-bold text-white font-mono">{item.current_stock} {item.unit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Reorder Threshold:</span>
                    <span className="font-mono">{item.reorder_threshold} {item.unit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Projected Runout:</span>
                    <span className="font-bold text-amber-300 font-mono">
                      {item.projected_days_left > 30 ? '> 30 days' : `${item.projected_days_left.toFixed(1)} days`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Supplier Lead Time:</span>
                    <span className="font-mono">{item.lead_time_days} days</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'pos' && (
        <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-6 overflow-x-auto">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-sky-400" />
            Purchase Order Execution Trail
          </h2>

          {filteredPos.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No purchase orders created yet.</p>
          ) : (
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/60 text-slate-400 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-3">PO #</th>
                  <th className="p-3">Item Name</th>
                  <th className="p-3">Quantity</th>
                  <th className="p-3">Est. Cost</th>
                  <th className="p-3">Supplier</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Approved By</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {filteredPos.map((po) => (
                  <tr key={po.id} className="hover:bg-slate-750">
                    <td className="p-3 font-mono text-sky-400 font-bold">PO-{po.id}</td>
                    <td className="p-3 font-semibold text-white">{po.item_name}</td>
                    <td className="p-3 font-mono font-bold text-emerald-400">{po.quantity} {po.unit}</td>
                    <td className="p-3 font-mono">${po.estimated_cost?.toFixed(2)}</td>
                    <td className="p-3 text-slate-400">{po.supplier}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 text-[10px] font-semibold rounded border ${getStatusColor(po.status)}`}>
                        {po.status}
                      </span>
                    </td>
                    <td className="p-3 text-slate-300">{po.approved_by || 'System'}</td>
                    <td className="p-3">
                      {po.status === 'ORDERED' ? (
                        <button
                          onClick={() => handleReceivePO(po.id)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold shadow"
                        >
                          Receive & Restock
                        </button>
                      ) : (
                        <span className="text-emerald-400 text-xs font-semibold">Fulfilled ✓</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};
