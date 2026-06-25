import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { dealer_uid, visitor_id, event_type } = body;

    if (!dealer_uid || !event_type) {
      return Response.json({ status: 'error', details: 'dealer_uid and event_type required' }, { status: 400 });
    }

    const validEvents = ['widget_opened', 'calculation_performed', 'article_copied'];
    if (!validEvents.includes(event_type)) {
      return Response.json({ status: 'error', details: 'invalid event_type' }, { status: 400 });
    }

    await base44.asServiceRole.entities.WidgetEvent.create({
      dealer_uid,
      visitor_id: visitor_id || null,
      event_type
    });

    return Response.json({ status: 'success' });
  } catch (error) {
    return Response.json({ status: 'error', details: error.message }, { status: 500 });
  }
});