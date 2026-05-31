//! SQLite Item Repository Implementation
//!
//! Implements ItemRepository using SQLite for persistent storage.

use anyhow::Context;
use chrono::{DateTime, Utc};

use crate::domain::entities::{Item, NewItem, UpdateItem};
use crate::domain::repositories::{ItemRepository, RepoResult};
use crate::infrastructure::database::SqliteDb;

/// SQLite-backed item repository
pub struct SqliteItemRepository {
    db: SqliteDb,
}

impl SqliteItemRepository {
    pub fn new(db: SqliteDb) -> Self {
        Self { db }
    }
}

impl ItemRepository for SqliteItemRepository {
    fn create(&self, data: NewItem) -> RepoResult<Item> {
        let conn = self
            .db
            .lock()
            .map_err(|e| anyhow::anyhow!("Lock error: {}", e))?;
        let now = Utc::now();
        let now_str = now.to_rfc3339();

        conn.execute(
            "INSERT INTO items (name, created_at, updated_at) VALUES (?1, ?2, ?3)",
            (&data.name, &now_str, &now_str),
        )
        .context("Failed to insert item")?;

        let id = conn.last_insert_rowid();

        Ok(Item {
            id,
            name: data.name,
            created_at: now,
            updated_at: now,
        })
    }

    fn get(&self, id: i64) -> RepoResult<Option<Item>> {
        let conn = self
            .db
            .lock()
            .map_err(|e| anyhow::anyhow!("Lock error: {}", e))?;

        let result = conn.query_row(
            "SELECT id, name, created_at, updated_at FROM items WHERE id = ?1",
            [id],
            |row| {
                let created_at_str: String = row.get(2)?;
                let updated_at_str: String = row.get(3)?;

                Ok(Item {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    created_at: DateTime::parse_from_rfc3339(&created_at_str)
                        .map(|dt| dt.with_timezone(&Utc))
                        .unwrap_or_else(|_| Utc::now()),
                    updated_at: DateTime::parse_from_rfc3339(&updated_at_str)
                        .map(|dt| dt.with_timezone(&Utc))
                        .unwrap_or_else(|_| Utc::now()),
                })
            },
        );

        match result {
            Ok(item) => Ok(Some(item)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e.into()),
        }
    }

    fn list(&self) -> RepoResult<Vec<Item>> {
        let conn = self
            .db
            .lock()
            .map_err(|e| anyhow::anyhow!("Lock error: {}", e))?;

        let mut stmt = conn
            .prepare("SELECT id, name, created_at, updated_at FROM items ORDER BY created_at DESC")
            .context("Failed to prepare statement")?;

        let items = stmt
            .query_map([], |row| {
                let created_at_str: String = row.get(2)?;
                let updated_at_str: String = row.get(3)?;

                Ok(Item {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    created_at: DateTime::parse_from_rfc3339(&created_at_str)
                        .map(|dt| dt.with_timezone(&Utc))
                        .unwrap_or_else(|_| Utc::now()),
                    updated_at: DateTime::parse_from_rfc3339(&updated_at_str)
                        .map(|dt| dt.with_timezone(&Utc))
                        .unwrap_or_else(|_| Utc::now()),
                })
            })
            .context("Failed to query items")?
            .collect::<Result<Vec<_>, _>>()
            .context("Failed to collect items")?;

        Ok(items)
    }

    fn update(&self, id: i64, data: UpdateItem) -> RepoResult<Option<Item>> {
        let conn = self
            .db
            .lock()
            .map_err(|e| anyhow::anyhow!("Lock error: {}", e))?;

        // First check if the item exists and get current data
        let existing = conn.query_row(
            "SELECT id, name, created_at FROM items WHERE id = ?1",
            [id],
            |row| {
                let created_at_str: String = row.get(2)?;
                Ok((
                    row.get::<_, i64>(0)?,
                    row.get::<_, String>(1)?,
                    created_at_str,
                ))
            },
        );

        let (_, current_name, created_at_str) = match existing {
            Ok(data) => data,
            Err(rusqlite::Error::QueryReturnedNoRows) => return Ok(None),
            Err(e) => return Err(e.into()),
        };

        let new_name = data.name.unwrap_or(current_name);
        let now = Utc::now();
        let now_str = now.to_rfc3339();

        conn.execute(
            "UPDATE items SET name = ?1, updated_at = ?2 WHERE id = ?3",
            (&new_name, &now_str, id),
        )
        .context("Failed to update item")?;

        Ok(Some(Item {
            id,
            name: new_name,
            created_at: DateTime::parse_from_rfc3339(&created_at_str)
                .map(|dt| dt.with_timezone(&Utc))
                .unwrap_or_else(|_| Utc::now()),
            updated_at: now,
        }))
    }

    fn delete(&self, id: i64) -> RepoResult<bool> {
        let conn = self
            .db
            .lock()
            .map_err(|e| anyhow::anyhow!("Lock error: {}", e))?;

        let changes = conn
            .execute("DELETE FROM items WHERE id = ?1", [id])
            .context("Failed to delete item")?;

        Ok(changes > 0)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::infrastructure::database::create_memory_db;

    fn setup_test_db() -> SqliteDb {
        let db = create_memory_db().unwrap();
        {
            let conn = db.lock().unwrap();
            conn.execute(
                "CREATE TABLE items (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                )",
                [],
            )
            .unwrap();
        }
        db
    }

    #[test]
    fn test_crud_operations() {
        let db = setup_test_db();
        let repo = SqliteItemRepository::new(db);

        // Create
        let item = repo
            .create(NewItem {
                name: "Test".to_string(),
            })
            .unwrap();
        assert_eq!(item.name, "Test");
        assert!(item.id > 0);

        // Get
        let retrieved = repo.get(item.id).unwrap().unwrap();
        assert_eq!(retrieved.id, item.id);
        assert_eq!(retrieved.name, "Test");

        // Update
        let updated = repo
            .update(
                item.id,
                UpdateItem {
                    name: Some("Updated".to_string()),
                },
            )
            .unwrap()
            .unwrap();
        assert_eq!(updated.name, "Updated");

        // List
        let items = repo.list().unwrap();
        assert_eq!(items.len(), 1);

        // Delete
        let deleted = repo.delete(item.id).unwrap();
        assert!(deleted);

        // Verify deleted
        let not_found = repo.get(item.id).unwrap();
        assert!(not_found.is_none());
    }
}
