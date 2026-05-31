//! Item Entity
//!
//! Domain model for items stored in the database.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

/// Item entity
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Item {
    /// Unique identifier
    pub id: i64,
    /// Item name
    pub name: String,
    /// Creation timestamp
    pub created_at: DateTime<Utc>,
    /// Last update timestamp
    pub updated_at: DateTime<Utc>,
}

/// Input for creating a new item
#[derive(Debug, Clone)]
pub struct NewItem {
    pub name: String,
}

impl NewItem {
    /// Create a new item input
    pub fn new(name: impl Into<String>) -> Self {
        Self { name: name.into() }
    }
}

/// Input for updating an existing item
#[derive(Debug, Clone, Default)]
pub struct UpdateItem {
    pub name: Option<String>,
}
