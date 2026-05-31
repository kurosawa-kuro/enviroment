// connect.js
const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5433,
  database: 'dev_local',
  user: 'postgres',
  password: 'yourpassword',
});

(async () => {
  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL');

    const res = await client.query('SELECT NOW()');
    console.log('🕒 Server time:', res.rows[0]);

  } catch (err) {
    console.error('❌ Connection error:', err);
  } finally {
    await client.end();
  }
})();
