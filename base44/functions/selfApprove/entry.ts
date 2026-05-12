import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// ─── Domínios que NÃO passam pela aprovação manual ────────────────────────
// Gmail é sempre liberado (usuários Google OAuth).
// Adicione aqui domínios institucionais parceiros.
const APPROVED_DOMAINS = [
  'gmail.com',
  'googlemail.com',
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

/**
 * Chamado pelo frontend logo após o login.
 * Aprova automaticamente usuários de domínios parceiros ou Gmail (Google OAuth).
 * Usuários de outros domínios precisam de aprovação manual do admin.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Já aprovado — nada a fazer
    if (user.is_approved === true) {
      return Response.json({ already_approved: true });
    }

    const email = user.email || '';
    const domain = email.split('@')[1]?.toLowerCase();
    const isApprovedDomain = domain && APPROVED_DOMAINS.some(d => domain === d || domain.endsWith('.' + d));

    if (!isApprovedDomain) {
      // Domínio não parceiro — aguarda aprovação manual
      return Response.json({
        approved: false,
        reason: 'domain_not_approved',
        message: `Domínio "${domain}" requer aprovação manual.`,
      });
    }

    // Aprova usando service role
    await base44.asServiceRole.entities.User.update(user.id, { is_approved: true });
    console.log(`[selfApprove] Aprovado automaticamente: ${email} (domínio: ${domain})`);

    return Response.json({ approved: true, userId: user.id, domain });
  } catch (error) {
    console.error('[selfApprove] Erro:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});