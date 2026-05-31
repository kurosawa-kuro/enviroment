import type { Settings, SettingsInput } from '../entities/settings.js'

export interface SettingsRepository {
  get(): Promise<Settings | null>
  save(input: SettingsInput): Promise<Settings>
  getHistory(): Promise<Settings[]>
}
