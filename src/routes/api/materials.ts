import { query } from '~/lib/db';
import { engines } from '~/lib/engineData';

export async function GET({ request }: any) {
  const url = new URL(request.url);
  const unit = url.searchParams.get('unit');

  if (!unit) {
    return new Response(JSON.stringify({ message: 'Unit parameter is required' }), { status: 400 });
  }

  const engine = engines.find(e => e.unit == parseInt(unit));
  if (!engine) {
    return new Response(JSON.stringify({ message: `Invalid unit: ${unit}` }), { status: 400 });
  }

  try {
    const sql = `
      SELECT 
          m.id,
          m.name as nama,
          m.unit as satuan,
          mmc.qty_per_pm as jumlah,
          mmc.interval_pm as cycle
      FROM materials m
      JOIN machine_material_configs mmc ON m.id = mmc.material_id
      WHERE mmc.machine_name = $1
      ORDER BY m.name ASC
    `;

    const rows = await query(sql, [engine.mesin]);

    return new Response(JSON.stringify({
      materials: rows.map((row: any) => ({
        ...row,
        jumlah: parseFloat(row.jumlah)
      }))
    }), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Error fetching materials:', error);
    return new Response(JSON.stringify({ message: 'Failed to fetch materials' }), { status: 500 });
  }
}
