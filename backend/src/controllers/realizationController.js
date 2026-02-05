const { query } = require('../config/db');
const { engines } = require('../data/engineData');

exports.getRealizations = async (req, res) => {
    const { start, end, unit, page = 1, limit = 10 } = req.query;

    let whereClause = `WHERE 1=1`;
    const params = [];
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

        if (parseInt(limit) > 0) {
            dataSql += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
            dataParams.push(limit, offset);
        }

        const realizations = await query(dataSql, dataParams);

        res.json({
            data: realizations,
            meta: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: parseInt(limit) > 0 ? Math.ceil(total / limit) : 1
            }
        });
    } catch (error) {
        console.error('Error fetching realizations:', error);
        res.status(500).json({ message: 'Failed to fetch realizations' });
    }
};

exports.getRealizationDetail = async (req, res) => {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid id parameter' });
    }

    try {
        const realizations = await query(
            `SELECT * FROM pm_realizations WHERE id = $1`,
            [id]
        );

        if (realizations.length === 0) {
            return res.status(404).json({ message: 'Realization not found' });
        }

        const realization = realizations[0];

        const materials = await query(
            `SELECT * FROM pm_realization_materials WHERE realization_id = $1 ORDER BY id`,
            [id]
        );

        res.json({
            ...realization,
            materials
        });
    } catch (error) {
        console.error('Error fetching realization:', error);
        res.status(500).json({ message: 'Failed to fetch realization' });
    }
};

exports.createRealization = async (req, res) => {
    const { tanggal_pelaksanaan, unit, jenis_pm, catatan, materials } = req.body;

    if (!tanggal_pelaksanaan || !unit || !jenis_pm) {
        return res.status(400).json({ message: 'Missing required fields: tanggal_pelaksanaan, unit, jenis_pm' });
    }

    const engine = engines.find(e => e.unit == unit);
    if (!engine) {
        return res.status(400).json({ message: `Invalid unit: ${unit}` });
    }

    try {
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
                        material.nama || material.nama_material, // frontend might send different key
                        material.jumlah_standar,
                        material.jumlah_realisasi,
                        material.satuan,
                        material.cycle
                    ]
                );
            }
        }

        res.json({
            success: true,
            id: realizationId,
            message: 'Realization created successfully'
        });
    } catch (error) {
        console.error('Error creating realization:', error);
        res.status(500).json({ message: 'Failed to create realization' });
    }
};

exports.deleteRealization = async (req, res) => {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid id parameter' });
    }

    try {
        const result = await query(
            `DELETE FROM pm_realizations WHERE id = $1 RETURNING id`,
            [id]
        );

        if (result.length === 0) {
            return res.status(404).json({ message: 'Realization not found' });
        }

        res.json({
            success: true,
            message: 'Realization deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting realization:', error);
        res.status(500).json({ message: 'Failed to delete realization' });
    }
};
