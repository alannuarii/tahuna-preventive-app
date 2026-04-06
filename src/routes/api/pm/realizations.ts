import { query } from '~/lib/db';
import { engines } from '~/lib/engineData';

export async function GET({ request }: any) {
  const url = new URL(request.url);
  const start = url.searchParams.get('start');
  const end = url.searchParams.get('end');
  const unit = url.searchParams.get('unit');
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '10');

  let whereClause = `WHERE 1=1`;
  const params: any[] = [];
  let paramIndex = 1;

  if (start) {
    whereClause += ` AND r.tanggal_pelaksanaan >= $${paramIndex}`;
    params.push(start);
    paramIndex++;
  }

  if (end) {
    whereClause += ` AND r.tanggal_pelaksanaan <= $${paramIndex}`;
    params.push(end);
    paramIndex++;
  }

  if (unit) {
    whereClause += ` AND r.unit = $${paramIndex}`;
    params.push(parseInt(unit));
    paramIndex++;
  }

  try {
    const countSql = `SELECT COUNT(*) as total FROM pm_realizations r ${whereClause}`;
    const countResult = await query(countSql, params);
    const total = parseInt(countResult[0]?.total || 0);

    const offset = (page - 1) * limit;
    let dataSql = `
      SELECT 
        r.id,
        r.tanggal_pelaksanaan,
        r.unit,
        r.mesin,
        r.jenis_pm,
        r.catatan,
        r.created_at,
        r.updated_at
      FROM pm_realizations r
      ${whereClause}
      ORDER BY r.tanggal_pelaksanaan DESC, r.created_at DESC
    `;

    const dataParams = [...params];

    if (limit > 0) {
      dataSql += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      dataParams.push(limit, offset);
    }

    const realizations = await query(dataSql, dataParams);

    return new Response(JSON.stringify({
      data: realizations,
      meta: {
        total,
        page,
        limit,
        totalPages: limit > 0 ? Math.ceil(total / limit) : 1
      }
    }), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Error fetching realizations:', error);
    return new Response(JSON.stringify({ message: 'Failed to fetch realizations' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

export async function POST({ request }: any) {
  try {
    const body = await request.json();
    const { tanggal_pelaksanaan, unit, jenis_pm, catatan, materials } = body;

    if (!tanggal_pelaksanaan || !unit || !jenis_pm) {
      return new Response(JSON.stringify({ message: 'Missing required fields' }), { status: 400 });
    }

    const engine = engines.find(e => e.unit == unit);
    if (!engine) {
      return new Response(JSON.stringify({ message: `Invalid unit: ${unit}` }), { status: 400 });
    }

    const realizationResult = await query(
      `INSERT INTO pm_realizations (tanggal_pelaksanaan, unit, mesin, jenis_pm, catatan)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [tanggal_pelaksanaan, unit, engine.mesin, jenis_pm, catatan || null]
    );

    const realizationId = realizationResult[0].id;

    if (materials && Array.isArray(materials) && materials.length > 0) {
      for (const material of materials) {
        await query(
          `INSERT INTO pm_realization_materials 
           (realization_id, nama_material, jumlah_standar, jumlah_realisasi, satuan, cycle)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            realizationId,
            material.nama || material.nama_material,
            material.jumlah_standar,
            material.jumlah_realisasi,
            material.satuan,
            material.cycle
          ]
        );
      }
    }

    return new Response(JSON.stringify({ success: true, id: realizationId, message: 'Realization created' }), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Error creating realization:', error);
    return new Response(JSON.stringify({ message: 'Failed to create realization' }), { status: 500 });
  }
}
