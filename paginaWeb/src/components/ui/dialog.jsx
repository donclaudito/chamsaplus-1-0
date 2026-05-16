import React from 'react';
import { X } from 'lucide-react';

export function Dialog({ open, onOpenChange, children }) {
  if (!open) return null;
  return (
    <div className="dialog-overlay" onClick={() => onOpenChange(false)}>
      <div className="dialog-content relative" onClick={(e) => e.stopPropagation()}>
        <button 
          className="dialog-close" 
          onClick={() => onOpenChange(false)}
        >
          <X className="w-5 h-5" />
        </button>
        {children}
      </div>
    </div>
  );
}

export function DialogContent({ children, className = "" }) {
  return <div className={`grow flex flex-col overflow-hidden ${className}`}>{children}</div>;
}

export function DialogHeader({ children, className = "" }) {
  return <div className={`dialog-header ${className}`}>{children}</div>;
}

export function DialogTitle({ children, className = "" }) {
  return <h2 className={`dialog-title ${className}`}>{children}</h2>;
}
