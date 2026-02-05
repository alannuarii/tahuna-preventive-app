const { query } = require('../config/db');
const { engines } = require('../data/engineData');

exports.getMaterialsByUnit = async (req, res) => {
    const { unit } = req.query;

    if (!unit) {
        return res.status(400).json({ message: 'Unit parameter is required' });
    }

    const engine = engines.find(e => e.unit == unit);
    if (!engine) {
        return res.status(400).json({ message: `Invalid unit: ${unit}` });
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

        res.json({
            materials: rows.map(row => ({
                ...row,
                jumlah: parseFloat(row.jumlah) // Ensure number
            }))
        });
    } catch (error) {
        console.error('Error fetching materials:', error);
        res.status(500).json({ message: 'Failed to fetch materials' });
    }
};
