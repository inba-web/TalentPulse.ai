import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  loading?: boolean;
  children?: React.ReactNode;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger',
  loading = false,
  children,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const themes = {
    danger: {
      btn: 'bg-danger hover:bg-danger/90 text-white focus:ring-danger/20',
      icon: 'text-danger bg-red-50',
    },
    warning: {
      btn: 'bg-warning hover:bg-warning/90 text-white focus:ring-warning/20',
      icon: 'text-warning bg-amber-50',
    },
    info: {
      btn: 'bg-primary hover:bg-primary/90 text-white focus:ring-primary/20',
      icon: 'text-primary bg-blue-50',
    },
  };

  const theme = themes[type] || themes.danger;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-surface max-w-md w-full rounded-xl border border-border shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-border">
          <h3 className="font-bold text-text">{title}</h3>
          <button onClick={onCancel} className="text-secondary hover:text-text rounded p-0.5 hover:bg-slate-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-4">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-full ${theme.icon}`}>
              <AlertTriangle className="w-6 h-6 flex-shrink-0" />
            </div>
            <div className="space-y-1">
              <p className="text-sm text-secondary leading-relaxed">{message}</p>
            </div>
          </div>
          {children}
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-border bg-slate-50/50 flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 border border-border rounded-lg text-xs font-semibold text-text hover:bg-slate-100 disabled:opacity-50 transition duration-150"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 rounded-lg text-xs font-semibold focus:ring-4 focus:outline-none disabled:opacity-50 transition duration-150 ${theme.btn}`}
          >
            {loading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
