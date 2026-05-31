const { MongoClient } = require('mongodb');

// MongoDB Atlas connection URL (Direct connection - for testing only)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://user:password@cluster.mongodb.net/scraping?retryWrites=true&w=majority';

async function testDirectConnection() {
  const client = new MongoClient(MONGODB_URI);

  try {
    console.log('🔌 MongoDB Atlasに直接接続中...');

    // Connect to the database
    await client.connect();
    console.log('✅ 接続成功！');

    // Test a simple query
    console.log('📊 データベース情報を取得中...');

    // Test specific database (use the database we have access to)
    const db = client.db('scraping');

    // Simple ping to verify connection
    const pingResult = await db.command({ ping: 1 });
    console.log('📋 Ping結果:', pingResult.ok === 1 ? '成功' : '失敗');
    const collections = await db.listCollections().toArray();
    console.log('📁 scraping コレクション一覧:');
    collections.forEach(col => {
      console.log(`   - ${col.name}`);
    });

    console.log('🎉 直接接続テストが成功しました！');

  } catch (error) {
    console.error('❌ 接続エラー:', error.message);
    console.error('詳細:', error);
  } finally {
    // Always close the connection
    await client.close();
    console.log('🔌 接続を閉じました');
  }
}

// Run the connection test
testDirectConnection();
