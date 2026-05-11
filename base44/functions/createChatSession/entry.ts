import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { title, messages } = body;

    if (title !== undefined && typeof title !== 'string') {
      return Response.json({ error: 'title deve ser uma string' }, { status: 400 });
    }
    if (messages !== undefined && !Array.isArray(messages)) {
      return Response.json({ error: 'messages deve ser um array' }, { status: 400 });
    }

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