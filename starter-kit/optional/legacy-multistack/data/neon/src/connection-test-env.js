const { Client } = require('pg');
require('dotenv').config();

// Get connection URL from environment variable
const NEON_DB_URL = process.env.NEON_DB_URL;

if (!NEON_DB_URL) {
  console.error('❌ NEON_DB_URL環境変数が設定されていません');
  process.exit(1);
}

async function testEnvironmentConnection() {
  const client = new Client({
    connectionString: NEON_DB_URL,
  });

  try {
    console.log('🔌 Neonデータベースに接続中（環境変数使用）...');
    
    // Connect to the database
    await client.connect();
    console.log('✅ 接続成功！');
    
    // Test a simple query
    console.log('📊 データベース情報を取得中...');
    const result = await client.query('SELECT version()');
    console.log('📋 PostgreSQL バージョン:', result.rows[0].version);
    
    // Test current timestamp
    const timeResult = await client.query('SELECT NOW() as current_time');
    console.log('🕐 現在時刻:', timeResult.rows[0].current_time);
    
    // Test database name
    const dbResult = await client.query('SELECT current_database() as db_name');
    console.log('🗄️  データベース名:', dbResult.rows[0].db_name);
    
    console.log('🎉 環境変数接続テストが成功しました！');
    
  } catch (error) {
    console.error('❌ 接続エラー:', error.message);
    console.error('詳細:', error);
  } finally {
    // Always close the connection
    await client.end();
    console.log('🔌 接続を閉じました');
  }
}

// Run the connection test
testEnvironmentConnection(); 