//! Registry Integration Tests
//!
//! Tests for job registry (happy path only).

use batch::application::jobs::hello_world_job;
use batch::registry::{
    clear_registry, get_all_jobs, get_job, has_job, register_job, registry_size,
};
use std::sync::Mutex;

static REGISTRY_TEST_LOCK: Mutex<()> = Mutex::new(());

fn setup() -> std::sync::MutexGuard<'static, ()> {
    let guard = REGISTRY_TEST_LOCK
        .lock()
        .unwrap_or_else(|err| err.into_inner());
    clear_registry();
    guard
}

#[test]
fn test_register_and_get_job() {
    let _guard = setup();

    let job = hello_world_job();
    let job_name = job.name.clone();

    register_job(job);

    let retrieved = get_job(&job_name);
    assert!(retrieved.is_some());
    assert_eq!(retrieved.unwrap().name, job_name);
}

#[test]
fn test_has_job() {
    let _guard = setup();

    let job = hello_world_job();
    let job_name = job.name.clone();

    register_job(job);

    assert!(has_job(&job_name));
    assert!(!has_job("non-existent-job"));
}

#[test]
fn test_get_all_jobs() {
    let _guard = setup();

    register_job(hello_world_job());

    let jobs = get_all_jobs();
    assert_eq!(jobs.len(), 1);
    assert_eq!(jobs[0].name, "hello-world");
}

#[test]
fn test_registry_size() {
    let _guard = setup();

    assert_eq!(registry_size(), 0);

    register_job(hello_world_job());

    assert_eq!(registry_size(), 1);
}

#[test]
fn test_clear_registry() {
    let _guard = setup();

    register_job(hello_world_job());
    assert_eq!(registry_size(), 1);

    clear_registry();
    assert_eq!(registry_size(), 0);
}
