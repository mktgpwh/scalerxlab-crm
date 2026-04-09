const { Pool } = require('pg');

async function run() {
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
  const pool = new Pool({ connectionString });

  try {
    // Add new enum values safely before dropping old ones
    try { await pool.query(`ALTER TYPE "LeadStatus" ADD VALUE 'RAW';`); } catch (e) {}
    try { await pool.query(`ALTER TYPE "LeadStatus" ADD VALUE 'QUALIFIED';`); } catch (e) {}
    try { await pool.query(`ALTER TYPE "LeadStatus" ADD VALUE 'WON';`); } catch (e) {}

    // Update existing old statuses
    await pool.query(`UPDATE leads SET status = 'RAW' WHERE status = 'NEW';`);
    await pool.query(`UPDATE leads SET status = 'WON' WHERE status = 'CONVERTED';`);
    await pool.query(`UPDATE leads SET status = 'LOST' WHERE status = 'ARCHIVED';`);

    console.log('Successfully updated statuses');
  } catch(e) {
    console.error('Error:', e);
  } finally {
    await pool.end();
  }
}
run();
