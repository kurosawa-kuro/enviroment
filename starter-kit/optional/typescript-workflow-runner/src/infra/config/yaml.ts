/**
 * Configuration loader with Zod validation
 *
 * Priority (highest to lowest):
 *   1. Environment variables (credentials from Doppler)
 *   2. env/config.yaml (project-specific settings)
 *   3. Default values
 *
 * @module lib/config
 */

import { z } from "zod";
import { parse as parseYaml } from "yaml";
import { readFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { LOG_LEVELS } from "../../shared/constants.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** Path to config.yaml */
const CONFIG_PATH = resolve(__dirname, "../../../env/config.yaml");

/**
 * Zod schema for application configuration
 *
 * - Project settings: from config.yaml
 * - Credentials: from environment variables (Doppler)
 */
/** Runner modes */
const RUNNER_MODES = ["workflow", "cli"] as const;

const configSchema = z.object({
  // ============================================================================
  // Project Settings (config.yaml)
  // ============================================================================
  /** Project name */
  projectName: z.string().min(1).default("workflow-runner"),
  /** Application environment (local/development/staging/production) */
  appEnv: z.string().min(1).default("local"),
  /** Runner mode (workflow/cli) */
  runnerMode: z.enum(RUNNER_MODES).default("workflow"),
  /** Logging level for pino */
  logLevel: z.enum(LOG_LEVELS).default("info"),
  /** SQLite database path (relative to project root) */
  dbPath: z.string().min(1).default("data/workflow-runner.db"),

  // ============================================================================
  // Credentials (Environment Variables / Doppler)
  // ============================================================================
  /** Database URL (optional - for external DB connections) */
  databaseUrl: z.string().optional(),
  /** API Key (optional - for external API calls) */
  apiKey: z.string().optional(),
});

/**
 * Inferred configuration type from Zod schema
 */
export type Config = z.infer<typeof configSchema>;

/** Cached configuration instance */
let cachedConfig: Config | null = null;

/**
 * Load configuration from YAML file
 */
function loadYamlConfig(): Record<string, unknown> {
  if (!existsSync(CONFIG_PATH)) {
    console.warn(`Config file not found: ${CONFIG_PATH}, using defaults`);
    return {};
  }

  try {
    const content = readFileSync(CONFIG_PATH, "utf-8");
    return parseYaml(content) || {};
  } catch (error) {
    console.error(`Failed to parse config.yaml: ${error}`);
    return {};
  }
}

/**
 * Load credentials from environment variables
 * These override config.yaml values (for Doppler integration)
 */
function loadEnvConfig(): Record<string, unknown> {
  const env: Record<string, unknown> = {};

  // Map environment variables to config keys
  // Only set if environment variable exists
  if (process.env.PROJECT_NAME) env.projectName = process.env.PROJECT_NAME;
  if (process.env.APP_ENV) env.appEnv = process.env.APP_ENV;
  if (process.env.RUNNER_MODE) env.runnerMode = process.env.RUNNER_MODE;
  if (process.env.LOG_LEVEL) env.logLevel = process.env.LOG_LEVEL;
  if (process.env.DB_PATH) env.dbPath = process.env.DB_PATH;

  // Credentials (typically from Doppler)
  if (process.env.DATABASE_URL) env.databaseUrl = process.env.DATABASE_URL;
  if (process.env.API_KEY) env.apiKey = process.env.API_KEY;

  return env;
}

/**
 * Initialize and validate configuration
 *
 * Merges config sources in priority order:
 *   1. Environment variables (highest)
 *   2. config.yaml
 *   3. Defaults (lowest)
 *
 * @throws {z.ZodError} If configuration validation fails
 * @returns Validated configuration object
 */
export function initConfig(): Config {
  // Load from config.yaml (project settings)
  const yamlConfig = loadYamlConfig();

  // Load from environment variables (credentials from Doppler)
  const envConfig = loadEnvConfig();

  // Merge: env overrides yaml
  const mergedConfig = {
    ...yamlConfig,
    ...envConfig,
  };

  cachedConfig = configSchema.parse(mergedConfig);
  return cachedConfig;
}

/**
 * Get the current configuration
 * Initializes configuration if not already done
 *
 * @returns Validated configuration object
 *
 * @example
 * ```typescript
 * import { getConfig } from './lib/config.js';
 *
 * const { dbPath } = getConfig();
 * // Use dbPath to initialize SQLite database
 * ```
 */
export function getConfig(): Config {
  if (!cachedConfig) {
    return initConfig();
  }
  return cachedConfig;
}

/**
 * Reset configuration (useful for testing)
 * Forces re-initialization on next getConfig() call
 */
export function resetConfig(): void {
  cachedConfig = null;
}

/**
 * Config object with getter properties
 */
export const config = {
  // Project settings
  get projectName() {
    return getConfig().projectName;
  },
  get appEnv() {
    return getConfig().appEnv;
  },
  get runnerMode() {
    return getConfig().runnerMode;
  },
  get logLevel() {
    return getConfig().logLevel;
  },
  get dbPath() {
    return getConfig().dbPath;
  },
  // Credentials (from Doppler)
  get databaseUrl() {
    return getConfig().databaseUrl;
  },
  get apiKey() {
    return getConfig().apiKey;
  },
};

export default config;
