import { Hono } from 'hono'
import type { AppConfig } from '../../../env/index.js'
import { render } from '../../helpers/render.js'

interface AuthPageDeps {
  appConfig: AppConfig
}

/**
 * Auth Page Routes
 *
 * GET /auth/login - ログインページ
 */
export function createAuthPageRoutes(deps: AuthPageDeps) {
  const app = new Hono()
  const { appConfig } = deps

  app.get('/login', async (c) => {
    if (!appConfig.authEnabled) {
      return c.redirect('/dashboard')
    }
    return render(c, 'auth/login', {
      layout: '',
      title: appConfig.projectName,
    })
  })

  return app
}
