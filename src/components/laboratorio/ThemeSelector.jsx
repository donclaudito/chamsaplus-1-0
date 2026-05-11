import React from 'react';
import { Sun, Moon, Eye } from 'lucide-react';

const THEMES = [
  { id: 'light', label: 'Claro', icon: Sun, bg: 'bg-white', border: 'border-slate-200', preview: 'bg-white text-slate-900' },
  { id: 'dark', label: 'Escuro', icon: Moon, bg: 'bg-slate-900', border: 'border-slate-700', preview: 'bg-slate-900 text-white' },
  { id: 'contrast', label: 'Alto Contraste', icon: Eye, bg: 'bg-black', border: 'border-yellow-400', preview: 'bg-black text-yellow-400' },
];

export default function ThemeSelector({ activeTheme, onChange }) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      {THEMES.map(t => {
        const Icon = t.icon;
        const isActive = activeTheme === t.id;
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className={`
              flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all
              ${isActive ? 'border-primary shadow-md scale-[1.03]' : `${t.border} opacity-70 hover:opacity-100 hover:scale-[1.01]`}
            `}
            style={isActive ? { boxShadow: '0 0 0 3px hsl(var(--primary)/0.2)' } : {}}
            aria-label={t.label}
            aria-pressed={isActive}
          >
            {/* Mini preview swatch */}
            <span className={`w-5 h-5 rounded-md border ${t.border} ${t.bg} flex items-center justify-center`}>
              <Icon className="w-3 h-3" style={{ color: t.id === 'contrast' ? '#facc15' : t.id === 'dark' ? '#fff' : '#1e293b' }} />
            </span>
            <span>{t.label}</span>
            {isActive && (
              <span className="ml-1 w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            )}
          </button>
        );
      })}
    </div>
  );
}