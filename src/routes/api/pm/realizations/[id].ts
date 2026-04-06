import { query } from '~/lib/db';

export async function GET({ request, params }: any) {
  const id = parseInt(params.id);
  if (isNaN(id)) return new Response(JSON.stringify({ message: 'Invalid id format' }), { status: 400 });

  try {
    const realizations = await query(`SELECT * FROM pm_realizations WHERE id = $1`, [id]);
    if (realizations.length === 0) return new Response(JSON.stringify({ message: 'Not found' }), { status: 404 });

    const realization = realizations[0];
    const materials = await query(`SELECT * FROM pm_realization_materials WHERE realization_id = $1 ORDER BY id`, [id]);

    return new Response(JSON.stringify({ ...realization, materials }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ message: 'Failed to fetch realization detail' }), { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const id = parseInt(params.id);
  if (isNaN(id)) return new Response(JSON.stringify({ message: 'Invalid id' }), { status: 400 });

  try {
    const result = await query(`DELETE FROM pm_realizations WHERE id = $1 RETURNING id`, [id]);
    if (result.length === 0) return new Response(JSON.stringify({ message: 'Not found' }), { status: 404 });

    return new Response(JSON.stringify({ success: true, message: 'Deleted' }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ message: 'Server error' }), { status: 500 });
  }
}
