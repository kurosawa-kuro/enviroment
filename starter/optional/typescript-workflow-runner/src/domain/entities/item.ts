/**
 * Item Entity
 *
 * Domain model for items stored in the database.
 *
 * @module domain/entities/item
 */

/**
 * Item entity interface
 */
export interface Item {
  /** Unique identifier */
  id: number;
  /** Item name */
  name: string;
  /** Creation timestamp */
  createdAt: Date;
  /** Last update timestamp */
  updatedAt: Date;
}
