const { query } = require('../config/db');
const { generatePMSchedule } = require('../utils/pmSchedule');

exports.getPMSchedule = async (req, res) => {
    const { start, end } = req.query;

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
        res.json(schedule);
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({
            message: 'Failed to generate PM schedule'
        });
    }
};
