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
    CRITICAL: 'bg-red-500/10 text-red-400 border-red-500/20',
    HIGH: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    MEDIUM: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    LOW: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  };
  return colors[priority] || colors.MEDIUM;
}

export function getStatusColor(status) {
  const colors = {
    PENDING: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    IN_PROGRESS: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    COMPLETED: 'bg-green-500/10 text-green-400 border-green-500/20',
    APPROVED: 'bg-green-500/10 text-green-400 border-green-500/20',
    REJECTED: 'bg-red-500/10 text-red-400 border-red-500/20',
    MODIFIED: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    CANCELLED: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    ORDERED: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    RECEIVED: 'bg-green-500/10 text-green-400 border-green-500/20',
  };
  return colors[status] || colors.PENDING;
}

export function getRiskColor(risk) {
  const colors = {
    CRITICAL: 'text-red-400',
    HIGH: 'text-orange-400',
    MEDIUM: 'text-yellow-400',
    LOW: 'text-green-400',
  };
  return colors[risk] || colors.LOW;
}
