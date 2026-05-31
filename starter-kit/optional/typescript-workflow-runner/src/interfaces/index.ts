/**
 * Interfaces (Ports) - Clean Architecture boundary definitions
 *
 * These interfaces define the contracts between layers.
 * Implementations live in infra/.
 *
 * @module interfaces
 */

export type { Clock, ExecutionIdGenerator } from "./clock.js";
export type { AppConfig, ConfigProvider } from "./config.js";
export type { Logger } from "./logger.js";
