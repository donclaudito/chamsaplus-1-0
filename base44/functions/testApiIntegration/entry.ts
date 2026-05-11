/**
 * testApiIntegration
 * Testa uma conexão com API externa usando a API Key configurada como Secret.
 * Nunca expõe a chave no frontend.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { url, method = 'POST', body, secret_name, auth_header } = await req.json();

    if (!url) return Response.json({ error: 'url is required' }, { status: 400 });
    if (!/^https?:\/\/.+/.test(url)) {
      return Response.json({ error: 'url deve começar com http:// ou https://' }, { status: 400 });
    }

    // Resolve a API Key pelo nome do secret
    let apiKey = '';
    if (secret_name) {
      apiKey = Deno.env.get(secret_name) || '';
    }

    // Monta os headers
    const headers = { 'Content-Type': 'application/json' };

    if (auth_header && apiKey) {
      const resolvedAuth = auth_header.replace('{API_KEY}', apiKey);
      if (resolvedAuth.startsWith('x-api-key:')) {
        headers['x-api-key'] = resolvedAuth.split('x-api-key:')[1].trim();
        headers['anthropic-version'] = '2023-06-01';
      } else {
        headers['Authorization'] = resolvedAuth;
      }
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    }).finally(() => clearTimeout(timer));

    const responseText = await response.text();
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { raw: responseText };
    }

    if (!response.ok) {
      return Response.json({
        error: `HTTP ${response.status}: ${response.statusText}`,
        details: responseData,
      }, { status: 200 }); // retorna 200 para o frontend processar o erro da API externa
    }

    return Response.json({ success: true, status: response.status, data: responseData });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});