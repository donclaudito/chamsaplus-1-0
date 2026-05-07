/**
 * Chamsa Isa — Model Router
 * 
 * Estratégia de roteamento por complexidade clínica:
 *   DEEP  → claude_sonnet_4_6   (raciocínio profundo, diagnóstico diferencial, protocolos)
 *   MID   → gpt_5_4             (análise moderada, perguntas específicas, dosagens)
 *   FAST  → gpt_5_mini          (saudações, perguntas factuais simples, FAQs)
 */

export const MODELS = [
  {
    id: 'claude_sonnet_4_6',
    label: 'Deep',
    description: 'Diagnóstico complexo · ReAct completo',
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    credits: 'Alto custo',
  },
  {
    id: 'gpt_5_4',
    label: 'Balanced',
    description: 'Análise moderada · Perguntas clínicas',
    color: 'text-primary',
    bg: 'bg-primary/10',
    border: 'border-primary/30',
    credits: 'Custo médio',
  },
  {
    id: 'gpt_5_mini',
    label: 'Fast',
    description: 'FAQs · Saudações · Consultas rápidas',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    credits: 'Baixo custo',
  },
];

// Keywords that indicate deep clinical reasoning is required
const DEEP_KEYWORDS = [
  'diagnóstico', 'protocolo', 'diagnose', 'diferenciar', 'diferencial',
  'hemograma', 'ecg', 'exame', 'laudo', 'resultado', 'hallucination',
  'interação', 'contraindicação', 'emergência', 'urgência', 'score',
  'risco cardiovascular', 'conduta', 'tratamento', 'terapia', 'dose',
  'sindrome', 'síndrome', 'hipertensão', 'diabetes', 'insuficiência',
  'analise', 'analisa', 'análise', 'analisar', 'interpretar', 'avalie',
  'estratégia', 'red flag', 'grave', 'crítico', 'alerta',
];

// Keywords for mid-level complexity
const MID_KEYWORDS = [
  'dosagem', 'medicamento', 'remédio', 'dose', 'posologia', 'recomenda',
  'acompanhamento', 'follow-up', 'monitorar', 'meta', 'objetivo',
  'orientação', 'conduta', 'como tratar', 'qual exame', 'quando',
  'explique', 'explica', 'descreve', 'descreva',
];

/**
 * Auto-detect model based on message content and context.
 * Returns one of the MODELS ids.
 */
export function detectModel(text, hasDataBlocks = false) {
  const lower = text.toLowerCase();

  // If user pasted clinical data → always Deep
  if (hasDataBlocks) return 'claude_sonnet_4_6';

  // Long prompts tend to be complex
  if (text.length > 300) return 'claude_sonnet_4_6';

  // Check deep keywords
  if (DEEP_KEYWORDS.some(kw => lower.includes(kw))) return 'claude_sonnet_4_6';

  // Check mid keywords
  if (MID_KEYWORDS.some(kw => lower.includes(kw))) return 'gpt_5_4';

  // Default: fast for short/simple queries
  return 'gpt_5_mini';
}

export function getModelById(id) {
  return MODELS.find(m => m.id === id) || MODELS[0];
}