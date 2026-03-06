/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const db = require('./connection');

async function migrate() {
  const sql = fs.readFileSync(
    path.join(__dirname, 'migrations', '001_initial_schema.sql'),
    'utf8'
  );
  await db.query(sql);
  console.log('Migration completed successfully.');
  await db.end();
}

migrate().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
