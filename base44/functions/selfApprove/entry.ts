import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Chamado pelo frontend logo após o login.
 * Se o usuário está autenticado mas ainda não tem is_approved = true,
 * esta função o aprova automaticamente (service role).
 * Qualquer usuário autenticado pode chamar esta função para se auto-aprovar.
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

    // Aprova usando service role
    await base44.asServiceRole.entities.User.update(user.id, { is_approved: true });

    return Response.json({ approved: true, userId: user.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});