//! Dependency Injection module

pub mod container;
pub mod mocks;

pub use container::{AppContext, TestContextBuilder};
pub use mocks::{MockClock, MockConfigProvider, MockExecutionIdGenerator, MockItemRepository};
