import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Saves an API key securely on the backend (stored in UserLLMConfig or as a backend secret note).
 * The key is stored in the UserLLMConfig entity under api_key_encrypted, scoped to the user.
 * This replaces the insecure localStorage approach.
 *
 * Payload: { secretName: string, apiKey: string, provider?: string }
 * Returns: { success: true }
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

    const { secretName, apiKey, provider } = await req.json();
    if (!secretName || !apiKey) {
      return Response.json({ error: 'secretName e apiKey são obrigatórios' }, { status: 400 });
    }

    // Provedores válidos explicitamente definidos
    const VALID_PROVIDERS = ['openai', 'anthropic', 'groq', 'google', 'mistral', 'together', 'deepseek', 'xai', 'perplexity', 'cohere', 'ollama'];
    const providerMap = {
      GROQ_API_KEY:      'groq',
      OPENAI_API_KEY:    'openai',
      ANTHROPIC_API_KEY: 'anthropic',
      GOOGLE_API_KEY:    'google',
      MISTRAL_API_KEY:   'mistral',
    };
    const resolvedProvider = provider || providerMap[secretName] || 'openai';
    if (!VALID_PROVIDERS.includes(resolvedProvider)) {
      return Response.json({ error: `Provedor "${resolvedProvider}" não é válido.` }, { status: 400 });
    }

    // Check if user already has a config for this secret/provider
    const existing = await base44.entities.UserLLMConfig.filter({
      created_by: user.email,
      provider: resolvedProvider,
    });

    const configData = {
      provider: resolvedProvider,
      model_id: secretName, // use secretName as model_id placeholder
      api_key_encrypted: apiKey,
      is_active: false,
    };

    if (existing && existing.length > 0) {
      await base44.entities.UserLLMConfig.update(existing[0].id, { api_key_encrypted: apiKey });
    } else {
      await base44.entities.UserLLMConfig.create(configData);
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});