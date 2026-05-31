//! Domain layer
//!
//! Contains entities and repository interfaces.

pub mod entities;
pub mod repositories;

pub use entities::{Item, NewItem, UpdateItem};
pub use repositories::{ItemRepository, RepoError, RepoResult};
