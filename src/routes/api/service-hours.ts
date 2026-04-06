import { query } from '~/lib/db';

export async function GET() {
  try {
    const sqlQuery = `
      SELECT waktu, unit, ganti_oli, overhaul AS jamoperasi FROM (
        SELECT waktu, unit, ganti_oli, overhaul
        FROM service_hour
        ORDER BY id DESC
        LIMIT 7
      ) AS subquery
      ORDER BY unit ASC;
    `;
    const rows = await query(sqlQuery);
    return new Response(JSON.stringify(rows), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('Database error:', err);
    return new Response(JSON.stringify({ message: 'Failed to fetch service hours' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
