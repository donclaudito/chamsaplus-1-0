import { useState, useEffect, useDebugValue } from 'react';
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

const buildBadge = (cfg) =>
  cfg ? { label: PROVIDER_LABELS[cfg.provider] || cfg.provider, modelId: cfg.model_id, provider: cfg.provider } : null;

const fetchActiveLLMConfig = () =>
  base44.entities.UserLLMConfig.filter({ is_active: true });

export function useLLMConfig() {
  const [manualModel, setManualModel] = useState(null);
  const [activeModel, setActiveModel] = useState('claude_sonnet_4_6');
  const [activeLLMBadge, setActiveLLMBadge] = useState(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);

  useDebugValue(activeLLMBadge ? `provider: ${activeLLMBadge.provider}` : "base44 default");

  useEffect(() => {
    setIsLoadingConfig(true);
    fetchActiveLLMConfig()
      .then((configs) => setActiveLLMBadge(configs?.length > 0 ? buildBadge(configs[0]) : null))
      .catch(() => setActiveLLMBadge(null))
      .finally(() => setIsLoadingConfig(false));
  }, []);

  const resolveModel = (text, hasDataBlocks, hasVectorContext) => {
    const chosen = manualModel || detectModel(text, hasDataBlocks, hasVectorContext);
    setActiveModel(chosen);
    return chosen;
  };

  const updateBadgeFromConfig = (config) => setActiveLLMBadge(buildBadge(config));

  return {
    manualModel,
    setManualModel,
    activeModel,
    activeLLMBadge,
    isLoadingConfig,
    resolveModel,
    updateBadgeFromConfig,
    MODELS,
  };
}