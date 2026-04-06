import { query } from '~/lib/db';
import { generatePMSchedule } from '~/lib/pmSchedule';

export async function GET({ request }: any) {
  const url = new URL(request.url);
  const start = url.searchParams.get('start');
  const end = url.searchParams.get('end');

  const sqlQuery = `
    SELECT unit, overhaul AS jamoperasi FROM (
      SELECT unit, overhaul
      FROM service_hour
      ORDER BY id DESC
      LIMIT 7
    ) AS subquery
    ORDER BY unit ASC;
  `;

  try {
    const units = await query(sqlQuery);
    const schedule = generatePMSchedule(units, start || null, end || null);
    
    return new Response(JSON.stringify(schedule), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('Database error:', err);
    return new Response(JSON.stringify({ message: 'Failed to generate PM schedule' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
