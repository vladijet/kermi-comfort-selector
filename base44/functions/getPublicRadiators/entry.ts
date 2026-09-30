import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    if (typeof body.article === 'string' && body.article.trim()) {
      const radiators = await base44.asServiceRole.entities.Radiator.filter(
        { article: body.article.trim().slice(0, 64) }, '-created_date', 1
      );
      return Response.json({ status: 'success', radiators });
    }
    const series = body.series || 'profil';
    const type = Number(body.type);

    const radiators = await base44.asServiceRole.entities.Radiator.filter(
      { series, radiator_type: type },
      'height',
      1000
    );

    return Response.json({ status: 'success', radiators });
  } catch (error) {
    return Response.json({ status: 'error', details: error.message }, { status: 500 });
  }
});