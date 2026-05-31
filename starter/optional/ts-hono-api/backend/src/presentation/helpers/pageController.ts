import type { Context } from 'hono'
import { render } from './render.js'
import { Errors } from '../../shared/errors.js'

/**
 * ページコントローラー設定
 */
export interface PageConfig {
  /** テンプレートパス (例: 'admin/index') */
  template: string
  /** ページタイトル (ブラウザタブ) */
  title: string
  /** ページ見出し */
  pageTitle?: string
  /** アクティブなナビゲーション項目 */
  activePage: string
}

/**
 * 追加データを生成する関数の型
 */
type ExtraDataFn = (c: Context) => Record<string, unknown> | Promise<Record<string, unknown>>

/**
 * シンプルなページコントローラーを生成するファクトリー
 *
 * @example
 * // 基本的な使用法
 * app.get('/', createPageController({
 *   template: 'admin/index',
 *   title: 'Admin Dashboard',
 *   activePage: 'admin'
 * }))
 *
 * @example
 * // 動的データを渡す場合
 * app.get('/:id', createPageController(
 *   { template: 'micropost/show', title: 'Micropost Detail', activePage: 'microposts' },
 *   (c) => ({ micropostId: c.req.param('id') })
 * ))
 */
export function createPageController(config: PageConfig, extraData?: ExtraDataFn) {
  return async (c: Context) => {
    const baseData = {
      title: config.title,
      pageTitle: config.pageTitle ?? config.title,
      activePage: config.activePage
    }

    if (extraData) {
      const extra = await extraData(c)
      return render(c, config.template, { ...baseData, ...extra })
    }

    return render(c, config.template, baseData)
  }
}

// ============================================================================
// Page Error Helpers
// ============================================================================

/**
 * 404エラーをスロー（エラーハンドラーが処理）
 *
 * @example
 * const resource = await findResource(id)
 * if (!resource) notFoundPage('Resource')
 */
export function notFoundPage(message = 'Page not found'): never {
  throw Errors.notFound(message)
}

/**
 * 403エラーをスロー（エラーハンドラーが処理）
 *
 * @example
 * if (!hasPermission) forbiddenPage('Access denied')
 */
export function forbiddenPage(message = 'Access denied'): never {
  throw Errors.forbidden(message)
}
