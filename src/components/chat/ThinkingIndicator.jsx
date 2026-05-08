import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bot } from 'lucide-react';

const stages = [
  '🔬 Percepção — Analisando dados...',
  '🧠 Hipótese — Formulando raciocínio...',
  '⚡ Contraditório — Estressando cenários...',
  '✅ Síntese — Consolidando resposta...',
];

const ThinkingIndicator = React.memo(function ThinkingIndicator() {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStage(prev => (prev < stages.length - 1 ? prev + 1 : prev));
    }, 1800);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-1">
        <Bot className="w-4 h-4 text-primary animate-pulse" />
      </div>
      <div className="bg-card border border-border rounded-2xl rounded-tl-md px-4 py-3">
        <motion.p
          key={stage}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-muted-foreground"
        >
          {stages[stage]}
        </motion.p>
        <div className="flex gap-1 mt-2">
          {stages.map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all duration-500 ${
                i <= stage ? 'bg-primary w-6' : 'bg-muted w-3'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
});

export default ThinkingIndicator;