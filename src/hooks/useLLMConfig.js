import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { detectModel, MODELS } from '@/lib/modelRouter';

const PROVIDER_LABELS = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  groq: 'Groq',
  google: 'Google AI',
  mistral: 'Mistral AI',
  together: 'Together AI',
};

export function useLLMConfig() {
  const [manualModel, setManualModel] = useState(null);
  const [activeModel, setActiveModel] = useState('claude_sonnet_4_6');
  const [activeLLMBadge, setActiveLLMBadge] = useState(null);

  useEffect(() => {
    base44.entities.UserLLMConfig.filter({ is_active: true })
      .then((configs) => {
        if (configs?.length > 0) {
          const cfg = configs[0];
          setActiveLLMBadge({
            label: PROVIDER_LABELS[cfg.provider] || cfg.provider,
            modelId: cfg.model_id,
            provider: cfg.provider,
          });
        } else {
          setActiveLLMBadge(null);
        }
      })
      .catch(() => setActiveLLMBadge(null));
  }, []);

  const resolveModel = (text, hasDataBlocks, hasVectorContext) => {
    const chosen = manualModel || detectModel(text, hasDataBlocks, hasVectorContext);
    setActiveModel(chosen);
    return chosen;
  };

  const updateBadgeFromConfig = (config) => {
    if (config) {
      setActiveLLMBadge({
        label: PROVIDER_LABELS[config.provider] || config.provider,
        modelId: config.model_id,
        provider: config.provider,
      });
    } else {
      setActiveLLMBadge(null);
    }
  };

  return {
    manualModel,
    setManualModel,
    activeModel,
    activeLLMBadge,
    resolveModel,
    updateBadgeFromConfig,
    MODELS,
  };
}