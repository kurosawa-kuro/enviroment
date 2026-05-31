import type { Context } from 'hono'
import type { AppConfig } from '../../../env/index.js'
import { render } from '../../helpers/render.js'

export function createDashboardPageController(appConfig: AppConfig) {
  return async (c: Context) => {
    const safeConfig = {
      env: appConfig.appEnv,
      appMode: appConfig.appMode,
      port: appConfig.port,
      logLevel: appConfig.logLevel,
      dbType: appConfig.dbMongodbUri ? 'MongoDB' : (appConfig.dbNeonUri ? 'PostgreSQL' : 'None'),
      mongoDbName: appConfig.mongoDbName,
    }

    return render(c, 'dashboard/index', {
      title: 'Dashboard',
      pageTitle: 'Dashboard',
      activePage: 'dashboard',
      message: 'Welcome back!',
      timestamp: new Date().toLocaleString('ja-JP'),
      config: safeConfig
    })
  }
}
