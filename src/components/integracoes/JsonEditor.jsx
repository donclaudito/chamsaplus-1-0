import React, { useState, useEffect } from 'react';

export default function JsonEditor({ value, onChange, readOnly = false }) {
  const [error, setError] = useState(null);
  const [raw, setRaw] = useState(typeof value === 'string' ? value : JSON.stringify(value, null, 2));

  useEffect(() => {
    setRaw(typeof value === 'string' ? value : JSON.stringify(value, null, 2));
  }, [value]);

  const handleChange = (e) => {
    const txt = e.target.value;
    setRaw(txt);
    try {
      const parsed = JSON.parse(txt);
      setError(null);
      onChange && onChange(parsed);
    } catch {
      setError('JSON inválido');
    }
  };

  return (
    <div className="relative">
      <textarea
        readOnly={readOnly}
        value={raw}
        onChange={handleChange}
        className={`w-full font-mono text-xs rounded-lg border p-3 resize-none outline-none transition-colors leading-relaxed
          ${error ? 'border-red-400 bg-red-50' : 'border-border bg-muted/50 focus:border-primary'}
          ${readOnly ? 'opacity-60 cursor-not-allowed' : ''}
        `}
        rows={7}
        spellCheck={false}
      />
      {error && <p className="text-[10px] text-red-500 mt-1">{error}</p>}
    </div>
  );
}