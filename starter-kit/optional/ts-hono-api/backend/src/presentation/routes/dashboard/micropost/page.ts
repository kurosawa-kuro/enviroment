import { Hono } from 'hono'
import {
  createMicropostListPageController,
  createMicropostGetPageController,
  createMicropostNewPageController,
  createMicropostEditPageController,
} from '../../../controllers/dashboard/micropost.js'

/**
 * Micropost Page Routes
 *
 * GET /microposts            - 一覧ページ
 * GET /microposts/new        - 新規作成ページ
 * GET /microposts/:id        - 詳細ページ
 * GET /microposts/:id/edit   - 編集ページ
 */
export function createMicropostPageRoutes() {
  const app = new Hono()

  app.get('/', createMicropostListPageController())
  app.get('/new', createMicropostNewPageController())
  app.get('/:id/edit', createMicropostEditPageController())
  app.get('/:id', createMicropostGetPageController())

  return app
}
