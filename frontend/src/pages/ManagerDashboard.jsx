import React, { useState, useEffect } from 'react';
import { dashboardAPI, recommendationsAPI, departmentsAPI } from '../services/api';
import { RecommendationCard } from '../components/RecommendationCard';
import { Toast } from '../components/Toast';
import {
  Activity,
  AlertTriangle,
  Bed,
  Calendar,
  Sparkles,
  TrendingUp,
  Users,
  AlertCircle,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { formatDateTime } from '../utils/helpers';
import { getDepartmentNameForCategory, getDepartmentNameForRecommendation, matchesDepartment } from '../utils/departments';

export const ManagerDashboard = () => {
  const [data, setData] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('pending'); // pending | all
  const [activeQueue, setActiveQueue] = useState('overdue_tasks');
  const [notification, setNotification] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dashRes, recRes, departmentsRes] = await Promise.all([
        dashboardAPI.getManager(),
        recommendationsAPI.getAll(),
        departmentsAPI.getAll()
      ]);
      setData(dashRes.data);
      setRecommendations(recRes.data);
      setDepartments(departmentsRes.data);
    } catch (err) {
      console.error('Failed to fetch dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    setProcessing(true);
    try {
      await recommendationsAPI.approve(id);
      await fetchData();
      setNotification({
        type: 'success',
        message: 'Recommendation approved. A department action is ready for assignment.'
      });
    } catch (err) {
      setNotification({
        type: 'error',
        message: 'Failed to approve: ' + (err.response?.data?.detail || err.message)
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (id) => {
    setProcessing(true);
    try {
      await recommendationsAPI.reject(id, { action: 'REJECT', modified_notes: 'Manager declined recommendation' });
      await fetchData();
      setNotification({ type: 'success', message: 'Recommendation rejected.' });
    } catch (err) {
      setNotification({
        type: 'error',
        message: 'Failed to reject: ' + (err.response?.data?.detail || err.message)
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleModify = async (id, modifyData) => {
    setProcessing(true);
    try {
      await recommendationsAPI.modify(id, modifyData);
      await fetchData();
      setNotification({ type: 'success', message: 'Modified recommendation approved and executed.' });
    } catch (err) {
      setNotification({
        type: 'error',
        message: 'Failed to modify: ' + (err.response?.data?.detail || err.message)
      });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-8 h-8 text-sky-400 animate-spin" />
      </div>
    );
  }

  const kpis = data?.kpis || {};
  const queues = data?.attention_queues || {};
  const queueLabels = {
    overdue_tasks: 'Overdue Tasks',
    blocked_tasks: 'Blocked Tasks',
    escalated_tasks: 'Escalated Tasks',
    critical_tasks: 'Critical Tasks',
    guest_issues: 'Guest Issues',
    inventory_risks: 'Inventory Risks',
  };
  const activeQueueItems = queues[activeQueue] || [];
  const departmentMatchesItem = (item) => matchesDepartment(
    item.department || getDepartmentNameForCategory(item.category || item.request_type),
    selectedDepartment
  );
  const filteredQueueItems = activeQueueItems.filter(departmentMatchesItem);
  const filteredRecommendations = recommendations.filter((recommendation) => matchesDepartment(
    getDepartmentNameForRecommendation(recommendation),
    selectedDepartment
  ));
  const pending = filteredRecommendations.filter(r => r.status === 'PENDING');
  const displayRecs = activeTab === 'pending' ? pending : filteredRecommendations;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Toast
        message={notification?.message}
        type={notification?.type}
        onDismiss={() => setNotification(null)}
      />
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-brass-50 border border-brass-200 flex items-center justify-center shadow-card">
            <Activity className="w-6 h-6 text-brass-700" />
          </span>
          Manager Command Center
        </h1>
        <p className="text-sm text-slate-400">
          Today's operations, decisions requiring attention, and accountable follow-through
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <Bed className="w-5 h-5 text-sky-400" />
            <span className="text-xs font-semibold text-slate-400">TODAY</span>
          </div>
          <p className="text-3xl font-bold text-white">{kpis.current_occupancy_pct}%</p>
          <p className="text-xs text-slate-400 mt-1">
            {kpis.occupied_rooms}/{kpis.total_rooms} rooms occupied
          </p>
        </div>

        <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <Calendar className="w-5 h-5 text-emerald-400" />
            <span className="text-xs font-semibold text-slate-400">TOMORROW</span>
          </div>
          <p className="text-3xl font-bold text-white">{kpis.tomorrow_check_ins}</p>
          <p className="text-xs text-slate-400 mt-1">Expected arrivals</p>
        </div>

        <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <span className="text-xs font-semibold text-slate-400">AI INSIGHTS</span>
          </div>
          <p className="text-3xl font-bold text-white">{kpis.pending_recommendations}</p>
          <p className="text-xs text-slate-400 mt-1">Pending recommendations</p>
        </div>

        <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <AlertTriangle className="w-5 h-5 text-orange-400" />
            <span className="text-xs font-semibold text-slate-400">OPEN RISKS</span>
          </div>
          <p className="text-3xl font-bold text-white">{kpis.critical_tasks}</p>
          <p className="text-xs text-slate-400 mt-1">Critical or high-priority tasks</p>
        </div>
      </div>

      {/* Manager attention queue */}
      <section className="surface p-5 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-charcoal-900">Today's operations</h2>
            <p className="text-xs text-charcoal-500 mt-1">The work that needs a decision, assignment, or follow-up.</p>
          </div>
          <span className="ai-label">Operations queue</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {[
            ['overdue_tasks', 'Overdue tasks', kpis.overdue_tasks, 'text-status-criticalText'],
            ['blocked_tasks', 'Blocked', kpis.blocked_tasks, 'text-status-warningText'],
            ['escalated_tasks', 'Escalated', kpis.escalated_tasks, 'text-status-criticalText'],
            ['critical_tasks', 'Critical tasks', kpis.critical_tasks, 'text-status-criticalText'],
            ['guest_issues', 'Guest issues', kpis.open_guest_issues, 'text-forest-700'],
            ['inventory_risks', 'Inventory risks', kpis.inventory_risks, 'text-brass-700']
          ].map(([key, label, value, color]) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveQueue(key)}
              className={`text-left bg-ivory-100 border rounded-lg p-3 transition ${activeQueue === key ? 'border-forest-600 ring-2 ring-forest-100' : 'border-ivory-300 hover:border-forest-400'}`}
            >
              <p className="text-[11px] font-semibold uppercase tracking-wide text-charcoal-500">{label}</p>
              <p className={`text-2xl font-bold mt-1 ${color}`}>{value || 0}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="surface p-5 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-charcoal-900">{queueLabels[activeQueue]}</h2>
            <p className="text-xs text-charcoal-500 mt-1">The records behind the selected attention count.</p>
          </div>
          <span className="text-sm font-semibold text-forest-700">{filteredQueueItems.length} shown</span>
        </div>
        {filteredQueueItems.length === 0 ? (
          <p className="text-sm text-charcoal-500 py-4">Nothing requires attention in this queue.</p>
        ) : (
          <div className="space-y-2">
            {filteredQueueItems.map((item) => (
              <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 border border-ivory-300 rounded-lg px-4 py-3 bg-ivory-50">
                <div>
                  <p className="text-sm font-semibold text-charcoal-900">
                    {item.room_number ? `Room ${item.room_number} · ` : ''}{item.title || item.request_type || item.name}
                  </p>
                  <p className="text-xs text-charcoal-500 mt-1">{item.description || item.department || item.unit || 'Operational follow-up required'}</p>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold">
                  {item.priority && <span className="px-2 py-1 rounded bg-brass-50 text-brass-700">{item.priority}</span>}
                  {item.status && <span className="px-2 py-1 rounded bg-ivory-200 text-charcoal-700">{item.status}</span>}
                  {item.minutes_overdue > 0 && <span className="text-status-criticalText">{item.minutes_overdue} min overdue</span>}
                  {item.assignee && <span className="text-charcoal-500">{item.assignee}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* AI Recommendations Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            Explainable AI Recommendations
          </h2>
          <div className="flex items-center gap-2">
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white border border-ivory-300 text-charcoal-700"
              aria-label="Filter by department"
            >
              <option value="all">All Departments</option>
              {departments.map((department) => (
                <option key={department.id} value={department.name}>{department.name}</option>
              ))}
            </select>
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                activeTab === 'pending'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              Pending ({pending.length})
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                activeTab === 'all'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              All History
            </button>
          </div>
        </div>

        {displayRecs.length === 0 ? (
          <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-8 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <p className="text-slate-300 font-medium">All recommendations have been reviewed</p>
            <p className="text-xs text-slate-500 mt-1">The AI engine will surface new operational risks automatically</p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayRecs.map((rec) => (
              <RecommendationCard
                key={rec.id}
                recommendation={rec}
                onApprove={handleApprove}
                onReject={handleReject}
                onModify={handleModify}
                isProcessing={processing}
              />
            ))}
          </div>
        )}
      </div>

      {/* Room Status & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Room Status */}
        <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-5">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Bed className="w-4 h-4 text-sky-400" />
            Room Status Breakdown
          </h3>
          <div className="space-y-2">
            {Object.entries(data?.room_status_breakdown || {}).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between py-2 px-3 bg-slate-900/50 rounded-lg">
                <span className="text-xs font-medium text-slate-300 capitalize">{status}</span>
                <span className="text-sm font-bold text-white">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-5">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            Recent Activity
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {(data?.recent_activity || []).map((log) => (
              <div key={log.id} className="text-xs border-l-2 border-slate-700 pl-3 py-1.5">
                <p className="text-slate-300">{log.description}</p>
                <p className="text-slate-500 text-[10px] mt-0.5">{formatDateTime(log.created_at)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
