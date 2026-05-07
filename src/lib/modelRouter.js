// Model registry — three routing tiers
export const MODELS = [
  {
    id: 'claude_sonnet_4_6',
    label: 'Deep',
    description: 'Raciocínio clínico complexo, diagnóstico diferencial profundo',
    credits: '↑↑ Alto custo de créditos',
    tier: 'deep',
    provider: 'native',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/30',
    color: 'text-violet-400',
  },
  {
    id: 'llama-3.3-70b-versatile',
    label: 'Balanced',
    description: 'Análise clínica padrão — Llama 3.3 70B via Groq',
    credits: '→ Custo baixo, alta velocidade',
    tier: 'balanced',
    provider: 'custom', // uses callLlama3 backend function
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    color: 'text-blue-400',
  },
  {
    id: 'gpt_5_mini',
    label: 'Fast',
    description: 'Respostas rápidas e factuais, perguntas simples',
    credits: '↓ Custo mínimo de créditos',
    tier: 'fast',
    provider: 'native',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    color: 'text-emerald-400',
  },
];

// Keywords that trigger deeper reasoning
const DEEP_KEYWORDS = [
  'diagnóstico', 'diagnosis', 'diferencial', 'differential',
  'síndrome', 'syndrome', 'protocolo', 'protocol',
  'emergência', 'emergency', 'risco', 'risk',
  'interação', 'interaction', 'medicament', 'drug',
  'prognóstico', 'prognosis', 'sepse', 'sepsis',
  'laudo', 'exame', 'hemograma', 'troponina', 'creatinina',
];

const MID_KEYWORDS = [
  'tratamento', 'treatment', 'manejo', 'management',
  'dose', 'dosage', 'prescrição', 'prescription',
  'acompanhamento', 'follow-up', 'resultado', 'result',
];

/**
 * Auto-detects the best model ID based on query complexity.
 * Returns the model ID string.
 */
export function detectModel(text, hasDataBlocks = false) {
  if (hasDataBlocks) return 'claude_sonnet_4_6'; // Always Deep for data blocks

  const lower = text.toLowerCase();
  const isDeep = DEEP_KEYWORDS.some(kw => lower.includes(kw)) || text.length > 400;
  if (isDeep) return 'claude_sonnet_4_6';

  const isMid = MID_KEYWORDS.some(kw => lower.includes(kw)) || text.length > 150;
  if (isMid) return 'llama-3.3-70b-versatile';

  return 'gpt_5_mini';
}

/**
 * Returns full model metadata by ID.
 */
export function getModelById(id) {
  return MODELS.find(m => m.id === id) || MODELS[0];
}