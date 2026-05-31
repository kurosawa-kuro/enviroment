//! Job Registry - Workflow Step Discovery
//!
//! Central registry for all available jobs (workflow steps).
//! Provides name → implementation resolution for the workflow runner.
//!
//! ## Responsibilities
//! - Store job name → job implementation mappings
//! - Provide job lookup by name
//! - List all available workflow steps

use std::collections::HashMap;
use std::sync::{RwLock, RwLockReadGuard, RwLockWriteGuard};

use once_cell::sync::Lazy;

use crate::application::JobDefinition;

/// Global job registry
static REGISTRY: Lazy<RwLock<HashMap<String, JobDefinition>>> =
    Lazy::new(|| RwLock::new(HashMap::new()));

fn registry_read() -> RwLockReadGuard<'static, HashMap<String, JobDefinition>> {
    REGISTRY.read().unwrap_or_else(|err| err.into_inner())
}

fn registry_write() -> RwLockWriteGuard<'static, HashMap<String, JobDefinition>> {
    REGISTRY.write().unwrap_or_else(|err| err.into_inner())
}

/// Register a job (workflow step) with the registry
///
/// Jobs must be registered to be discoverable by the workflow runner.
///
/// # Panics
///
/// Panics if a job with the same name is already registered.
pub fn register_job(job: JobDefinition) {
    let mut registry = registry_write();
    if registry.contains_key(&job.name) {
        panic!("Job \"{}\" is already registered", job.name);
    }
    registry.insert(job.name.clone(), job);
}

/// Get a job by name
///
/// # Arguments
///
/// * `name` - Job name to look up
///
/// # Returns
///
/// Job definition if found
pub fn get_job(name: &str) -> Option<JobDefinition> {
    let registry = registry_read();
    registry.get(name).cloned()
}

/// Get all registered jobs
///
/// # Returns
///
/// Vector of all registered job definitions
pub fn get_all_jobs() -> Vec<JobDefinition> {
    let registry = registry_read();
    registry.values().cloned().collect()
}

/// Get all registered job names
///
/// # Returns
///
/// Vector of job names
pub fn get_job_names() -> Vec<String> {
    let registry = registry_read();
    registry.keys().cloned().collect()
}

/// Check if a job is registered
///
/// # Arguments
///
/// * `name` - Job name to check
///
/// # Returns
///
/// true if job is registered
pub fn has_job(name: &str) -> bool {
    let registry = registry_read();
    registry.contains_key(name)
}

/// Clear all registered jobs (useful for testing)
pub fn clear_registry() {
    let mut registry = registry_write();
    registry.clear();
}

/// Get job registry size
pub fn registry_size() -> usize {
    let registry = registry_read();
    registry.len()
}
