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
      btn: 'bg-danger hover:bg-danger/90 text-white',
      icon: 'text-danger bg-danger/10',
    },
    warning: {
      btn: 'bg-warning hover:bg-warning/90 text-white',
      icon: 'text-warning bg-warning/10',
    },
    info: {
      btn: 'bg-primary hover:bg-primary/90 text-white',
      icon: 'text-primary bg-primary/10',
    },
  };

  const theme = themes[type] || themes.danger;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80">
      <div className="bg-surface-1 max-w-md w-full rounded border border-border-primary shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">

        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-border-primary bg-surface-2">
          <h3 className="font-bold text-text-primary text-sm">{title}</h3>
          <button onClick={onCancel} className="text-text-muted hover:text-text-primary rounded p-0.5 hover:bg-surface-elevated transition">
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
              <p className="text-sm text-text-secondary leading-relaxed">{message}</p>
            </div>
          </div>
          {children}
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-border-primary bg-surface-2 flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 border border-border-primary rounded text-xs font-semibold text-text-secondary hover:bg-surface-elevated disabled:opacity-50 transition duration-150 cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 rounded text-xs font-semibold disabled:opacity-50 transition duration-150 cursor-pointer ${theme.btn}`}
          >
            {loading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
