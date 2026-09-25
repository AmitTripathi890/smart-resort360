import React, { useState, useEffect } from 'react';
import { dashboardAPI } from '../services/api';
import { Building2, Users, Clock, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export const FrontDeskDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await dashboardAPI.getFrontDesk();
      setData(res.data);
    } catch (err) {
      console.error('Failed to fetch:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-8 h-8 text-sky-400 animate-spin" />
      </div>
    );
  }

  const roomReadiness = data?.room_readiness || {};

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <Building2 className="w-8 h-8 text-sky-400" />
          Front Desk Operations
        </h1>
        <p className="text-sm text-slate-400">Today's arrivals, departures, and room readiness</p>
      </div>

      {/* Room Readiness Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4">
          <p className="text-xs text-slate-400 mb-1">Clean & Ready</p>
          <p className="text-2xl font-bold text-emerald-400">{roomReadiness.clean || 0}</p>
        </div>
        <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4">
          <p className="text-xs text-slate-400 mb-1">Dirty / Needs Cleaning</p>
          <p className="text-2xl font-bold text-orange-400">{roomReadiness.dirty || 0}</p>
        </div>
        <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4">
          <p className="text-xs text-slate-400 mb-1">Inspecting</p>
          <p className="text-2xl font-bold text-yellow-400">{roomReadiness.inspecting || 0}</p>
        </div>
        <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4">
          <p className="text-xs text-slate-400 mb-1">Maintenance</p>
          <p className="text-2xl font-bold text-red-400">{roomReadiness.maintenance || 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Check-Ins */}
        <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            Today's Check-Ins ({data?.todays_check_ins?.length || 0})
          </h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {(data?.todays_check_ins || []).map((booking) => (
              <div
                key={booking.id}
                className="bg-slate-900/50 border border-slate-700/60 rounded-lg p-3 hover:border-sky-500/40 transition"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-white text-sm">{booking.guest_name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Room {booking.room_number} • {booking.guests_count} guests
                    </p>
                  </div>
                  {booking.early_arrival && (
                    <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-semibold rounded">
                      EARLY {booking.expected_arrival_time}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Today's Check-Outs */}
        <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-400" />
            Today's Check-Outs ({data?.todays_check_outs?.length || 0})
          </h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {(data?.todays_check_outs || []).map((booking) => (
              <div
                key={booking.id}
                className="bg-slate-900/50 border border-slate-700/60 rounded-lg p-3"
              >
                <p className="font-semibold text-white text-sm">{booking.guest_name}</p>
                <p className="text-xs text-slate-400 mt-0.5">Room {booking.room_number}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
