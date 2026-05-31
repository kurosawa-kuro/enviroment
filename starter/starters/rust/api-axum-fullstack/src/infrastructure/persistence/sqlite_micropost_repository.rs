use std::sync::Mutex;

use rusqlite::Connection;

use crate::domain::micropost::entity::Micropost;
use crate::domain::micropost::repository::MicropostRepository;

pub struct SqliteMicropostRepository {
    conn: Mutex<Connection>,
}

impl SqliteMicropostRepository {
    pub fn new(db_path: &str) -> Self {
        let conn = Connection::open(db_path).expect("Failed to open database");
        conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS microposts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL
            );",
        )
        .expect("Failed to create table");
        Self {
            conn: Mutex::new(conn),
        }
    }
}

impl MicropostRepository for SqliteMicropostRepository {
    fn list(&self) -> Vec<Micropost> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn
            .prepare("SELECT id, title FROM microposts ORDER BY id DESC")
            .expect("Failed to prepare statement");
        stmt.query_map([], |row| {
            Ok(Micropost {
                id: row.get(0)?,
                title: row.get(1)?,
            })
        })
        .expect("Failed to query microposts")
        .filter_map(|r| r.ok())
        .collect()
    }

    fn find_by_id(&self, id: i64) -> Option<Micropost> {
        let conn = self.conn.lock().unwrap();
        conn.query_row(
            "SELECT id, title FROM microposts WHERE id = ?1",
            [id],
            |row| {
                Ok(Micropost {
                    id: row.get(0)?,
                    title: row.get(1)?,
                })
            },
        )
        .ok()
    }

    fn create(&self, title: &str) -> Micropost {
        let conn = self.conn.lock().unwrap();
        conn.execute("INSERT INTO microposts (title) VALUES (?1)", [title])
            .expect("Failed to insert micropost");
        let id = conn.last_insert_rowid();
        Micropost {
            id,
            title: title.to_string(),
        }
    }
}
