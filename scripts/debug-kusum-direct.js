const { Pool } = require('pg');
require('dotenv').config();

async function main() {
    console.log("🔍 Direct DB Query for Kusum...");
    const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
    
    const pool = new Pool({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        const client = await pool.connect();
        console.log("✅ Connected to DB.");
        
        // Find users with 'Kusum' in name or matching the email in screenshot
        const res = await client.query(`
            SELECT id, email, name, "isActive", password 
            FROM users 
            WHERE name ILIKE '%Kusum%' 
            OR email = 'teleservice.crm@gmail.com'
        `);

        if (res.rows.length > 0) {
            console.log("\n✅ Users Found:");
            res.rows.forEach(user => {
                console.log(`   - ID: ${user.id}`);
                console.log(`   - Name: ${user.name}`);
                console.log(`   - Email: ${user.email}`);
                console.log(`   - Active: ${user.isActive}`);
                console.log(`   - Password Hash length: ${user.password ? user.password.length : 0}`);
            });
        } else {
            console.log("\n❌ No matching users found.");
        }
        
        client.release();
    } catch (err) {
        console.error("❌ DB Query Error:", err);
    } finally {
        await pool.end();
    }
}

main();
