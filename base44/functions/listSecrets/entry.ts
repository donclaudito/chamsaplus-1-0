/**
 * listSecrets
 * Retorna quais secrets conhecidos estão injetados no ambiente (sem expor os valores).
 * Apenas admins podem acessar.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const KNOWN_SECRETS = [
  'GROQ_API_KEY',
  'OPENAI_API_KEY',
  'ANTHROPIC_API_KEY',
  'GOOGLE_API_KEY',
  'MISTRAL_API_KEY',
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const result = KNOWN_SECRETS.map((name) => {
      const value = Deno.env.get(name) || '';
      return {
        name,
        configured: value.length > 0,
      };
    });

    console.info(`[listSecrets] Admin ${user.email} consultou secrets em ${new Date().toISOString()}`);

    return Response.json({ secrets: result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});