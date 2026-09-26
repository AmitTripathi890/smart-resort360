import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

export function formatDateTime(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function getPriorityColor(priority) {
  const colors = {
    CRITICAL: 'bg-status-criticalBg text-status-criticalText border-red-200',
    HIGH: 'bg-status-warningBg text-status-warningText border-amber-200',
    MEDIUM: 'bg-brass-50 text-brass-700 border-brass-200',
    LOW: 'bg-status-infoBg text-status-infoText border-blue-200',
  };
  return colors[priority] || colors.MEDIUM;
}

export function getStatusColor(status) {
  const colors = {
    PENDING: 'bg-ivory-200 text-charcoal-600 border-ivory-300',
    IN_PROGRESS: 'bg-status-infoBg text-status-infoText border-blue-200',
    COMPLETED: 'bg-status-successBg text-status-successText border-green-200',
    APPROVED: 'bg-status-successBg text-status-successText border-green-200',
    REJECTED: 'bg-status-criticalBg text-status-criticalText border-red-200',
    MODIFIED: 'bg-sage-50 text-forest-700 border-sage-200',
    CANCELLED: 'bg-ivory-200 text-charcoal-600 border-ivory-300',
    ORDERED: 'bg-status-infoBg text-status-infoText border-blue-200',
    RECEIVED: 'bg-status-successBg text-status-successText border-green-200',
    BLOCKED: 'bg-status-warningBg text-status-warningText border-amber-200',
    ESCALATED: 'bg-status-criticalBg text-status-criticalText border-red-200',
  };
  return colors[status] || colors.PENDING;
}

export function getRiskColor(risk) {
  const colors = {
    CRITICAL: 'text-status-criticalText',
    HIGH: 'text-status-warningText',
    MEDIUM: 'text-brass-700',
    LOW: 'text-status-successText',
  };
  return colors[risk] || colors.LOW;
}
