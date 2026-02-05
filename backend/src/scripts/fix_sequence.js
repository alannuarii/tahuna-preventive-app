const { pool } = require('../config/db');

const fixSequence = async () => {
    try {
        console.log('Fixing sequence for pm_realizations...');

        // get max id
        const res = await pool.query('SELECT MAX(id) as max_id FROM pm_realizations');
        const maxId = res.rows[0].max_id || 0;
        console.log(`Max ID found: ${maxId}`);

        // reset sequence
        // Note: We use maxId + 1 to be safe for the next insert
        await pool.query(`SELECT setval('pm_realizations_id_seq', $1)`, [maxId]);

        console.log('Sequence updated successfully.');
    } catch (err) {
        console.error('Error fixing sequence:', err);
    } finally {
        await pool.end();
    }
};

fixSequence();
