//! DI Container Implementation
//!
//! Production container with real implementations.
//! Test container factory for testing with mocks.

use std::path::Path;
use std::sync::Arc;

use crate::domain::ItemRepository;
use crate::infrastructure::{
    create_sqlite_client, init_config_with_path, SqliteDb, SqliteItemRepository, SystemClock,
    SystemExecutionIdGenerator, YamlConfigProvider,
};
use crate::interfaces::{Clock, ConfigProvider, ExecutionIdGenerator};

/// Application context - holds all dependencies
pub struct AppContext {
    pub clock: Arc<dyn Clock>,
    pub execution_id: Arc<dyn ExecutionIdGenerator>,
    pub config: Arc<dyn ConfigProvider>,
    pub db: SqliteDb,
    pub item_repo: Arc<dyn ItemRepository>,
}

impl AppContext {
    /// Create production context with real implementations
    pub fn production() -> Result<Arc<Self>, anyhow::Error> {
        Self::with_config_path(Path::new("env/config.yaml"))
    }

    /// Create production context with custom config path
    pub fn with_config_path(config_path: &Path) -> Result<Arc<Self>, anyhow::Error> {
        let config = init_config_with_path(config_path);
        let db = create_sqlite_client(&config.db_path, None)?;
        let item_repo = Arc::new(SqliteItemRepository::new(db.clone()));

        Ok(Arc::new(Self {
            clock: Arc::new(SystemClock::new()),
            execution_id: Arc::new(SystemExecutionIdGenerator::new()),
            config: Arc::new(YamlConfigProvider::with_config(config)),
            db,
            item_repo,
        }))
    }

    /// Create context with custom dependencies (for testing)
    pub fn custom(
        clock: Arc<dyn Clock>,
        execution_id: Arc<dyn ExecutionIdGenerator>,
        config: Arc<dyn ConfigProvider>,
        db: SqliteDb,
        item_repo: Arc<dyn ItemRepository>,
    ) -> Arc<Self> {
        Arc::new(Self {
            clock,
            execution_id,
            config,
            db,
            item_repo,
        })
    }
}

/// Builder for test contexts
pub struct TestContextBuilder {
    clock: Option<Arc<dyn Clock>>,
    execution_id: Option<Arc<dyn ExecutionIdGenerator>>,
    config: Option<Arc<dyn ConfigProvider>>,
    db: Option<SqliteDb>,
    item_repo: Option<Arc<dyn ItemRepository>>,
}

impl TestContextBuilder {
    pub fn new() -> Self {
        Self {
            clock: None,
            execution_id: None,
            config: None,
            db: None,
            item_repo: None,
        }
    }

    pub fn with_clock(mut self, clock: Arc<dyn Clock>) -> Self {
        self.clock = Some(clock);
        self
    }

    pub fn with_execution_id(mut self, gen: Arc<dyn ExecutionIdGenerator>) -> Self {
        self.execution_id = Some(gen);
        self
    }

    pub fn with_config(mut self, config: Arc<dyn ConfigProvider>) -> Self {
        self.config = Some(config);
        self
    }

    pub fn with_db(mut self, db: SqliteDb) -> Self {
        self.db = Some(db);
        self
    }

    pub fn with_item_repo(mut self, repo: Arc<dyn ItemRepository>) -> Self {
        self.item_repo = Some(repo);
        self
    }

    pub fn build(self) -> Result<Arc<AppContext>, anyhow::Error> {
        use crate::di::mocks::*;
        use crate::infrastructure::create_memory_db;

        let db = self.db.unwrap_or_else(|| create_memory_db().unwrap());

        // Initialize test schema if needed
        {
            let conn = db.lock().unwrap();
            conn.execute_batch(
                "
                CREATE TABLE IF NOT EXISTS migrations (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL UNIQUE,
                    applied_at TEXT NOT NULL DEFAULT (datetime('now'))
                );
                CREATE TABLE IF NOT EXISTS items (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );
                CREATE INDEX IF NOT EXISTS idx_items_created_at ON items(created_at DESC);
                ",
            )?;
        }

        let item_repo = self
            .item_repo
            .unwrap_or_else(|| Arc::new(SqliteItemRepository::new(db.clone())));

        Ok(Arc::new(AppContext {
            clock: self.clock.unwrap_or_else(|| Arc::new(MockClock::default())),
            execution_id: self
                .execution_id
                .unwrap_or_else(|| Arc::new(MockExecutionIdGenerator::default())),
            config: self
                .config
                .unwrap_or_else(|| Arc::new(MockConfigProvider::default())),
            db,
            item_repo,
        }))
    }
}

impl Default for TestContextBuilder {
    fn default() -> Self {
        Self::new()
    }
}
