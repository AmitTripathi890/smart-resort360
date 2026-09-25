import React, { useState, useEffect } from 'react';
import { dashboardAPI, tasksAPI } from '../services/api';
import { Users, CheckSquare, User, RefreshCw } from 'lucide-react';
import { getPriorityColor, getStatusColor } from '../utils/helpers';

export const DepartmentDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await dashboardAPI.getDepartment();
      setData(res.data);
    } catch (err) {
      console.error('Failed to fetch:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (taskId, staffId) => {
    try {
      await tasksAPI.assign(taskId, staffId);
      await fetchData();
      alert('Task assigned successfully!');
    } catch (err) {
      alert('Failed to assign: ' + (err.response?.data?.detail || err.message));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-8 h-8 text-sky-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <Users className="w-8 h-8 text-indigo-400" />
          {data?.department?.name} Department
        </h1>
        <p className="text-sm text-slate-400">Workload distribution and task assignment</p>
      </div>

      {/* Task Summary */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4">
          <p className="text-xs text-slate-400 mb-1">Pending</p>
          <p className="text-2xl font-bold text-yellow-400">{data?.task_summary?.pending || 0}</p>
        </div>
        <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4">
          <p className="text-xs text-slate-400 mb-1">In Progress</p>
          <p className="text-2xl font-bold text-blue-400">{data?.task_summary?.in_progress || 0}</p>
        </div>
        <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4">
          <p className="text-xs text-slate-400 mb-1">Completed</p>
          <p className="text-2xl font-bold text-emerald-400">{data?.task_summary?.completed || 0}</p>
        </div>
      </div>

      {/* Tasks List */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <CheckSquare className="w-5 h-5 text-sky-400" />
          Department Tasks
        </h2>
        <div className="space-y-3">
          {(data?.tasks || []).map((task) => (
            <div key={task.id} className="bg-slate-900/50 border border-slate-700/60 rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-white text-sm">{task.title}</h3>
                  <p className="text-xs text-slate-400 mt-1">{task.description}</p>
                  {task.room_number && (
                    <span className="inline-block mt-2 px-2 py-0.5 bg-slate-800 text-slate-300 text-xs rounded border border-slate-700">
                      Room {task.room_number}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <span className={`px-2 py-0.5 text-[10px] font-semibold rounded border ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                  <span className={`px-2 py-0.5 text-[10px] font-medium rounded border ${getStatusColor(task.status)}`}>
                    {task.status}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-800">
                <span className="text-xs text-slate-400">Assigned to:</span>
                {task.assignee_id ? (
                  <span className="text-xs font-medium text-white">{task.assigned_to}</span>
                ) : (
                  <select
                    onChange={(e) => handleAssign(task.id, Number(e.target.value))}
                    className="text-xs bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white"
                  >
                    <option value="">-- Assign Staff --</option>
                    {(data?.team_members || []).map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Team Members */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-6">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-emerald-400" />
          Team Members ({data?.team_members?.length || 0})
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {(data?.team_members || []).map((member) => (
            <div key={member.id} className="bg-slate-900/50 border border-slate-700/60 rounded-lg p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-sm font-bold text-sky-400">
                {member.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{member.name}</p>
                <p className="text-xs text-slate-400">{member.email}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
