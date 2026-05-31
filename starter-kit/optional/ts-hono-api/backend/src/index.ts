import { serve, type ServerType } from '@hono/node-server'
import { appConfig } from './env/index.js'
import { createAppContainer } from './di/container.js'
import { createApp } from './app.js'
import { createMongoClient } from './infra/database/clients/mongo.js'
import { createRedisClient } from './infra/database/clients/redis.js'
import { logger } from './shared/logger.js'

async function main() {
  // MongoDB クライアント生成・接続（ライフサイクルはここで管理）
  const mongoClient = createMongoClient(appConfig.dbMongodbUri)
  await mongoClient.connect()
  logger.info('MongoDB connected')

  // Redis クライアント生成（Optional）
  // Upstash Redis は HTTP ベースなので明示的な close は不要
  const redisClient = appConfig.redisUrl && appConfig.redisToken
    ? createRedisClient({ url: appConfig.redisUrl, token: appConfig.redisToken })
    : null

  if (redisClient) {
    logger.info('Redis client initialized (Upstash)')
  }

  const container = await createAppContainer(mongoClient, redisClient)
  const app = createApp(container)

  const server: ServerType = serve({
    fetch: app.fetch,
    port: appConfig.port
  }, (info) => {
    logger.info(`Server is running on http://localhost:${info.port}`)
  })

  // Graceful shutdown
  const shutdown = async () => {
    logger.info('Shutting down...')
    server.close()
    await mongoClient.close()
    logger.info('MongoDB disconnected')
    // Note: Upstash Redis は HTTP ベースなので明示的 close 不要
    process.exit(0)
  }

  process.on('SIGTERM', shutdown)
  process.on('SIGINT', shutdown)
}

// Start server directly (tsx/ts-node doesn't work with import.meta.url entry detection)
main().catch((err) => {
  logger.error('Failed to start server:', err)
  process.exit(1)
})
