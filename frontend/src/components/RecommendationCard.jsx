import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  Edit3,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Layers
} from 'lucide-react';
import { getPriorityColor, getStatusColor } from '../utils/helpers';

export const RecommendationCard = ({
  recommendation,
  onApprove,
  onReject,
  onModify,
  isProcessing = false
}) => {
  const [showModifyModal, setShowModifyModal] = useState(false);
  const [modifiedQuantity, setModifiedQuantity] = useState(
    recommendation.metrics_data?.staff_needed ||
    recommendation.metrics_data?.reorder_quantity ||
    1
  );
  const [modifyNotes, setModifyNotes] = useState('');

  const isPending = recommendation.status === 'PENDING';

  const handleModifySubmit = (e) => {
    e.preventDefault();
    onModify(recommendation.id, {
      action: 'MODIFY',
      modified_quantity: Number(modifiedQuantity),
      modified_notes: modifyNotes
    });
    setShowModifyModal(false);
  };

  return (
    <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-5 shadow-lg relative overflow-hidden group hover:border-sky-500/40 transition-all">
      {/* Top Banner & Priority */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider">
            {recommendation.type} • {recommendation.target_date || 'Upcoming'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-0.5 text-[11px] font-semibold rounded-full border ${getPriorityColor(recommendation.priority)}`}>
            {recommendation.priority} PRIORITY
          </span>
          <span className={`px-2 py-0.5 text-[10px] font-medium rounded border ${getStatusColor(recommendation.status)}`}>
            {recommendation.status}
          </span>
        </div>
      </div>

      {/* Main Title & Action */}
      <h3 className="text-base font-bold text-white mb-2 leading-snug">
        {recommendation.title}
      </h3>

      <div className="bg-slate-900/60 rounded-lg p-3 border border-slate-700/50 mb-4">
        <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1 flex items-center gap-1.5">
          <ArrowRight className="w-3.5 h-3.5 text-sky-400" />
          Recommended Action
        </p>
        <p className="text-sm font-semibold text-sky-200">
          {recommendation.recommended_action}
        </p>
      </div>

      {/* Explainable AI Rationale */}
      <div className="space-y-3 mb-5 text-xs text-slate-300">
        <div>
          <span className="font-semibold text-slate-200 block mb-1 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            Why (Operational Rationale):
          </span>
          <p className="text-slate-300 leading-relaxed bg-slate-900/30 p-2.5 rounded border border-slate-800 whitespace-pre-line font-mono text-[11px]">
            {recommendation.explanation}
          </p>
        </div>

        <div>
          <span className="font-semibold text-slate-200 block mb-1 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            Expected Impact:
          </span>
          <p className="text-emerald-300/90 leading-relaxed bg-emerald-950/20 p-2 rounded border border-emerald-900/30">
            {recommendation.expected_impact}
          </p>
        </div>
      </div>

      {/* Action Buttons (Approve / Modify / Reject) */}
      {isPending ? (
        <div className="flex items-center gap-2 pt-3 border-t border-slate-700/60">
          <button
            onClick={() => onApprove(recommendation.id)}
            disabled={isProcessing}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-emerald-900/30 transition disabled:opacity-50"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Approve & Execute</span>
          </button>

          <button
            onClick={() => setShowModifyModal(true)}
            disabled={isProcessing}
            className="flex items-center justify-center gap-1 py-2 px-3 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-medium border border-slate-600 transition"
            title="Modify parameters"
          >
            <Edit3 className="w-3.5 h-3.5 text-indigo-300" />
            <span>Modify</span>
          </button>

          <button
            onClick={() => onReject(recommendation.id)}
            disabled={isProcessing}
            className="flex items-center justify-center gap-1 py-2 px-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs font-medium border border-red-500/30 transition"
            title="Reject recommendation"
          >
            <XCircle className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="pt-3 border-t border-slate-700/60 text-xs text-slate-400 flex items-center justify-between">
          <span>Processed by: <strong className="text-slate-200">{recommendation.approved_by || 'Manager'}</strong></span>
          <span className="font-mono text-[11px] text-emerald-400">Closed-Loop Executed ✓</span>
        </div>
      )}

      {/* Modify Modal */}
      {showModifyModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-indigo-400" />
              Modify Recommendation Parameters
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Adjust recommended values before approving. The closed-loop engine will generate tasks/POs with your modified targets.
            </p>

            <form onSubmit={handleModifySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {recommendation.type === 'staffing' ? 'Adjust Staff Count (Shifts)' : 'Adjust Order Quantity'}
                </label>
                <input
                  type="number"
                  step="any"
                  min="1"
                  required
                  value={modifiedQuantity}
                  onChange={(e) => setModifiedQuantity(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Manager Adjustment Reason / Notes
                </label>
                <textarea
                  rows={3}
                  value={modifyNotes}
                  onChange={(e) => setModifyNotes(e.target.value)}
                  placeholder="e.g. VIP group arriving early, adding 1 extra shift buffer..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-sky-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModifyModal(false)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold shadow-md"
                >
                  Confirm & Execute Modified Action
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
