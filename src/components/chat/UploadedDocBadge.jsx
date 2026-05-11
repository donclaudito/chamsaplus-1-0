import React from 'react';
import { FileText, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function UploadedDocBadge({ docs, onRemove }) {
  if (!docs || docs.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 mb-2">
      <AnimatePresence>
        {docs.map((doc) => (
          <motion.div
            key={doc.id}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-medium ${
              doc.status === 'error'
                ? 'bg-destructive/10 border-destructive/30 text-destructive'
                : doc.status === 'ready'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
                : 'bg-primary/10 border-primary/20 text-primary'
            }`}
          >
            {doc.status === 'processing' && <Loader2 className="w-3 h-3 animate-spin shrink-0" />}
            {doc.status === 'ready' && <CheckCircle2 className="w-3 h-3 shrink-0" />}
            {doc.status === 'error' && <AlertCircle className="w-3 h-3 shrink-0" />}
            {doc.status === undefined && <FileText className="w-3 h-3 shrink-0" />}
            <span className="max-w-[140px] truncate">{doc.name}</span>
            {doc.status === 'error' && (
              <span className="text-[10px] opacity-80">— Erro ao processar</span>
            )}
            {doc.status === 'ready' && (
              <span className="text-[10px] opacity-70">— Indexado</span>
            )}
            {doc.status === 'processing' && (
              <span className="text-[10px] opacity-70">— Indexando...</span>
            )}
            <button
              onClick={() => onRemove(doc.id)}
              className="ml-0.5 opacity-60 hover:opacity-100 transition-opacity"
            >
              <X className="w-3 h-3" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}