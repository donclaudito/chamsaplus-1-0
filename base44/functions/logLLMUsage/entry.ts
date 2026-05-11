import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { model_id, model_label, input_tokens, output_tokens, session_id } = await req.json();

    const rates = {
      'claude_sonnet_4_6': { input: 0.003, output: 0.015 },
      'llama-3.3-70b-versatile': { input: 0.0001, output: 0.0001 },
      'gpt_5_mini': { input: 0.00015, output: 0.0006 },
    };
    const r = rates[model_id] || { input: 0.001, output: 0.002 };
    const estimated_cost_usd = (input_tokens / 1000) * r.input + (output_tokens / 1000) * r.output;

    const now = new Date();
    await base44.asServiceRole.entities.LLMUsageLog.create({
      model_id,
      model_label: model_label || model_id,
      input_tokens,
      output_tokens,
      estimated_cost_usd,
      session_id: session_id || '',
      user_id: user.email,
      date_key: now.toISOString().slice(0, 10),
      month_key: now.toISOString().slice(0, 7),
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});