import type { SettingsRepository } from '../../repositories/settings.js'
import type { SettingsUseCases } from './types.js'

/**
 * SettingsUseCasesの依存関係
 */
export interface SettingsUseCasesDeps {
  settingsRepo: SettingsRepository
}

/**
 * SettingsUseCases Factory
 * DIコンテナから依存関係を受け取り、UseCasesオブジェクトを生成
 */
export function createSettingsUseCases(deps: SettingsUseCasesDeps): SettingsUseCases {
  const { settingsRepo } = deps

  return {
    get: () => settingsRepo.get(),
    save: (input) => settingsRepo.save(input),
    getHistory: () => settingsRepo.getHistory(),
  }
}
