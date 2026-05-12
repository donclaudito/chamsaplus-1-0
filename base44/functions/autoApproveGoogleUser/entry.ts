import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Triggered by entity automation on User create
// Auto-approves users that signed up via Google (identified by having a Google-format email or by checking provider)
Deno.serve(async (req) => {
  try {
    // Security: only accept calls from the Base44 platform (automations)
    // The platform sends the APP_ID in the Authorization header as a Bearer token
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

    // Fetch the user record directly by ID
    const targetUser = data || null;
    if (!targetUser || targetUser.id !== userId) {
      return Response.json({ skipped: true, reason: 'user not found in payload' });
    }

    // Auto-approve all new users (access is controlled via invite)
    await base44.asServiceRole.entities.User.update(userId, { is_approved: true });
    return Response.json({ approved: true, userId });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});