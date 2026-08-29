import { Client, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Configure dotenv to read parent directory .env
dotenv.config({ path: path.join(__dirname, '../.env') });

// Set WebSocket constructor for serverless environments
neonConfig.webSocketConstructor = ws;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL is not set in .env');
  process.exit(1);
}

const client = new Client({
  connectionString,
});

async function run() {
  console.log('Connecting to Neon database via WebSockets (Port 443)...');
  await client.connect();
  console.log('Successfully connected.');

  const sqlPath = path.join(__dirname, 'migration.sql');
  console.log(`Reading migration SQL from ${sqlPath}...`);
  const sql = fs.readFileSync(sqlPath, 'utf8');

  console.log('Executing schema migration...');
  await client.query(sql);
  console.log('Schema created successfully on Neon!');

  await client.end();
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
