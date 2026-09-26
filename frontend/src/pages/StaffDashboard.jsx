import React, { useState, useEffect } from 'react';
import { dashboardAPI, tasksAPI } from '../services/api';
import { CheckSquare, Clock, CheckCircle2, PlayCircle, RefreshCw } from 'lucide-react';
import { getPriorityColor, getStatusColor } from '../utils/helpers';

export const StaffDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await dashboardAPI.getStaff();
      setData(res.data);
    } catch (err) {
      console.error('Failed to fetch:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (taskId, newStatus) => {
    try {
      await tasksAPI.updateStatus(taskId, newStatus);
      await fetchData();
    } catch (err) {
      alert('Failed to update status: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleEscalate = async (taskId) => {
    const blockerReason = window.prompt('What is blocking this task?');
    if (!blockerReason) return;
    try {
      await tasksAPI.escalate(taskId, blockerReason);
      await fetchData();
    } catch (err) {
      alert('Failed to escalate: ' + (err.response?.data?.detail || err.message));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-8 h-8 text-sky-400 animate-spin" />
      </div>
    );
  }

  const tasks = data?.my_tasks || [];
  const summary = data?.summary || {};

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <CheckSquare className="w-8 h-8 text-sky-400" />
          My Assigned Tasks
        </h1>
        <p className="text-sm text-slate-400">Track and update your operational work orders</p>
      </div>

      {/* Summary KPI */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 text-center">
          <p className="text-xs text-slate-400 mb-1">Pending</p>
          <p className="text-2xl font-bold text-yellow-400">{summary.pending || 0}</p>
        </div>
        <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 text-center">
          <p className="text-xs text-slate-400 mb-1">In Progress</p>
          <p className="text-2xl font-bold text-blue-400">{summary.in_progress || 0}</p>
        </div>
        <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 text-center">
          <p className="text-xs text-slate-400 mb-1">Completed Today</p>
          <p className="text-2xl font-bold text-emerald-400">{summary.completed_today || 0}</p>
        </div>
      </div>

      {/* Tasks List */}
      <div className="space-y-4">
        {tasks.length === 0 ? (
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <p className="text-slate-300 font-medium">You have no pending tasks right now!</p>
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-5 shadow-lg"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-base font-bold text-white">{task.title}</h3>
                  <p className="text-xs text-slate-400 mt-1">{task.description}</p>
                  {task.room_number && (
                    <span className="inline-block mt-2 px-2 py-0.5 bg-slate-900 text-sky-300 text-xs font-semibold rounded border border-slate-700">
                      Room {task.room_number}
                    </span>
                  )}
                  {task.is_overdue && (
                    <p className="text-xs font-semibold text-red-400 mt-2">Overdue by {task.minutes_overdue} min</p>
                  )}
                  {task.blocker_reason && (
                    <p className="text-xs text-orange-300 mt-1">Blocked: {task.blocker_reason}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 text-[10px] font-semibold rounded-full border ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                  <span className={`px-2 py-0.5 text-[10px] font-medium rounded border ${getStatusColor(task.status)}`}>
                    {task.status}
                  </span>
                </div>
              </div>

              {/* Status Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-700/60 mt-4">
                {task.status === 'PENDING' && (
                  <button
                    onClick={() => handleUpdateStatus(task.id, 'ASSIGNED')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition"
                  >
                    <PlayCircle className="w-4 h-4" />
                    <span>Accept Task</span>
                  </button>
                )}

                {task.status === 'ASSIGNED' && (
                  <button
                    onClick={() => handleUpdateStatus(task.id, 'IN_PROGRESS')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition"
                  >
                    <PlayCircle className="w-4 h-4" />
                    <span>Start Work</span>
                  </button>
                )}

                {task.status === 'IN_PROGRESS' && (
                  <button
                    onClick={() => handleUpdateStatus(task.id, 'COMPLETED')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Mark Complete</span>
                  </button>
                )}

                {task.status !== 'COMPLETED' && task.status !== 'ESCALATED' && (
                  <button
                    onClick={() => handleEscalate(task.id)}
                    className="px-3 py-1.5 text-xs font-semibold text-red-400 bg-red-500/10 border border-red-200 rounded-lg transition"
                  >
                    Report Blocker
                  </button>
                )}

                {task.status === 'COMPLETED' && (
                  <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    Completed
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
