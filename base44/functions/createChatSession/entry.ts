import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, messages } = await req.json();

    const newSession = await base44.asServiceRole.entities.ChatSession.create({
      title: title || 'Nova Consulta',
      messages: messages || [],
      created_by: user.email,
    });

    return Response.json(newSession);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});