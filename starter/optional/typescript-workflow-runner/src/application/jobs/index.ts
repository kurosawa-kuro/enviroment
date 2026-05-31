/**
 * Job exports and registration
 * Import this file to register all jobs with the registry
 *
 * @module jobs
 */

// System jobs
export { helloWorldJob, main as helloWorldMain } from "./system/hello-world.js";

// Database jobs
export { dbInitJob, main as dbInitMain } from "./database/db-init.js";
export { itemCrudJob, main as itemCrudMain } from "./database/item-crud.js";
