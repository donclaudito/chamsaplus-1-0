import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { label, baseUrl, endpoint, method, secretName, authHeader, exampleJson, color, bg, border } = body;

    if (!label) {
      return Response.json({ error: 'Campo "label" é obrigatório.' }, { status: 400 });
    }

    const VALID_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
    const resolvedMethod = (method || 'POST').toUpperCase();
    if (!VALID_METHODS.includes(resolvedMethod)) {
      return Response.json({ error: `Método HTTP inválido: "${method}". Permitidos: ${VALID_METHODS.join(', ')}` }, { status: 400 });
    }

    if (baseUrl && !/^https?:\/\/.+/.test(baseUrl)) {
      return Response.json({ error: 'baseUrl deve ser uma URL válida começando com http:// ou https://' }, { status: 400 });
    }

    const record = await base44.asServiceRole.entities.CustomIntegration.create({
      label,
      baseUrl: baseUrl || '',
      endpoint: endpoint || '/chat/completions',
      method: resolvedMethod,
      secretName: secretName || '',
      authHeader: authHeader || 'Bearer {API_KEY}',
      exampleJson: exampleJson || '',
      color: color || 'text-violet-600',
      bg: bg || 'bg-violet-50',
      border: border || 'border-violet-200',
    });

    return Response.json({ success: true, record });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});