const { query } = require('../config/db');

exports.getServiceHours = async (req, res) => {
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
        res.json(rows);
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ message: 'Failed to fetch service hours' });
    }
};
