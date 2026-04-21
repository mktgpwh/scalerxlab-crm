const { Pool } = require('pg');
require('dotenv').config();

async function main() {
    console.log("🔍 Auditing User Passwords...");
    const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
    
    const pool = new Pool({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        const client = await pool.connect();
        
        const res = await client.query(`
            SELECT email, name, "isActive", password 
            FROM users 
            WHERE password IS NULL OR LENGTH(password) = 0
        `);

        if (res.rows.length > 0) {
            console.log(`\n🚨 Found ${res.rows.length} user(s) with MISSING passwords:`);
            res.rows.forEach(user => {
                console.log(`   - ${user.name} (${user.email}) | Active: ${user.isActive}`);
            });
        } else {
            console.log("\n✅ All users have passwords set.");
        }
        
        client.release();
    } catch (err) {
        console.error("❌ DB Query Error:", err);
    } finally {
        await pool.end();
    }
}

main();
