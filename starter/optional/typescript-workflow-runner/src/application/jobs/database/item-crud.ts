#!/usr/bin/env node
/**
 * Item CRUD Sample Job
 *
 * Demonstrates basic CRUD operations on SQLite items table.
 * Creates, reads, updates, and deletes sample items.
 *
 * Usage:
 *   npm run item-crud
 *   tsx src/jobs/database/item-crud.ts
 *
 * @module jobs/database/item-crud
 */

import "../../../infra/config/yaml.js";
import { createJobWithDeps } from "../../job-factory.js";
import { registerJob } from "../../../registry/job-registry.js";
import { runIfMain } from "../../../runner/workflow-runner.js";

/**
 * Item CRUD sample job
 *
 * Demonstrates all CRUD operations:
 * - CREATE: Insert a new item
 * - READ: Retrieve an item by ID
 * - UPDATE: Modify an existing item
 * - LIST: Get all items
 * - DELETE: Remove an item
 */
export const itemCrudJob = createJobWithDeps(
  {
    name: "item-crud",
    description: "Demonstrates CRUD operations on items table",
    schedule: "0 0 * * *", // Daily at midnight
  },
  async (_ctx, logger, deps) => {
    const { itemRepo, clock } = deps;
    const operations: string[] = [];

    // CREATE
    logger.info("Creating sample item...");
    const created = itemRepo.create({
      name: `Sample Item ${clock.toISOString()}`,
    });
    operations.push(`CREATE: id=${created.id}, name=${created.name}`);
    logger.info({ item: created }, "Created item");

    // READ
    logger.info({ id: created.id }, "Reading item...");
    const retrieved = itemRepo.get(created.id);
    if (retrieved) {
      operations.push(`READ: id=${retrieved.id}, name=${retrieved.name}`);
      logger.info({ item: retrieved }, "Retrieved item");
    }

    // UPDATE
    logger.info({ id: created.id }, "Updating item...");
    const updated = itemRepo.update(created.id, {
      name: `Updated Item ${clock.toISOString()}`,
    });
    if (updated) {
      operations.push(`UPDATE: id=${updated.id}, name=${updated.name}`);
      logger.info({ item: updated }, "Updated item");
    }

    // LIST
    logger.info("Listing all items...");
    const allItems = itemRepo.list();
    operations.push(`LIST: ${allItems.length} items total`);
    logger.info({ count: allItems.length }, "Listed items");

    // DELETE
    logger.info({ id: created.id }, "Deleting item...");
    const deleted = itemRepo.delete(created.id);
    operations.push(`DELETE: id=${created.id}, success=${deleted}`);
    logger.info({ deleted }, "Deleted item");

    // Final count
    const finalCount = itemRepo.list().length;

    return {
      success: true,
      message: `CRUD operations completed. ${finalCount} items remaining.`,
      metrics: {
        operationsRun: operations.length,
        itemsRemaining: finalCount,
      },
      details: { operations },
    };
  }
);

registerJob(itemCrudJob);
export const main = itemCrudJob.handler;
runIfMain(main, import.meta.url);
