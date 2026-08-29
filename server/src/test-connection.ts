import { Client } from 'pg';

async function testPort(host: string, port: number) {
  console.log(`\nTesting connection to ${host}:${port}...`);
  const client = new Client({
    user: 'neondb_owner',
    password: 'npg_oRu5NBIQnj1z',
    host: host,
    database: 'neondb',
    port: port,
    ssl: {
      rejectUnauthorized: false,
      servername: host,
    },
  });

  try {
    await client.connect();
    console.log(`✅ Success! Connected to ${host}:${port}`);
    const res = await client.query('SELECT NOW()');
    console.log(`Database Time: ${res.rows[0].now}`);
    await client.end();
    return true;
  } catch (err: any) {
    console.error(`❌ Failed connecting to ${host}:${port} - Error: ${err.message}`);
    return false;
  }
}

async function run() {
  // Test pooler standard
  await testPort('ep-mute-band-az9eonv9-pooler.c-3.ap-southeast-1.aws.neon.tech', 5432);
  // Test pooler 443
  await testPort('ep-mute-band-az9eonv9-pooler.c-3.ap-southeast-1.aws.neon.tech', 443);
  // Test non-pooler standard
  await testPort('ep-mute-band-az9eonv9.c-3.ap-southeast-1.aws.neon.tech', 5432);
  // Test non-pooler 443
  await testPort('ep-mute-band-az9eonv9.c-3.ap-southeast-1.aws.neon.tech', 443);
}

run();
