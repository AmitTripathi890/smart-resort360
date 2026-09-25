import React, { useState, useEffect } from 'react';
import { dashboardAPI, recommendationsAPI } from '../services/api';
import { RecommendationCard } from '../components/RecommendationCard';
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

export const ManagerDashboard = () => {
  const [data, setData] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('pending'); // pending | all

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dashRes, recRes] = await Promise.all([
        dashboardAPI.getManager(),
        recommendationsAPI.getAll()
      ]);
      setData(dashRes.data);
      setRecommendations(recRes.data);
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
      alert('Recommendation approved! Tasks/POs have been created in the closed-loop workflow.');
    } catch (err) {
      alert('Failed to approve: ' + (err.response?.data?.detail || err.message));
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (id) => {
    setProcessing(true);
    try {
      await recommendationsAPI.reject(id, { action: 'REJECT', modified_notes: 'Manager declined recommendation' });
      await fetchData();
    } catch (err) {
      alert('Failed to reject: ' + (err.response?.data?.detail || err.message));
    } finally {
      setProcessing(false);
    }
  };

  const handleModify = async (id, modifyData) => {
    setProcessing(true);
    try {
      await recommendationsAPI.modify(id, modifyData);
      await fetchData();
      alert('Modified recommendation approved and executed!');
    } catch (err) {
      alert('Failed to modify: ' + (err.response?.data?.detail || err.message));
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
  const pending = recommendations.filter(r => r.status === 'PENDING');
  const displayRecs = activeTab === 'pending' ? pending : recommendations;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg">
            <Activity className="w-6 h-6 text-white" />
          </span>
          Manager Command Center
        </h1>
        <p className="text-sm text-slate-400">
          Operational insights, AI-driven recommendations, and closed-loop decision orchestration
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
            <span className="text-xs font-semibold text-slate-400">AI ENGINE</span>
          </div>
          <p className="text-3xl font-bold text-white">{kpis.pending_recommendations}</p>
          <p className="text-xs text-slate-400 mt-1">Pending recommendations</p>
        </div>

        <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <AlertTriangle className="w-5 h-5 text-orange-400" />
            <span className="text-xs font-semibold text-slate-400">OPERATIONS</span>
          </div>
          <p className="text-3xl font-bold text-white">{kpis.critical_tasks}</p>
          <p className="text-xs text-slate-400 mt-1">High-priority tasks</p>
        </div>
      </div>

      {/* AI Recommendations Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            Explainable AI Recommendations
          </h2>
          <div className="flex items-center gap-2">
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
