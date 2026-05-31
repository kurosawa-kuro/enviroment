from typing import Dict, List, Any, Optional
from repository import TodoRepository, TodoRepositoryFactory


class TodoService:
    """Todoアプリケーションのビジネスロジックを管理するサービスクラス"""
    
    def __init__(self, repository: Optional[TodoRepository] = None):
        """
        サービスの初期化
        
        Args:
            repository: データアクセス用のリポジトリ（Noneの場合はファクトリから自動生成）
        """
        self.repository = repository or TodoRepositoryFactory.create_repository()
    
    def add_todo(self, title: str, category_ids: Optional[List[int]] = None) -> bool:
        """
        新しいTodoを追加
        
        Args:
            title: Todoのタイトル
            category_ids: 関連付けるカテゴリIDのリスト
            
        Returns:
            bool: 追加に成功した場合True
        """
        return self.repository.add_todo(title, category_ids)
    
    def add_category(self, title: str) -> bool:
        """
        新しいカテゴリを追加
        
        Args:
            title: カテゴリのタイトル
            
        Returns:
            bool: 追加に成功した場合True
        """
        return self.repository.add_category(title)
    
    def get_todo_categories(self, todo_id: int) -> List[Dict[str, Any]]:
        """
        指定されたTodoのカテゴリを取得
        
        Args:
            todo_id: TodoのID
            
        Returns:
            List[Dict[str, Any]]: カテゴリのリスト
        """
        return self.repository.get_todo_categories(todo_id)
    
    def get_filtered_todos(self, filter_state: str = "all", 
                          filter_category: Optional[int] = None) -> List[Dict[str, Any]]:
        """
        フィルター条件に基づいてTodoを取得
        
        Args:
            filter_state: 状態フィルター ("all", "todo", "done")
            filter_category: カテゴリフィルター (None の場合は全カテゴリ)
            
        Returns:
            List[Dict[str, Any]]: フィルターされたTodoのリスト
        """
        return self.repository.get_filtered_todos(filter_state, filter_category)
    
    def update_todo_state(self, todo_id: int, new_state: str) -> bool:
        """
        Todoの状態を更新
        
        Args:
            todo_id: TodoのID
            new_state: 新しい状態 ("todo", "done")
            
        Returns:
            bool: 更新に成功した場合True
        """
        return self.repository.update_todo_state(todo_id, new_state)
    
    def delete_todo(self, todo_id: int) -> bool:
        """
        Todoを削除
        
        Args:
            todo_id: TodoのID
            
        Returns:
            bool: 削除に成功した場合True
        """
        return self.repository.delete_todo(todo_id)
    
    def get_statistics(self) -> Dict[str, int]:
        """
        統計情報を取得
        
        Returns:
            Dict[str, int]: 統計情報 (total, todo, done)
        """
        return self.repository.get_statistics()
    
    def get_all_todos(self) -> List[Dict[str, Any]]:
        """
        全てのTodoを取得
        
        Returns:
            List[Dict[str, Any]]: Todoのリスト
        """
        return self.repository.get_all_todos()
    
    def get_all_categories(self) -> List[Dict[str, Any]]:
        """
        全てのカテゴリを取得
        
        Returns:
            List[Dict[str, Any]]: カテゴリのリスト
        """
        return self.repository.get_all_categories()
    
    def get_debug_info(self) -> Dict[str, Any]:
        """
        デバッグ情報を取得
        
        Returns:
            Dict[str, Any]: デバッグ情報
        """
        todos = self.get_all_todos()
        categories = self.get_all_categories()
        
        return {
            "total_todos": len(todos),
            "total_categories": len(categories),
            "repository_type": type(self.repository).__name__,
            "todos": todos,
            "categories": categories
        }
    
    def get_database_info(self) -> Dict[str, Any]:
        """
        データベース情報を取得
        
        Returns:
            Dict[str, Any]: データベース情報
        """
        import os
        database_type = os.getenv('DATABASE_TYPE', 'MEMORY').upper()
        
        info = {
            "database_type": database_type,
            "repository_class": type(self.repository).__name__
        }
        
        if database_type == 'NEON':
            info.update({
                "neon_host": os.getenv('NEON_DATABASE_HOST', 'Not set'),
                "neon_database": os.getenv('NEON_DATABASE_NAME', 'Not set'),
                "neon_user": os.getenv('NEON_DATABASE_USER', 'Not set')
            })
        
        return info