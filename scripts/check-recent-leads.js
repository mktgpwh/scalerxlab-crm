const { Pool } = require('pg');
require('dotenv').config();

async function main() {
    console.log("🔍 Investigating Recent Leads AI State...");
    const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
    
    const pool = new Pool({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        const client = await pool.connect();
        
        // Fetch 5 most recent leads
        const res = await client.query(`
            SELECT id, name, "whatsappNumber", source, status, intent, category, "aiNotes", "aiLeadScore", metadata, "createdAt"
            FROM leads 
            ORDER BY "createdAt" DESC
            LIMIT 5
        `);

        if (res.rows.length > 0) {
            res.rows.forEach(lead => {
                console.log(`\n--- Lead: ${lead.name} (${lead.id}) ---`);
                console.log(`- Created: ${lead.createdAt}`);
                console.log(`- Source: ${lead.source}`);
                console.log(`- Status: ${lead.status}`);
                console.log(`- Intent: ${lead.intent}`);
                console.log(`- Category: ${lead.category}`);
                console.log(`- AI Lead Score: ${lead.aiLeadScore}`);
                console.log(`- AI Notes: ${lead.aiNotes ? lead.aiNotes.slice(0, 50) + "..." : "EMPTY"}`);
                console.log(`- Metadata: ${JSON.stringify(lead.metadata, null, 2)}`);
            });
        } else {
            console.log("\n❌ No recent leads found.");
        }
        
        client.release();
    } catch (err) {
        console.error("❌ DB Query Error:", err);
    } finally {
        await pool.end();
    }
}

main();
