const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Initializing Intelligence Matrix views...');
  
  const sqlPath = path.join(__dirname, 'setup-views.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  // Split by semicolon but ignore ones inside quotes if any (simple split works for this script)
  const commands = sql.split(';').filter(cmd => cmd.trim());

  for (const cmd of commands) {
    try {
      console.log(`Executing: ${cmd.slice(0, 50)}...`);
      await prisma.$executeRawUnsafe(cmd);
    } catch (error) {
      console.error('❌ Failed to execute command:', error.message);
    }
  }

  console.log('✅ Views initialized successfully.');
}

main()
  .catch(e => {
    console.error('💥 Fatal error during view setup:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
