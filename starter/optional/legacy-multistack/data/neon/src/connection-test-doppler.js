const { Client } = require('pg');

// Dopplerから環境変数を取得
// 注意: このファイルは doppler run コマンドで実行する必要があります
const NEON_DB_URL = process.env.NEON_DB_URL;

if (!NEON_DB_URL) {
  console.error('❌ NEON_DB_URL環境変数が設定されていません');
  console.error('💡 doppler run node connection-test-doppler.js で実行してください');
  process.exit(1);
}

async function testDopplerConnection() {
  const client = new Client({
    connectionString: NEON_DB_URL,
  });

  try {
    console.log('🔌 Doppler経由でNeonデータベースに接続中...');
    console.log('🔐 Doppler設定を使用しています');
    
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
    
    // Test connection info (without sensitive data)
    const connectionInfo = await client.query('SELECT current_user as user, inet_server_addr() as host, inet_server_port() as port');
    console.log('👤 接続ユーザー:', connectionInfo.rows[0].user);
    console.log('🌐 ホスト:', connectionInfo.rows[0].host);
    console.log('🔌 ポート:', connectionInfo.rows[0].port);
    
    console.log('🎉 Doppler連携テストが成功しました！');
    
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
testDopplerConnection(); 