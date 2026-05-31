//! Mock Factories for Testing
//!
//! Provides mock implementations of all injectable dependencies.

use std::sync::atomic::{AtomicU32, Ordering};
use std::sync::Mutex;

use chrono::{DateTime, TimeZone, Utc};

use crate::domain::entities::{Item, NewItem, UpdateItem};
use crate::domain::repositories::{ItemRepository, RepoResult};
use crate::interfaces::{AppConfig, Clock, ConfigProvider, ExecutionIdGenerator};
use crate::shared::constants::{AppEnv, LogLevel, RunnerMode};

// ============================================================================
// Clock Mocks
// ============================================================================

/// Mock clock with fixed time
pub struct MockClock {
    /// Fixed timestamp in milliseconds
    pub timestamp: i64,
}

impl MockClock {
    pub fn new(timestamp: i64) -> Self {
        Self { timestamp }
    }
}

impl Default for MockClock {
    fn default() -> Self {
        // 2023-11-14 00:00:00 UTC
        Self {
            timestamp: 1700000000000,
        }
    }
}

impl Clock for MockClock {
    fn now(&self) -> i64 {
        self.timestamp
    }

    fn to_iso_string(&self) -> String {
        self.now_utc().to_rfc3339()
    }

    fn now_utc(&self) -> DateTime<Utc> {
        Utc.timestamp_millis_opt(self.timestamp).unwrap()
    }
}

// ============================================================================
// Execution ID Mocks
// ============================================================================

/// Mock execution ID generator with fixed or sequential IDs
pub struct MockExecutionIdGenerator {
    /// Fixed ID to return
    pub fixed_id: Option<String>,
    /// Counter for sequential IDs
    counter: AtomicU32,
}

impl MockExecutionIdGenerator {
    pub fn new() -> Self {
        Self {
            fixed_id: None,
            counter: AtomicU32::new(0),
        }
    }

    pub fn with_fixed_id(id: impl Into<String>) -> Self {
        Self {
            fixed_id: Some(id.into()),
            counter: AtomicU32::new(0),
        }
    }
}

impl Default for MockExecutionIdGenerator {
    fn default() -> Self {
        Self::with_fixed_id("exec_test_123456")
    }
}

impl ExecutionIdGenerator for MockExecutionIdGenerator {
    fn generate(&self) -> String {
        if let Some(ref id) = self.fixed_id {
            id.clone()
        } else {
            let n = self.counter.fetch_add(1, Ordering::SeqCst);
            format!("exec_test_{}", n)
        }
    }
}

// ============================================================================
// Config Mocks
// ============================================================================

/// Mock config provider
pub struct MockConfigProvider {
    pub config: AppConfig,
}

impl MockConfigProvider {
    pub fn new(config: AppConfig) -> Self {
        Self { config }
    }
}

impl Default for MockConfigProvider {
    fn default() -> Self {
        Self {
            config: AppConfig {
                project_name: "batch-test".to_string(),
                app_env: AppEnv::Test,
                runner_mode: RunnerMode::Workflow,
                log_level: LogLevel::Debug,
                db_path: ":memory:".to_string(),
                database_url: None,
                api_key: None,
            },
        }
    }
}

impl ConfigProvider for MockConfigProvider {
    fn get(&self) -> &AppConfig {
        &self.config
    }
}

// ============================================================================
// Item Repository Mocks
// ============================================================================

/// In-memory mock item repository
pub struct MockItemRepository {
    items: Mutex<Vec<Item>>,
    next_id: AtomicU32,
}

impl MockItemRepository {
    pub fn new() -> Self {
        Self {
            items: Mutex::new(Vec::new()),
            next_id: AtomicU32::new(1),
        }
    }
}

impl Default for MockItemRepository {
    fn default() -> Self {
        Self::new()
    }
}

impl ItemRepository for MockItemRepository {
    fn create(&self, data: NewItem) -> RepoResult<Item> {
        let now = Utc::now();
        let id = self.next_id.fetch_add(1, Ordering::SeqCst) as i64;

        let item = Item {
            id,
            name: data.name,
            created_at: now,
            updated_at: now,
        };

        self.items.lock().unwrap().push(item.clone());
        Ok(item)
    }

    fn get(&self, id: i64) -> RepoResult<Option<Item>> {
        let items = self.items.lock().unwrap();
        Ok(items.iter().find(|i| i.id == id).cloned())
    }

    fn list(&self) -> RepoResult<Vec<Item>> {
        let mut items: Vec<_> = self.items.lock().unwrap().clone();
        items.sort_by(|a, b| b.created_at.cmp(&a.created_at));
        Ok(items)
    }

    fn update(&self, id: i64, data: UpdateItem) -> RepoResult<Option<Item>> {
        let mut items = self.items.lock().unwrap();
        if let Some(item) = items.iter_mut().find(|i| i.id == id) {
            if let Some(name) = data.name {
                item.name = name;
            }
            item.updated_at = Utc::now();
            Ok(Some(item.clone()))
        } else {
            Ok(None)
        }
    }

    fn delete(&self, id: i64) -> RepoResult<bool> {
        let mut items = self.items.lock().unwrap();
        let len_before = items.len();
        items.retain(|i| i.id != id);
        Ok(items.len() < len_before)
    }
}
