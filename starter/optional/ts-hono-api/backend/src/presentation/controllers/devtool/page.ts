import type { Context } from 'hono'
import type { MongoClient } from 'mongodb'
import type { AppConfig } from '../../../env/index.js'
import { render } from '../../helpers/render.js'

interface HealthCheckResult {
  status: 'ok' | 'error'
  message: string
  latency?: number
}

interface DbCheckResult {
  status: 'connected' | 'disconnected' | 'not_configured'
  type: string
  message: string
  latency?: number
}

interface EnvVarInfo {
  name: string
  value: string
  isSet: boolean
  isSecret: boolean
  description?: string
}

interface CategorizedEnvVars {
  configMap: EnvVarInfo[]
  secret: EnvVarInfo[]
}

async function checkHealth(): Promise<HealthCheckResult> {
  const start = Date.now()
  try {
    return {
      status: 'ok',
      message: 'API is running',
      latency: Date.now() - start
    }
  } catch {
    return {
      status: 'error',
      message: 'Health check failed',
      latency: Date.now() - start
    }
  }
}

async function checkDatabase(mongoClient: MongoClient | null, appConfig: AppConfig): Promise<DbCheckResult> {
  const start = Date.now()

  if (!mongoClient) {
    return {
      status: 'not_configured',
      type: 'MongoDB',
      message: 'MongoDB client not initialized'
    }
  }

  try {
    await mongoClient.db().admin().ping()
    return {
      status: 'connected',
      type: 'MongoDB',
      message: `Connected to ${appConfig.mongoDbName}`,
      latency: Date.now() - start
    }
  } catch (err) {
    return {
      status: 'disconnected',
      type: 'MongoDB',
      message: err instanceof Error ? err.message : 'Connection failed',
      latency: Date.now() - start
    }
  }
}

function getEnvironmentVariables(appConfig: AppConfig): CategorizedEnvVars {
  const configMapVars: { name: string; value: string | undefined; description: string }[] = [
    { name: 'APP_ENV', value: appConfig.appEnv, description: 'Application environment' },
    { name: 'APP_MODE', value: appConfig.appMode, description: 'Application mode (origin/stable)' },
    { name: 'PORT', value: String(appConfig.port), description: 'Server listen port' },
    { name: 'LOG_LEVEL', value: appConfig.logLevel, description: 'Logging verbosity level' },
    { name: 'AUTH_ENABLED', value: String(appConfig.authEnabled), description: 'Enable Clerk auth' },
    { name: 'LLM_GW_ENABLED', value: String(appConfig.llmGwEnabled), description: 'Enable LLM Gateway' },
    { name: 'ALERT_ENABLED', value: String(appConfig.alertEnabled), description: 'Enable alerting' }
  ]

  const secretVars: { name: string; value: string | undefined; description: string }[] = [
    { name: 'DB_MONGODB_URI', value: appConfig.dbMongodbUri, description: 'MongoDB connection string' },
    { name: 'DB_MONGODB_DB_NAME', value: appConfig.mongoDbName, description: 'MongoDB database name' },
    { name: 'DB_NEON_URI', value: appConfig.dbNeonUri, description: 'Neon PostgreSQL connection string' },
    { name: 'AUTH_JWT_SECRET', value: appConfig.authJwtSecret, description: 'JWT signing secret' },
    { name: 'LLM_GW_PROJECT_API_KEY', value: appConfig.llmGwProjectApiKey, description: 'LLM Gateway API key' }
  ]

  const mapToEnvVarInfo = (vars: typeof configMapVars, isSecret: boolean): EnvVarInfo[] => {
    return vars.map(({ name, value, description }) => {
      const isSet = value !== undefined && value !== ''
      return {
        name,
        value: isSecret && isSet ? maskValue(value || '') : (value || '(not set)'),
        isSet,
        isSecret,
        description
      }
    })
  }

  return {
    configMap: mapToEnvVarInfo(configMapVars, false),
    secret: mapToEnvVarInfo(secretVars, true)
  }
}

function maskValue(value: string): string {
  if (value.length <= 4) return '****'
  return value.substring(0, 2) + '****' + value.substring(value.length - 2)
}

export function createDevtoolPageController(mongoClient: MongoClient | null, appConfig: AppConfig) {
  return async (c: Context) => {
    const [healthResult, dbResult] = await Promise.all([
      checkHealth(),
      checkDatabase(mongoClient, appConfig)
    ])

    const envVars = getEnvironmentVariables(appConfig)

    const systemInfo = {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      uptime: Math.floor(process.uptime()),
      memoryUsage: {
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024)
      },
      pid: process.pid
    }

    return render(c, 'devtool/index', {
      title: 'Dev Tools',
      pageTitle: 'Dev Tools',
      activePage: 'devtool',
      health: healthResult,
      database: dbResult,
      envVars,
      systemInfo,
      timestamp: new Date().toISOString()
    })
  }
}
