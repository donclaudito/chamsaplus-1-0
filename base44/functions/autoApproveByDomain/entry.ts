import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// ─── Lista de domínios de instituições médicas parceiras ───────────────────
// Adicione ou remova domínios conforme necessário
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
  'amnhospital.com.br',
  'hospitalbp.com.br',
  'hospitalmoinhos.org.br',
  'hcor.com.br',
  'unimed.com.br',
  'unimedfortaleza.com.br',
  'unimedgoiania.coop.br',
];

Deno.serve(async (req) => {
  try {
    // ─── Autenticação: só aceita chamadas da plataforma Base44 (automações de entidade) ───
    const authHeader = req.headers.get('Authorization') || '';
    const appId = Deno.env.get('BASE44_APP_ID');
    if (!appId || authHeader !== `Bearer ${appId}`) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const payload = await req.json();

    // Pode ser chamado via automação de entidade ou diretamente
    const entityData = payload?.data || payload;
    const userId = entityData?.id || payload?.event?.entity_id;
    const userEmail = entityData?.email;

    if (!userEmail || !userId) {
      return Response.json({ skipped: true, reason: 'Dados insuficientes no payload' });
    }

    // Extrai o domínio do e-mail
    const domain = userEmail.split('@')[1]?.toLowerCase();
    if (!domain) {
      return Response.json({ skipped: true, reason: 'E-mail inválido' });
    }

    // Verifica se o domínio está na lista de parceiros
    const isPartner = APPROVED_DOMAINS.some(d => domain === d || domain.endsWith('.' + d));

    if (!isPartner) {
      return Response.json({
        approved: false,
        reason: `Domínio "${domain}" não está na lista de parceiros. Aguardando aprovação manual.`,
      });
    }

    // Aprova automaticamente
    const base44 = createClientFromRequest(req);
    await base44.asServiceRole.entities.User.update(userId, {
      is_approved: true,
    });

    console.log(`[autoApproveByDomain] Usuário aprovado automaticamente: ${userEmail} (domínio: ${domain})`);

    return Response.json({
      approved: true,
      email: userEmail,
      domain,
      message: `Usuário aprovado automaticamente por domínio parceiro: ${domain}`,
    });
  } catch (error) {
    console.error('[autoApproveByDomain] Erro:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});