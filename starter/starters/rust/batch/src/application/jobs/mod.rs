//! Job definitions
//!
//! Contains all job implementations. Import this module to register
//! all jobs with the registry.

pub mod db_init;
pub mod hello_world;
pub mod item_crud;

pub use db_init::db_init_job;
pub use hello_world::hello_world_job;
pub use item_crud::item_crud_job;

use crate::registry::register_job;

/// Register all jobs with the registry
pub fn register_all_jobs() {
    register_job(hello_world_job());
    register_job(db_init_job());
    register_job(item_crud_job());
}
