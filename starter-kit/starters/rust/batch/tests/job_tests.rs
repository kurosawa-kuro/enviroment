//! Job Integration Tests
//!
//! Tests for job execution (happy path only).

mod common;

use batch::application::jobs::{hello_world_job, item_crud_job};

use common::create_test_context;

#[tokio::test]
async fn test_hello_world_job_executes_successfully() {
    let ctx = create_test_context();
    let job = hello_world_job();

    let result = job.execute(ctx).await;

    assert!(result.success);
    assert!(result.message.contains("Hello, World!"));
}

#[tokio::test]
async fn test_item_crud_job_executes_successfully() {
    let ctx = create_test_context();
    let job = item_crud_job();

    let result = job.execute(ctx).await;

    assert!(result.success);
    assert!(result.message.contains("CRUD operations completed"));
}

#[tokio::test]
async fn test_job_result_has_timing_info() {
    let ctx = create_test_context();
    let job = hello_world_job();

    let result = job.execute(ctx).await;

    // duration_ms is u64, so we just verify it exists (non-panic)
    let _ = result.duration_ms;
    assert!(result.executed_at.timestamp() > 0);
}

#[tokio::test]
async fn test_item_crud_job_has_metrics() {
    let ctx = create_test_context();
    let job = item_crud_job();

    let result = job.execute(ctx).await;

    let metrics = result.metrics.expect("metrics should be present");
    assert!(metrics.contains_key("operations_run"));
    assert!(metrics.contains_key("items_remaining"));
}
