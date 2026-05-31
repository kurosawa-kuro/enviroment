/**
 * Config Port - Configuration provider interface
 *
 * Abstracts configuration access for testability.
 *
 * @module interfaces/config
 */

/**
 * Application configuration interface
 *
 * - Project settings: from config.yaml
 * - Credentials: from environment variables (Doppler)
 */
/** Runner mode types */
export type RunnerMode = "workflow" | "cli";

export interface AppConfig {
  // Project settings
  projectName: string;
  appEnv: string;
  runnerMode: RunnerMode;
  logLevel: string;
  dbPath: string;
  // Credentials (from Doppler)
  databaseUrl?: string;
  apiKey?: string;
}

/**
 * Configuration provider interface
 */
export interface ConfigProvider {
  /** Get current configuration */
  get: () => AppConfig;
}
