import React, { useState } from 'react';
import { guestRequestsAPI } from '../services/api';
import { QrCode, Send, CheckCircle2, AlertCircle } from 'lucide-react';

export const GuestRequest = () => {
  const [formData, setFormData] = useState({
    room_number: '',
    guest_name: '',
    request_type: 'AC/Maintenance',
    description: '',
    priority: 'MEDIUM'
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const requestTypes = [
    'AC/Maintenance',
    'Housekeeping/Towels',
    'F&B/Room Service',
    'Amenities',
    'Luggage',
    'Other'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await guestRequestsAPI.create(formData);
      setSubmitted(true);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit request');
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      room_number: '',
      guest_name: '',
      request_type: 'AC/Maintenance',
      description: '',
      priority: 'MEDIUM'
    });
    setSubmitted(false);
    setError('');
  };

  if (submitted) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-slate-800/80 border border-slate-700 rounded-2xl p-8 text-center shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Request Submitted Successfully!</h2>
          <p className="text-sm text-slate-400 mb-6">
            Your request has been routed to the appropriate department. Our team will respond shortly.
          </p>
          <button
            onClick={handleReset}
            className="px-6 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-lg shadow-lg transition"
          >
            Submit Another Request
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-8">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-forest-900 mb-4 shadow-btn">
            <QrCode className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Guest Service Request</h1>
          <p className="text-sm text-slate-400">
            Submit operational requests requiring staff attention or coordination
          </p>
        </div>

        {/* Form */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-8 shadow-2xl backdrop-blur">
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Room Number *
                </label>
                <input
                  type="text"
                  required
                  value={formData.room_number}
                  onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                  placeholder="e.g., 301"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Guest Name (Optional)
                </label>
                <input
                  type="text"
                  value={formData.guest_name}
                  onChange={(e) => setFormData({ ...formData, guest_name: e.target.value })}
                  placeholder="Your name"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Request Type *
              </label>
              <select
                required
                value={formData.request_type}
                onChange={(e) => setFormData({ ...formData, request_type: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-sky-500"
              >
                {requestTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Request Description *
              </label>
              <textarea
                required
                rows={5}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Please describe your request in detail. For maintenance issues, include symptoms and location."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-sky-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Urgency Level
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['LOW', 'MEDIUM', 'HIGH'].map((priority) => (
                  <button
                    key={priority}
                    type="button"
                    onClick={() => setFormData({ ...formData, priority })}
                    className={`py-2 px-4 rounded-lg text-sm font-semibold transition ${
                      formData.priority === priority
                        ? 'bg-sky-600 text-white shadow-md'
                        : 'bg-slate-900 text-slate-300 hover:bg-slate-750 border border-slate-700'
                    }`}
                  >
                    {priority}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-base disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
              <span>{loading ? 'Submitting...' : 'Submit Service Request'}</span>
            </button>

            <p className="text-xs text-slate-500 text-center mt-4">
              Your request will be routed to the appropriate department and tracked operationally.
            </p>
          </form>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-slate-500">
            For simple requests like extra towels, you may also ask staff directly without submitting a form.
          </p>
        </div>
      </div>
    </div>
  );
};
