import pytest
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from typing import Dict, List, Any
from service import TodoService


class TestTodoService:
    """TodoServiceの正常系テストクラス"""
    
    def setup_method(self):
        """各テストメソッドの前に実行されるセットアップ"""
        self.service = TodoService()
    
    def test_init(self):
        """初期化のテスト"""
        assert self.service.todos == []
        assert self.service.categories == []
        assert self.service.todo_categories == []
        assert self.service.next_todo_id == 1
        assert self.service.next_category_id == 1
    
    def test_add_todo_success(self):
        """Todo追加成功のテスト"""
        result = self.service.add_todo("テストタスク")
        
        assert result is True
        assert len(self.service.todos) == 1
        assert self.service.todos[0]['id'] == 1
        assert self.service.todos[0]['title'] == "テストタスク"
        assert self.service.todos[0]['state'] == 'todo'
        assert self.service.next_todo_id == 2
    
    def test_add_todo_with_whitespace(self):
        """空白文字を含むTodo追加のテスト"""
        result = self.service.add_todo("  テストタスク  ")
        
        assert result is True
        assert self.service.todos[0]['title'] == "テストタスク"
    
    def test_add_multiple_todos(self):
        """複数Todo追加のテスト"""
        self.service.add_todo("タスク1")
        self.service.add_todo("タスク2")
        self.service.add_todo("タスク3")
        
        assert len(self.service.todos) == 3
        assert self.service.todos[0]['id'] == 1
        assert self.service.todos[1]['id'] == 2
        assert self.service.todos[2]['id'] == 3
        assert self.service.next_todo_id == 4
    
    def test_add_category_success(self):
        """カテゴリ追加成功のテスト"""
        result = self.service.add_category("仕事")
        
        assert result is True
        assert len(self.service.categories) == 1
        assert self.service.categories[0]['id'] == 1
        assert self.service.categories[0]['title'] == "仕事"
        assert self.service.next_category_id == 2
    
    def test_add_category_with_whitespace(self):
        """空白文字を含むカテゴリ追加のテスト"""
        result = self.service.add_category("  仕事  ")
        
        assert result is True
        assert self.service.categories[0]['title'] == "仕事"
    
    def test_add_multiple_categories(self):
        """複数カテゴリ追加のテスト"""
        self.service.add_category("仕事")
        self.service.add_category("プライベート")
        self.service.add_category("学習")
        
        assert len(self.service.categories) == 3
        assert self.service.categories[0]['title'] == "仕事"
        assert self.service.categories[1]['title'] == "プライベート"
        assert self.service.categories[2]['title'] == "学習"
    
    def test_add_todo_with_categories(self):
        """カテゴリ付きTodo追加のテスト"""
        self.service.add_category("仕事")
        self.service.add_category("急用")
        
        result = self.service.add_todo("重要なタスク", [1, 2])
        
        assert result is True
        assert len(self.service.todo_categories) == 2
        assert self.service.todo_categories[0]['todo_id'] == 1
        assert self.service.todo_categories[0]['category_id'] == 1
        assert self.service.todo_categories[1]['todo_id'] == 1
        assert self.service.todo_categories[1]['category_id'] == 2
    
    def test_get_todo_categories(self):
        """Todoのカテゴリ取得のテスト"""
        self.service.add_category("仕事")
        self.service.add_category("急用")
        self.service.add_todo("重要なタスク", [1, 2])
        
        categories = self.service.get_todo_categories(1)
        
        assert len(categories) == 2
        assert categories[0]['title'] == "仕事"
        assert categories[1]['title'] == "急用"
    
    def test_get_todo_categories_empty(self):
        """カテゴリなしTodoのカテゴリ取得テスト"""
        self.service.add_todo("タスク")
        
        categories = self.service.get_todo_categories(1)
        
        assert categories == []
    
    def test_get_filtered_todos_all(self):
        """全てのTodo取得のテスト"""
        self.service.add_todo("タスク1")
        self.service.add_todo("タスク2")
        self.service.update_todo_state(2, 'done')
        
        todos = self.service.get_filtered_todos("all")
        
        assert len(todos) == 2
        assert todos[0]['title'] == "タスク1"
        assert todos[1]['title'] == "タスク2"
    
    def test_get_filtered_todos_todo_only(self):
        """未完了Todo取得のテスト"""
        self.service.add_todo("タスク1")
        self.service.add_todo("タスク2")
        self.service.update_todo_state(2, 'done')
        
        todos = self.service.get_filtered_todos("todo")
        
        assert len(todos) == 1
        assert todos[0]['title'] == "タスク1"
        assert todos[0]['state'] == 'todo'
    
    def test_get_filtered_todos_done_only(self):
        """完了Todo取得のテスト"""
        self.service.add_todo("タスク1")
        self.service.add_todo("タスク2")
        self.service.update_todo_state(2, 'done')
        
        todos = self.service.get_filtered_todos("done")
        
        assert len(todos) == 1
        assert todos[0]['title'] == "タスク2"
        assert todos[0]['state'] == 'done'
    
    def test_get_filtered_todos_by_category(self):
        """カテゴリでフィルターしたTodo取得のテスト"""
        self.service.add_category("仕事")
        self.service.add_category("プライベート")
        self.service.add_todo("仕事タスク", [1])
        self.service.add_todo("プライベートタスク", [2])
        self.service.add_todo("カテゴリなしタスク")
        
        todos = self.service.get_filtered_todos("all", 1)
        
        assert len(todos) == 1
        assert todos[0]['title'] == "仕事タスク"
    
    def test_update_todo_state_success(self):
        """Todo状態更新成功のテスト"""
        self.service.add_todo("タスク")
        
        result = self.service.update_todo_state(1, 'done')
        
        assert result is True
        assert self.service.todos[0]['state'] == 'done'
    
    def test_delete_todo_success(self):
        """Todo削除成功のテスト"""
        self.service.add_todo("タスク")
        
        result = self.service.delete_todo(1)
        
        assert result is True
        assert len(self.service.todos) == 0
    
    def test_delete_todo_with_categories(self):
        """カテゴリ付きTodo削除のテスト"""
        self.service.add_category("仕事")
        self.service.add_todo("タスク", [1])
        
        result = self.service.delete_todo(1)
        
        assert result is True
        assert len(self.service.todos) == 0
        assert len(self.service.todo_categories) == 0
    
    def test_get_statistics_empty(self):
        """空の統計情報取得のテスト"""
        stats = self.service.get_statistics()
        
        assert stats == {'total': 0, 'todo': 0, 'done': 0}
    
    def test_get_statistics_with_todos(self):
        """Todoありの統計情報取得のテスト"""
        self.service.add_todo("タスク1")
        self.service.add_todo("タスク2")
        self.service.add_todo("タスク3")
        self.service.update_todo_state(2, 'done')
        self.service.update_todo_state(3, 'done')
        
        stats = self.service.get_statistics()
        
        assert stats == {'total': 3, 'todo': 1, 'done': 2}
    
    def test_get_all_todos(self):
        """全Todo取得のテスト"""
        self.service.add_todo("タスク1")
        self.service.add_todo("タスク2")
        
        todos = self.service.get_all_todos()
        
        assert len(todos) == 2
        assert todos[0]['title'] == "タスク1"
        assert todos[1]['title'] == "タスク2"
        # 元のリストとは異なるオブジェクトであることを確認
        assert todos is not self.service.todos
    
    def test_get_all_categories(self):
        """全カテゴリ取得のテスト"""
        self.service.add_category("仕事")
        self.service.add_category("プライベート")
        
        categories = self.service.get_all_categories()
        
        assert len(categories) == 2
        assert categories[0]['title'] == "仕事"
        assert categories[1]['title'] == "プライベート"
        # 元のリストとは異なるオブジェクトであることを確認
        assert categories is not self.service.categories
    
    def test_get_debug_info(self):
        """デバッグ情報取得のテスト"""
        self.service.add_todo("タスク")
        self.service.add_category("仕事")
        
        debug_info = self.service.get_debug_info()
        
        assert debug_info['total_todos'] == 1
        assert debug_info['next_todo_id'] == 2
        assert debug_info['total_categories'] == 1
        assert debug_info['next_category_id'] == 2
        assert len(debug_info['todos']) == 1
        assert len(debug_info['categories']) == 1
    
    def test_load_and_get_state(self):
        """状態のロードと取得のテスト"""
        # 初期状態を設定
        self.service.add_todo("タスク1")
        self.service.add_category("仕事")
        
        # 状態を取得
        state = self.service.get_state()
        
        # 新しいサービスインスタンスを作成し、状態をロード
        new_service = TodoService()
        new_service.load_state(state)
        
        # 状態が正しく復元されていることを確認
        assert len(new_service.todos) == 1
        assert new_service.todos[0]['title'] == "タスク1"
        assert len(new_service.categories) == 1
        assert new_service.categories[0]['title'] == "仕事"
        assert new_service.next_todo_id == 2
        assert new_service.next_category_id == 2