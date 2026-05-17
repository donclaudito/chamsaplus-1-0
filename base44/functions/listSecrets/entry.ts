/**
 * listSecrets
 * Retorna quais secrets conhecidos estão injetados no ambiente (sem expor os valores).
 * Apenas admins podem acessar.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const KNOWN_SECRETS = [
  'GROQ',
  'OPENAI',
  'ANTHROPIC',
  'GOOGLE',
  'MISTRAL',
  'DEEPSEEK',
  'XAI',
  'PERPLEXITY',
  'COHERE',
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const result = KNOWN_SECRETS.map((prefix) => {
      const value = Deno.env.get(`ADMIN_${prefix}_API_KEY`) || Deno.env.get(`${prefix}_API_KEY`) || '';
      return {
        name: `${prefix}_API_KEY`,
        configured: value.length > 0,
      };
    });

    console.info(`[listSecrets] Admin ${user.email} consultou secrets em ${new Date().toISOString()}`);

    return Response.json({ secrets: result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});