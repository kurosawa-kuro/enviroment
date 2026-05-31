//! Test Utilities
//!
//! Common test helpers and fixtures.

use std::sync::Arc;

use batch::di::TestContextBuilder;
use batch::AppContext;

/// Create a test context with in-memory database
pub fn create_test_context() -> Arc<AppContext> {
    TestContextBuilder::new()
        .build()
        .expect("Failed to create test context")
}
