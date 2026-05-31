import type { Context } from 'hono'
import type { Settings } from '../../../domain/entities/settings.js'
import type { SettingsUseCases } from '../../../domain/usecases/settings/index.js'
import { settingsSchema } from '../../schemas/settings.js'
import { validateBody } from '../../../shared/validators.js'
import { Errors } from '../../../shared/errors.js'

/** Convert Settings to JSON-serializable format (Date -> ISO string) */
function toSettingsResponse(settings: Settings) {
  return {
    ...settings,
    updatedAt: settings.updatedAt.toISOString(),
  }
}

export function createSettingsGetController(useCases: SettingsUseCases) {
  return async (c: Context) => {
    const settings = await useCases.get()
    const responseData = settings ? toSettingsResponse(settings) : null
    return c.json({ success: true, data: { settings: responseData } })
  }
}

export function createSettingsSaveController(useCases: SettingsUseCases) {
  return async (c: Context) => {
    const body = await c.req.json()
    const validation = validateBody(settingsSchema, body)

    if (!validation.success) {
      throw Errors.badRequest(validation.error)
    }

    const settings = await useCases.save(validation.data)
    return c.json({ success: true, data: { settings: toSettingsResponse(settings) } }, 201)
  }
}

export function createSettingsHistoryController(useCases: SettingsUseCases) {
  return async (c: Context) => {
    const history = await useCases.getHistory()
    return c.json({ success: true, data: { history: history.map(toSettingsResponse) } })
  }
}
