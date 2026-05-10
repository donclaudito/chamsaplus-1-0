import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Triggered by entity automation on User create
// Auto-approves users that signed up via Google (identified by having a Google-format email or by checking provider)
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const { event, data } = body;

    if (event?.type !== 'create') {
      return Response.json({ skipped: true });
    }

    const userId = event?.entity_id;
    if (!userId) return Response.json({ skipped: true, reason: 'no entity_id' });

    // Fetch the user record
    const users = await base44.asServiceRole.entities.User.list();
    const targetUser = users.find(u => u.id === userId);

    if (!targetUser) return Response.json({ skipped: true, reason: 'user not found' });

    // If auth_provider is 'google', auto-approve
    if (targetUser.auth_provider === 'google') {
      await base44.asServiceRole.entities.User.update(userId, { is_approved: true });
      return Response.json({ approved: true, userId });
    }

    // For email/password users, leave is_approved = false (pending manual approval)
    return Response.json({ approved: false, userId, reason: 'email/password user — awaiting manual approval' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});