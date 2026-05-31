import type { Settings, SettingsInput } from '../../entities/settings.js'

/**
 * SettingsUseCases Interface
 * DIコンテナに登録され、Controllerから使用される主要インターフェース
 */
export interface SettingsUseCases {
  get: () => Promise<Settings | null>
  save: (input: SettingsInput) => Promise<Settings>
  getHistory: () => Promise<Settings[]>
}
