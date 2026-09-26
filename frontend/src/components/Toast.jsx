import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

export const Toast = ({ message, type = 'success', onDismiss }) => {
  if (!message) return null;

  const isError = type === 'error';
  const Icon = isError ? XCircle : CheckCircle2;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal-900/45 px-6" role="presentation">
      <div
        className="w-full max-w-lg rounded-xl border border-ivory-300 bg-white p-7 shadow-2xl"
        role="alertdialog"
        aria-modal="true"
        aria-live="assertive"
        aria-label={isError ? 'Error notification' : 'Success notification'}
      >
        <div className="flex flex-col items-center text-center">
          <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-full ${isError ? 'bg-red-50' : 'bg-sage-50'}`}>
            <Icon className={`h-6 w-6 ${isError ? 'text-red-600' : 'text-forest-700'}`} />
          </div>
          <p className="text-base font-semibold leading-6 text-charcoal-900">{message}</p>
          <button
            type="button"
            onClick={onDismiss}
            autoFocus
            className="btn-primary mt-6 min-w-24"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};
