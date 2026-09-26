import React, { useState, useEffect } from 'react';
import { activityLogAPI } from '../services/api';
import { History, Filter, RefreshCw, Sparkles, CheckCircle2, AlertCircle, UserCheck } from 'lucide-react';
import { formatDateTime } from '../utils/helpers';

export const ActivityLog = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchLogs();
  }, [filter]);

  const fetchLogs = async () => {
    try {
      const res = await activityLogAPI.getAll(100, filter === 'all' ? null : filter);
      setLogs(res.data);
    } catch (err) {
      console.error('Failed to fetch activity log:', err);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (actionType) => {
    if (actionType.includes('APPROVED')) return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
    if (actionType.includes('RECOMMENDATION')) return <Sparkles className="w-4 h-4 text-indigo-400" />;
    if (actionType.includes('TASK')) return <UserCheck className="w-4 h-4 text-sky-400" />;
    if (actionType.includes('RISK')) return <AlertCircle className="w-4 h-4 text-orange-400" />;
    return <History className="w-4 h-4 text-slate-400" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-8 h-8 text-sky-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <History className="w-8 h-8 text-purple-400" />
          Activity Audit Log
        </h1>
        <p className="text-sm text-slate-400">
          Comprehensive audit trail of operational decisions, approvals, and task completions
        </p>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3 mb-6">
        <Filter className="w-4 h-4 text-slate-400" />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-sky-500"
        >
          <option value="all">All Activity</option>
          <option value="RECOMMENDATION_APPROVED">Recommendations Approved</option>
          <option value="RECOMMENDATION_REJECTED">Recommendations Rejected</option>
          <option value="TASK_ASSIGNED">Tasks Assigned</option>
          <option value="TASK_STATUS_UPDATED">Task Status Changes</option>
          <option value="PO_CREATED">Purchase Orders Created</option>
          <option value="GUEST_REQUEST_SUBMITTED">Guest Requests</option>
        </select>
      </div>

      {/* Activity Timeline */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-6">
        <div className="space-y-3">
          {logs.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No activity logs found for this filter.</p>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className="border-l-2 border-slate-700 pl-4 py-2 hover:border-sky-500/50 transition"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{getActionIcon(log.action_type)}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-bold text-forest-700 uppercase tracking-wider">
                        {log.action_type.replace(/_/g, ' ')}
                      </p>
                      <span className="text-xs text-slate-500">{formatDateTime(log.created_at)}</span>
                    </div>
                    <p className="text-sm text-charcoal-700 leading-relaxed">{log.description}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-xs text-charcoal-500">By:</span>
                      <span className="text-xs font-semibold text-charcoal-900">{log.user_name}</span>
                      <span className="px-1.5 py-0.5 bg-sage-50 text-forest-700 text-[10px] rounded border border-sage-200">
                        {log.user_role}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
