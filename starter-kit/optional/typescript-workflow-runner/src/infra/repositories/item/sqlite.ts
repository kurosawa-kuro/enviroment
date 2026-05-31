/**
 * SQLite Item Repository Implementation
 *
 * Implements ItemRepository using SQLite for persistent storage.
 *
 * @module infra/repositories/item/sqlite
 */

import type Database from "better-sqlite3";
import type { Item } from "../../../domain/entities/item.js";
import type {
  ItemRepository,
  CreateItemInput,
  UpdateItemInput,
} from "../../../domain/repositories/item.js";
import { wrapDbOperation } from "../../database/errors.js";

/**
 * Database row structure for items table
 */
interface ItemRow {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

/**
 * Convert database row to domain entity
 */
function toItem(row: ItemRow): Item {
  return {
    id: row.id,
    name: row.name,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

/**
 * Dependencies for SQLite item repository
 */
interface ItemRepoDeps {
  db: Database.Database;
}

/**
 * Create SQLite-backed item repository
 *
 * @param deps - Repository dependencies
 * @returns ItemRepository implementation
 *
 * @example
 * ```typescript
 * const repo = createItemSqliteRepository({ db });
 * const item = repo.create({ name: 'New Item' });
 * console.log(item.id); // Generated ID
 * ```
 */
export function createItemSqliteRepository({
  db,
}: ItemRepoDeps): ItemRepository {
  return {
    create(data: CreateItemInput): Item {
      return wrapDbOperation(() => {
        const now = new Date().toISOString();
        const stmt = db.prepare(`
          INSERT INTO items (name, created_at, updated_at)
          VALUES (?, ?, ?)
        `);
        const result = stmt.run(data.name, now, now);

        return {
          id: Number(result.lastInsertRowid),
          name: data.name,
          createdAt: new Date(now),
          updatedAt: new Date(now),
        };
      }, "item.create");
    },

    get(id: number): Item | null {
      return wrapDbOperation(() => {
        const stmt = db.prepare("SELECT * FROM items WHERE id = ?");
        const row = stmt.get(id) as ItemRow | undefined;

        if (!row) {
          return null;
        }

        return toItem(row);
      }, "item.get");
    },

    list(): Item[] {
      return wrapDbOperation(() => {
        const stmt = db.prepare("SELECT * FROM items ORDER BY created_at DESC");
        const rows = stmt.all() as ItemRow[];

        return rows.map(toItem);
      }, "item.list");
    },

    update(id: number, data: UpdateItemInput): Item | null {
      return wrapDbOperation(() => {
        const existing = db
          .prepare("SELECT * FROM items WHERE id = ?")
          .get(id) as ItemRow | undefined;

        if (!existing) {
          return null;
        }

        const now = new Date().toISOString();
        const newName = data.name ?? existing.name;

        const stmt = db.prepare(`
          UPDATE items SET name = ?, updated_at = ? WHERE id = ?
        `);
        stmt.run(newName, now, id);

        return {
          id,
          name: newName,
          createdAt: new Date(existing.created_at),
          updatedAt: new Date(now),
        };
      }, "item.update");
    },

    delete(id: number): boolean {
      return wrapDbOperation(() => {
        const stmt = db.prepare("DELETE FROM items WHERE id = ?");
        const result = stmt.run(id);

        return result.changes > 0;
      }, "item.delete");
    },
  };
}
