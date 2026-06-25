import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const uid = body.uid;

    if (!uid) {
      return Response.json({ status: 'error', details: 'uid required' }, { status: 400 });
    }

    const dealers = await base44.asServiceRole.entities.Dealer.filter({ uid }, '-created_date', 5);

    if (!dealers || dealers.length === 0) {
      return Response.json({ status: 'error', details: 'dealer not found' }, { status: 404 });
    }

    const d = dealers[0];
    return Response.json({
      status: 'success',
      dealer: {
        uid: d.uid,
        company_name: d.company_name,
        analytics_enabled: d.analytics_enabled !== false
      }
    });
  } catch (error) {
    return Response.json({ status: 'error', details: error.message }, { status: 500 });
  }
});