import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const body = await req.json();
    const { userId, approved } = body;

    if (!userId || typeof userId !== 'string') {
      return Response.json({ error: 'userId inválido ou ausente' }, { status: 400 });
    }
    if (typeof approved !== 'boolean') {
      return Response.json({ error: 'approved deve ser um booleano' }, { status: 400 });
    }

    await base44.asServiceRole.entities.User.update(userId, {
      is_approved: approved,
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});