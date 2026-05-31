from abc import ABC, abstractmethod
from typing import Dict, List, Any, Optional
import os
import psycopg2
from psycopg2.extras import RealDictCursor
import json
from datetime import datetime


class TodoRepository(ABC):
    """Todoデータアクセスの抽象基底クラス"""
    
    @abstractmethod
    def add_todo(self, title: str, category_ids: Optional[List[int]] = None) -> bool:
        """新しいTodoを追加"""
        pass
    
    @abstractmethod
    def add_category(self, title: str) -> bool:
        """新しいカテゴリを追加"""
        pass
    
    @abstractmethod
    def get_todo_categories(self, todo_id: int) -> List[Dict[str, Any]]:
        """指定されたTodoのカテゴリを取得"""
        pass
    
    @abstractmethod
    def get_filtered_todos(self, filter_state: str = "all", 
                          filter_category: Optional[int] = None) -> List[Dict[str, Any]]:
        """フィルター条件に基づいてTodoを取得"""
        pass
    
    @abstractmethod
    def update_todo_state(self, todo_id: int, new_state: str) -> bool:
        """Todoの状態を更新"""
        pass
    
    @abstractmethod
    def delete_todo(self, todo_id: int) -> bool:
        """Todoを削除"""
        pass
    
    @abstractmethod
    def get_statistics(self) -> Dict[str, int]:
        """統計情報を取得"""
        pass
    
    @abstractmethod
    def get_all_todos(self) -> List[Dict[str, Any]]:
        """全てのTodoを取得"""
        pass
    
    @abstractmethod
    def get_all_categories(self) -> List[Dict[str, Any]]:
        """全てのカテゴリを取得"""
        pass


class MemoryTodoRepository(TodoRepository):
    """メモリ内データを使用するTodoリポジトリ"""
    
    def __init__(self):
        """メモリリポジトリの初期化"""
        self.todos: List[Dict[str, Any]] = []
        self.categories: List[Dict[str, Any]] = []
        self.todo_categories: List[Dict[str, int]] = []
        self.next_todo_id: int = 1
        self.next_category_id: int = 1
    
    def add_todo(self, title: str, category_ids: Optional[List[int]] = None) -> bool:
        """新しいTodoを追加"""
        if not title.strip():
            return False
            
        new_todo = {
            'id': self.next_todo_id,
            'title': title.strip(),
            'state': 'todo',
            'created_at': datetime.now().isoformat()
        }
        self.todos.append(new_todo)
        
        if category_ids:
            for category_id in category_ids:
                self.todo_categories.append({
                    'todo_id': self.next_todo_id,
                    'category_id': category_id
                })
        
        self.next_todo_id += 1
        return True
    
    def add_category(self, title: str) -> bool:
        """新しいカテゴリを追加"""
        if not title.strip():
            return False
            
        new_category = {
            'id': self.next_category_id,
            'title': title.strip(),
            'created_at': datetime.now().isoformat()
        }
        self.categories.append(new_category)
        self.next_category_id += 1
        return True
    
    def get_todo_categories(self, todo_id: int) -> List[Dict[str, Any]]:
        """指定されたTodoのカテゴリを取得"""
        todo_category_ids = [
            tc['category_id'] for tc in self.todo_categories 
            if tc['todo_id'] == todo_id
        ]
        return [
            cat for cat in self.categories 
            if cat['id'] in todo_category_ids
        ]
    
    def get_filtered_todos(self, filter_state: str = "all", 
                          filter_category: Optional[int] = None) -> List[Dict[str, Any]]:
        """フィルター条件に基づいてTodoを取得"""
        todos = self.todos.copy()
        
        # 状態でフィルター
        if filter_state != "all":
            todos = [todo for todo in todos if todo['state'] == filter_state]
        
        # カテゴリでフィルター
        if filter_category is not None:
            category_todo_ids = [
                tc['todo_id'] for tc in self.todo_categories 
                if tc['category_id'] == filter_category
            ]
            todos = [todo for todo in todos if todo['id'] in category_todo_ids]
        
        return todos
    
    def update_todo_state(self, todo_id: int, new_state: str) -> bool:
        """Todoの状態を更新"""
        for todo in self.todos:
            if todo['id'] == todo_id:
                todo['state'] = new_state
                todo['updated_at'] = datetime.now().isoformat()
                return True
        return False
    
    def delete_todo(self, todo_id: int) -> bool:
        """Todoを削除"""
        # Todoを削除
        original_count = len(self.todos)
        self.todos = [todo for todo in self.todos if todo['id'] != todo_id]
        
        # 関連するカテゴリの関連付けも削除
        self.todo_categories = [
            tc for tc in self.todo_categories 
            if tc['todo_id'] != todo_id
        ]
        
        return len(self.todos) < original_count
    
    def get_statistics(self) -> Dict[str, int]:
        """統計情報を取得"""
        total_todos = len(self.todos)
        done_todos = len([t for t in self.todos if t['state'] == 'done'])
        todo_todos = total_todos - done_todos
        
        return {
            'total': total_todos,
            'todo': todo_todos,
            'done': done_todos
        }
    
    def get_all_todos(self) -> List[Dict[str, Any]]:
        """全てのTodoを取得"""
        return self.todos.copy()
    
    def get_all_categories(self) -> List[Dict[str, Any]]:
        """全てのカテゴリを取得"""
        return self.categories.copy()


class NeonTodoRepository(TodoRepository):
    """Neon PostgreSQLを使用するTodoリポジトリ"""
    
    def __init__(self):
        """Neonリポジトリの初期化"""
        self.connection_string = self._get_connection_string()
        # テーブル作成は初回アクセス時に実行
        self._tables_created = False
    
    def _get_connection_string(self) -> str:
        """データベース接続文字列を取得"""
        # 環境変数から接続情報を取得
        database_url = os.getenv('NEON_DATABASE_URL')
        if database_url:
            return database_url
        
        # 個別の環境変数から構築
        host = os.getenv('NEON_DATABASE_HOST', 'localhost')
        port = os.getenv('NEON_DATABASE_PORT', '5432')
        database = os.getenv('NEON_DATABASE_NAME', 'todo_app')
        user = os.getenv('NEON_DATABASE_USER', 'postgres')
        password = os.getenv('NEON_DATABASE_PASSWORD', '')
        
        return f"postgresql://{user}:{password}@{host}:{port}/{database}"
    
    def _get_connection(self):
        """データベース接続を取得"""
        return psycopg2.connect(self.connection_string)
    
    def _ensure_tables_exist(self):
        """テーブルが存在することを確認し、必要に応じて作成"""
        if self._tables_created:
            return
            
        try:
            self._create_tables()
            self._tables_created = True
        except Exception as e:
            print(f"テーブル作成エラー: {e}")
            # テーブル作成に失敗しても続行（既に存在する可能性）
            self._tables_created = True
    
    def _create_tables(self):
        """テーブルを作成"""
        create_tables_sql = """
        CREATE TABLE IF NOT EXISTS categories (
            id SERIAL PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS todos (
            id SERIAL PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            state VARCHAR(50) DEFAULT 'todo',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS todo_categories (
            todo_id INTEGER REFERENCES todos(id) ON DELETE CASCADE,
            category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
            PRIMARY KEY (todo_id, category_id)
        );
        """
        
        with self._get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(create_tables_sql)
                conn.commit()
    
    def add_todo(self, title: str, category_ids: Optional[List[int]] = None) -> bool:
        """新しいTodoを追加"""
        if not title.strip():
            return False
        
        try:
            self._ensure_tables_exist()
            with self._get_connection() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                    # Todoを追加
                    cursor.execute(
                        "INSERT INTO todos (title) VALUES (%s) RETURNING id",
                        (title.strip(),)
                    )
                    todo_id = cursor.fetchone()['id']
                    
                    # カテゴリを関連付け
                    if category_ids:
                        for category_id in category_ids:
                            cursor.execute(
                                "INSERT INTO todo_categories (todo_id, category_id) VALUES (%s, %s)",
                                (todo_id, category_id)
                            )
                    
                    conn.commit()
                    return True
        except Exception as e:
            print(f"Todo追加エラー: {e}")
            return False
    
    def add_category(self, title: str) -> bool:
        """新しいカテゴリを追加"""
        if not title.strip():
            return False
        
        try:
            self._ensure_tables_exist()
            with self._get_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute(
                        "INSERT INTO categories (title) VALUES (%s)",
                        (title.strip(),)
                    )
                    conn.commit()
                    return True
        except Exception as e:
            print(f"カテゴリ追加エラー: {e}")
            return False
    
    def get_todo_categories(self, todo_id: int) -> List[Dict[str, Any]]:
        """指定されたTodoのカテゴリを取得"""
        try:
            self._ensure_tables_exist()
            with self._get_connection() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                    cursor.execute("""
                        SELECT c.id, c.title, c.created_at
                        FROM categories c
                        JOIN todo_categories tc ON c.id = tc.category_id
                        WHERE tc.todo_id = %s
                    """, (todo_id,))
                    return [dict(row) for row in cursor.fetchall()]
        except Exception as e:
            print(f"カテゴリ取得エラー: {e}")
            return []
    
    def get_filtered_todos(self, filter_state: str = "all", 
                          filter_category: Optional[int] = None) -> List[Dict[str, Any]]:
        """フィルター条件に基づいてTodoを取得"""
        try:
            self._ensure_tables_exist()
            with self._get_connection() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                    query = "SELECT id, title, state, created_at, updated_at FROM todos"
                    params = []
                    
                    conditions = []
                    if filter_state != "all":
                        conditions.append("state = %s")
                        params.append(filter_state)
                    
                    if filter_category is not None:
                        query += " JOIN todo_categories tc ON todos.id = tc.todo_id"
                        conditions.append("tc.category_id = %s")
                        params.append(filter_category)
                    
                    if conditions:
                        query += " WHERE " + " AND ".join(conditions)
                    
                    query += " ORDER BY created_at DESC"
                    
                    cursor.execute(query, params)
                    return [dict(row) for row in cursor.fetchall()]
        except Exception as e:
            print(f"Todo取得エラー: {e}")
            return []
    
    def update_todo_state(self, todo_id: int, new_state: str) -> bool:
        """Todoの状態を更新"""
        try:
            self._ensure_tables_exist()
            with self._get_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute(
                        "UPDATE todos SET state = %s, updated_at = CURRENT_TIMESTAMP WHERE id = %s",
                        (new_state, todo_id)
                    )
                    conn.commit()
                    return cursor.rowcount > 0
        except Exception as e:
            print(f"Todo更新エラー: {e}")
            return False
    
    def delete_todo(self, todo_id: int) -> bool:
        """Todoを削除"""
        try:
            self._ensure_tables_exist()
            with self._get_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute("DELETE FROM todos WHERE id = %s", (todo_id,))
                    conn.commit()
                    return cursor.rowcount > 0
        except Exception as e:
            print(f"Todo削除エラー: {e}")
            return False
    
    def get_statistics(self) -> Dict[str, int]:
        """統計情報を取得"""
        try:
            self._ensure_tables_exist()
            with self._get_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute("SELECT COUNT(*) as total FROM todos")
                    total = cursor.fetchone()[0]
                    
                    cursor.execute("SELECT COUNT(*) as done FROM todos WHERE state = 'done'")
                    done = cursor.fetchone()[0]
                    
                    return {
                        'total': total,
                        'todo': total - done,
                        'done': done
                    }
        except Exception as e:
            print(f"統計取得エラー: {e}")
            return {'total': 0, 'todo': 0, 'done': 0}
    
    def get_all_todos(self) -> List[Dict[str, Any]]:
        """全てのTodoを取得"""
        try:
            self._ensure_tables_exist()
            with self._get_connection() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                    cursor.execute("SELECT id, title, state, created_at, updated_at FROM todos ORDER BY created_at DESC")
                    return [dict(row) for row in cursor.fetchall()]
        except Exception as e:
            print(f"全Todo取得エラー: {e}")
            return []
    
    def get_all_categories(self) -> List[Dict[str, Any]]:
        """全てのカテゴリを取得"""
        try:
            self._ensure_tables_exist()
            with self._get_connection() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                    cursor.execute("SELECT id, title, created_at FROM categories ORDER BY created_at")
                    return [dict(row) for row in cursor.fetchall()]
        except Exception as e:
            print(f"全カテゴリ取得エラー: {e}")
            return []


class TodoRepositoryFactory:
    """Todoリポジトリのファクトリクラス"""
    
    @staticmethod
    def create_repository() -> TodoRepository:
        """環境変数に基づいて適切なリポジトリを作成"""
        database_type = os.getenv('DATABASE_TYPE', 'MEMORY').upper()
        
        if database_type == 'NEON':
            return NeonTodoRepository()
        else:
            return MemoryTodoRepository()
