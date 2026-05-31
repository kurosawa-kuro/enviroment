import unittest
from unittest.mock import patch, MagicMock
import os
import sys

# srcディレクトリをパスに追加
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from repository import TodoRepository, MemoryTodoRepository, NeonTodoRepository, TodoRepositoryFactory


class TestMemoryTodoRepository(unittest.TestCase):
    """MemoryTodoRepositoryのテストクラス"""
    
    def setUp(self):
        """テスト前の準備"""
        self.repository = MemoryTodoRepository()
    
    def test_add_todo(self):
        """Todo追加のテスト"""
        # 正常なTodo追加
        result = self.repository.add_todo("テストTodo")
        self.assertTrue(result)
        self.assertEqual(len(self.repository.todos), 1)
        self.assertEqual(self.repository.todos[0]['title'], "テストTodo")
        self.assertEqual(self.repository.todos[0]['state'], "todo")
        
        # 空のタイトル
        result = self.repository.add_todo("")
        self.assertFalse(result)
        self.assertEqual(len(self.repository.todos), 1)
    
    def test_add_category(self):
        """カテゴリ追加のテスト"""
        # 正常なカテゴリ追加
        result = self.repository.add_category("テストカテゴリ")
        self.assertTrue(result)
        self.assertEqual(len(self.repository.categories), 1)
        self.assertEqual(self.repository.categories[0]['title'], "テストカテゴリ")
        
        # 空のタイトル
        result = self.repository.add_category("")
        self.assertFalse(result)
        self.assertEqual(len(self.repository.categories), 1)
    
    def test_get_todo_categories(self):
        """Todoカテゴリ取得のテスト"""
        # カテゴリとTodoを作成
        self.repository.add_category("カテゴリ1")
        self.repository.add_category("カテゴリ2")
        self.repository.add_todo("テストTodo", [1, 2])
        
        # カテゴリを取得
        categories = self.repository.get_todo_categories(1)
        self.assertEqual(len(categories), 2)
        category_titles = [cat['title'] for cat in categories]
        self.assertIn("カテゴリ1", category_titles)
        self.assertIn("カテゴリ2", category_titles)
    
    def test_get_filtered_todos(self):
        """フィルター機能のテスト"""
        # テストデータを作成
        self.repository.add_category("カテゴリ1")
        self.repository.add_todo("Todo1", [1])
        self.repository.add_todo("Todo2", [1])
        self.repository.add_todo("Todo3")
        
        # 状態でフィルター
        todos = self.repository.get_filtered_todos("todo")
        self.assertEqual(len(todos), 3)
        
        # カテゴリでフィルター
        todos = self.repository.get_filtered_todos("all", 1)
        self.assertEqual(len(todos), 2)
        
        # 状態とカテゴリでフィルター
        todos = self.repository.get_filtered_todos("todo", 1)
        self.assertEqual(len(todos), 2)
    
    def test_update_todo_state(self):
        """Todo状態更新のテスト"""
        self.repository.add_todo("テストTodo")
        
        # 状態を更新
        result = self.repository.update_todo_state(1, "done")
        self.assertTrue(result)
        self.assertEqual(self.repository.todos[0]['state'], "done")
        
        # 存在しないTodo
        result = self.repository.update_todo_state(999, "done")
        self.assertFalse(result)
    
    def test_delete_todo(self):
        """Todo削除のテスト"""
        self.repository.add_category("カテゴリ1")
        self.repository.add_todo("テストTodo", [1])
        
        # Todoを削除
        result = self.repository.delete_todo(1)
        self.assertTrue(result)
        self.assertEqual(len(self.repository.todos), 0)
        self.assertEqual(len(self.repository.todo_categories), 0)
        
        # 存在しないTodo
        result = self.repository.delete_todo(999)
        self.assertFalse(result)
    
    def test_get_statistics(self):
        """統計情報取得のテスト"""
        self.repository.add_todo("Todo1")
        self.repository.add_todo("Todo2")
        self.repository.update_todo_state(1, "done")
        
        stats = self.repository.get_statistics()
        self.assertEqual(stats['total'], 2)
        self.assertEqual(stats['done'], 1)
        self.assertEqual(stats['todo'], 1)


class TestTodoRepositoryFactory(unittest.TestCase):
    """TodoRepositoryFactoryのテストクラス"""
    
    @patch.dict(os.environ, {'DATABASE_TYPE': 'MEMORY'})
    def test_create_memory_repository(self):
        """メモリリポジトリ作成のテスト"""
        repository = TodoRepositoryFactory.create_repository()
        self.assertIsInstance(repository, MemoryTodoRepository)
    
    @patch.dict(os.environ, {'DATABASE_TYPE': 'NEON'})
    def test_create_neon_repository(self):
        """Neonリポジトリ作成のテスト"""
        repository = TodoRepositoryFactory.create_repository()
        self.assertIsInstance(repository, NeonTodoRepository)
    
    @patch.dict(os.environ, {})
    def test_create_default_repository(self):
        """デフォルトリポジトリ作成のテスト"""
        repository = TodoRepositoryFactory.create_repository()
        self.assertIsInstance(repository, MemoryTodoRepository)


class TestNeonTodoRepository(unittest.TestCase):
    """NeonTodoRepositoryのテストクラス"""
    
    @patch('repository.psycopg2.connect')
    def setUp(self, mock_connect):
        """テスト前の準備"""
        self.mock_connection = MagicMock()
        self.mock_cursor = MagicMock()
        self.mock_connection.cursor.return_value.__enter__.return_value = self.mock_cursor
        mock_connect.return_value.__enter__.return_value = self.mock_connection
        
        with patch.dict(os.environ, {
            'DATABASE_TYPE': 'NEON',
            'NEON_DATABASE_HOST': 'test-host',
            'NEON_DATABASE_NAME': 'test-db',
            'NEON_DATABASE_USER': 'test-user',
            'NEON_DATABASE_PASSWORD': 'test-pass'
        }):
            self.repository = NeonTodoRepository()
    
    def test_get_connection_string(self):
        """接続文字列取得のテスト"""
        connection_string = self.repository._get_connection_string()
        self.assertIn("postgresql://test-user:test-pass@test-host:5432/test-db", connection_string)
    
    @patch('repository.psycopg2.connect')
    def test_add_todo(self, mock_connect):
        """Todo追加のテスト（Neon）"""
        mock_connect.return_value.__enter__.return_value = self.mock_connection
        self.mock_cursor.fetchone.return_value = {'id': 1}
        
        result = self.repository.add_todo("テストTodo")
        self.assertTrue(result)
        self.mock_cursor.execute.assert_called()


if __name__ == '__main__':
    unittest.main() 