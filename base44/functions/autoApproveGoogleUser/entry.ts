import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// ─── Lista de domínios de instituições médicas parceiras ───────────────────
// Adicione ou remova domínios conforme necessário.
// Usuários com esses domínios são aprovados automaticamente ao se cadastrar.
const APPROVED_DOMAINS = [
  'einstein.br',
  'hsl.org.br',
  'hospitalsiriolibanes.org.br',
  'hc.fm.usp.br',
  'unifesp.br',
  'fmusp.br',
  'fiocruz.br',
  'inca.gov.br',
  'into.saude.gov.br',
  'saude.gov.br',
  'humanitas.com.br',
  'redemedica.com.br',
  'hospitalbp.com.br',
  'hospitalmoinhos.org.br',
  'hcor.com.br',
  'unimed.com.br',
  'unimedfortaleza.com.br',
  'unimedgoiania.coop.br',
];

// Triggered by entity automation on User create
Deno.serve(async (req) => {
  try {
    // Security: only accept calls from the Base44 platform (automations)
    const authHeader = req.headers.get('Authorization') || '';
    const appId = Deno.env.get('BASE44_APP_ID');
    if (!appId || authHeader !== `Bearer ${appId}`) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { event, data } = body;

    if (event?.type !== 'create') {
      return Response.json({ skipped: true });
    }

    const userId = event?.entity_id;
    if (!userId) return Response.json({ skipped: true, reason: 'no entity_id' });

    const targetUser = data || null;
    if (!targetUser || targetUser.id !== userId) {
      return Response.json({ skipped: true, reason: 'user not found in payload' });
    }

    const email = targetUser.email || '';
    const domain = email.split('@')[1]?.toLowerCase();

    // Verifica se é domínio parceiro
    const isPartner = domain && APPROVED_DOMAINS.some(d => domain === d || domain.endsWith('.' + d));

    // Verifica se veio via Google (provider OAuth — não precisa de aprovação manual)
    const isGoogleAuth = email.endsWith('@gmail.com') || targetUser.provider === 'google';

    if (isPartner || isGoogleAuth) {
      await base44.asServiceRole.entities.User.update(userId, { is_approved: true });
      const reason = isPartner ? `domínio parceiro: ${domain}` : 'login via Google';
      console.log(`[autoApproveGoogleUser] Aprovado automaticamente: ${email} — ${reason}`);
      return Response.json({ approved: true, userId, reason });
    }

    // Domínio desconhecido — aguarda aprovação manual
    console.log(`[autoApproveGoogleUser] Aguardando aprovação manual: ${email} (domínio: ${domain})`);
    return Response.json({ approved: false, email, domain, reason: 'domínio não parceiro — aprovação manual necessária' });

  } catch (error) {
    console.error('[autoApproveGoogleUser] Erro:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});