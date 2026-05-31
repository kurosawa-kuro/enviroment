/**
 * Item Repository Interface
 *
 * Defines the contract for Item data access operations.
 * Implementations can use any storage backend (SQLite, PostgreSQL, etc.)
 *
 * @module domain/repositories/item
 */

import type { Item } from "../entities/item.js";

/**
 * Input for creating a new item
 */
export interface CreateItemInput {
  name: string;
}

/**
 * Input for updating an existing item
 */
export interface UpdateItemInput {
  name?: string;
}

/**
 * Item repository interface
 *
 * All methods are synchronous as SQLite operations are blocking.
 */
export interface ItemRepository {
  /**
   * Create a new item
   * @param data - Item data
   * @returns Created item with generated ID
   */
  create(data: CreateItemInput): Item;

  /**
   * Get an item by ID
   * @param id - Item ID
   * @returns Item if found, null otherwise
   */
  get(id: number): Item | null;

  /**
   * List all items
   * @returns Array of items sorted by creation date (newest first)
   */
  list(): Item[];

  /**
   * Update an existing item
   * @param id - Item ID
   * @param data - Fields to update
   * @returns Updated item if found, null otherwise
   */
  update(id: number, data: UpdateItemInput): Item | null;

  /**
   * Delete an item
   * @param id - Item ID
   * @returns true if deleted, false if not found
   */
  delete(id: number): boolean;
}
