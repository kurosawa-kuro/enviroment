//! Item Repository Interface
//!
//! Defines the contract for Item data access operations.
//! Implementations can use any storage backend (SQLite, PostgreSQL, etc.)

use crate::domain::entities::{Item, NewItem, UpdateItem};

/// Repository error type
pub type RepoError = anyhow::Error;
/// Repository result type
pub type RepoResult<T> = Result<T, RepoError>;

/// Item repository interface
///
/// All methods return Results to handle potential errors.
pub trait ItemRepository: Send + Sync {
    /// Create a new item
    ///
    /// # Arguments
    ///
    /// * `data` - Item data
    ///
    /// # Returns
    ///
    /// Created item with generated ID
    fn create(&self, data: NewItem) -> RepoResult<Item>;

    /// Get an item by ID
    ///
    /// # Arguments
    ///
    /// * `id` - Item ID
    ///
    /// # Returns
    ///
    /// Item if found, None otherwise
    fn get(&self, id: i64) -> RepoResult<Option<Item>>;

    /// List all items
    ///
    /// # Returns
    ///
    /// Array of items sorted by creation date (newest first)
    fn list(&self) -> RepoResult<Vec<Item>>;

    /// Update an existing item
    ///
    /// # Arguments
    ///
    /// * `id` - Item ID
    /// * `data` - Fields to update
    ///
    /// # Returns
    ///
    /// Updated item if found, None otherwise
    fn update(&self, id: i64, data: UpdateItem) -> RepoResult<Option<Item>>;

    /// Delete an item
    ///
    /// # Arguments
    ///
    /// * `id` - Item ID
    ///
    /// # Returns
    ///
    /// true if deleted, false if not found
    fn delete(&self, id: i64) -> RepoResult<bool>;
}
