// Model registry — four routing tiers
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
    id: 'mistral-large-latest',
    label: 'Mistral AI',
    description: 'Raciocínio avançado e versátil via Mistral AI (Ativado localmente)',
    credits: '→ Custo intermediário, alta precisão',
    tier: 'mistral',
    provider: 'custom',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/30',
    color: 'text-rose-400',
  },
  {
    id: 'llama-3.3-70b-versatile',
    label: 'Balanced',
    description: 'Análise clínica padrão — Llama 3.3 70B via Groq',
    credits: '→ Custo baixo, alta velocidade',
    tier: 'balanced',
    provider: 'custom',
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
 *
 * Tiers:
 *  deep      — raciocínio crítico, dados clínicos, emergências
 *  mistral   — priorizado se a chave do Mistral estiver ativa no localStorage
 *  balanced  — análise padrão, tratamentos, RAG com contexto vetorial
 *  fast      — saudações, confirmações, perguntas simples (<80 chars sem keywords)
 */
export function detectModel(text, hasDataBlocks = false, hasVectorContext = false) {
  const hasMistralKey = typeof window !== 'undefined' ? (
    localStorage.getItem('MISTRAL_API_KEY') || 
    localStorage.getItem('LLM_KEY_MISTRAL') ||
    (() => {
      try {
        const cfgs = JSON.parse(localStorage.getItem('chamsa_entity_UserLLMConfig') || '[]');
        return cfgs.some(c => c.provider === 'mistral' && c.api_key_encrypted && c.api_key_encrypted.trim().length > 0) ? 'active' : null;
      } catch { return null; }
    })()
  ) : null;

  if (hasDataBlocks) {
    return hasMistralKey ? 'mistral-large-latest' : 'claude_sonnet_4_6';
  }

  const lower = text.toLowerCase();
  const hasDeepKw = DEEP_KEYWORDS.some(kw => lower.includes(kw));
  const hasMidKw  = MID_KEYWORDS.some(kw => lower.includes(kw));

  // Deep tier: clinical complexity OR long text
  if (hasDeepKw || text.length > 400) {
    return hasMistralKey ? 'mistral-large-latest' : 'claude_sonnet_4_6';
  }

  // Balanced / Mistral: RAG vector context is prioritized here
  if (hasVectorContext) {
    return hasMistralKey ? 'mistral-large-latest' : 'llama-3.3-70b-versatile';
  }

  // Balanced / Mistral: mid-complexity keywords or moderate length
  if (hasMidKw || text.length > 150) {
    return hasMistralKey ? 'mistral-large-latest' : 'llama-3.3-70b-versatile';
  }

  // Fast tier: short queries with no clinical keywords
  return hasMistralKey ? 'mistral-large-latest' : 'gpt_5_mini';
}

/**
 * Returns full model metadata by ID.
 */
export function getModelById(id) {
  return MODELS.find(m => m.id === id) || MODELS[0];
}