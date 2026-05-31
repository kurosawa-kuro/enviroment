#!/usr/bin/env python3
"""
データベース切り替えテストスクリプト
環境変数を変更してメモリとNeonデータベースを切り替えてテストします
"""

import os
import sys
import subprocess
from pathlib import Path

# srcディレクトリをパスに追加
src_path = Path(__file__).parent.parent / 'src'
sys.path.insert(0, str(src_path))

from repository import TodoRepositoryFactory
from service import TodoService


def test_memory_database():
    """メモリデータベースのテスト"""
    print("🧪 メモリデータベースのテストを開始...")
    
    # 環境変数をメモリに設定
    os.environ['DATABASE_TYPE'] = 'MEMORY'
    
    # リポジトリを作成
    repository = TodoRepositoryFactory.create_repository()
    service = TodoService(repository)
    
    # テストデータを作成
    print("📝 テストデータを作成中...")
    service.add_category("テストカテゴリ1")
    service.add_category("テストカテゴリ2")
    service.add_todo("メモリDBのテストTodo1", [1])
    service.add_todo("メモリDBのテストTodo2", [1, 2])
    
    # データを確認
    todos = service.get_all_todos()
    categories = service.get_all_categories()
    stats = service.get_statistics()
    
    print(f"✅ 作成されたTodo数: {len(todos)}")
    print(f"✅ 作成されたカテゴリ数: {len(categories)}")
    print(f"✅ 統計情報: {stats}")
    
    # データベース情報を確認
    db_info = service.get_database_info()
    print(f"✅ データベースタイプ: {db_info['database_type']}")
    print(f"✅ リポジトリクラス: {db_info['repository_class']}")
    
    print("🎉 メモリデータベースのテスト完了！\n")


def test_neon_database():
    """Neonデータベースのテスト"""
    print("🧪 Neonデータベースのテストを開始...")
    
    # 環境変数をNeonに設定
    os.environ['DATABASE_TYPE'] = 'NEON'
    
    # テスト用のNeon接続情報を設定（実際の接続は行わない）
    os.environ['NEON_DATABASE_HOST'] = 'test-host.neon.tech'
    os.environ['NEON_DATABASE_NAME'] = 'test-database'
    os.environ['NEON_DATABASE_USER'] = 'test-user'
    os.environ['NEON_DATABASE_PASSWORD'] = 'test-password'
    
    try:
        # リポジトリを作成
        repository = TodoRepositoryFactory.create_repository()
        service = TodoService(repository)
        
        # データベース情報を確認
        db_info = service.get_database_info()
        print(f"✅ データベースタイプ: {db_info['database_type']}")
        print(f"✅ リポジトリクラス: {db_info['repository_class']}")
        print(f"✅ Neonホスト: {db_info.get('neon_host', 'N/A')}")
        print(f"✅ Neonデータベース: {db_info.get('neon_database', 'N/A')}")
        
        print("🎉 Neonデータベースの設定確認完了！")
        print("⚠️  実際のNeon接続テストは、有効な接続情報が必要です。\n")
        
    except Exception as e:
        print(f"❌ Neonデータベースのテストでエラーが発生: {e}")
        print("⚠️  これは予想される動作です（実際のNeon接続情報がないため）\n")


def test_factory_pattern():
    """ファクトリパターンのテスト"""
    print("🧪 ファクトリパターンのテストを開始...")
    
    # メモリリポジトリの作成
    os.environ['DATABASE_TYPE'] = 'MEMORY'
    memory_repo = TodoRepositoryFactory.create_repository()
    print(f"✅ メモリリポジトリ作成: {type(memory_repo).__name__}")
    
    # Neonリポジトリの作成
    os.environ['DATABASE_TYPE'] = 'NEON'
    neon_repo = TodoRepositoryFactory.create_repository()
    print(f"✅ Neonリポジトリ作成: {type(neon_repo).__name__}")
    
    # デフォルトリポジトリの作成
    del os.environ['DATABASE_TYPE']
    default_repo = TodoRepositoryFactory.create_repository()
    print(f"✅ デフォルトリポジトリ作成: {type(default_repo).__name__}")
    
    print("🎉 ファクトリパターンのテスト完了！\n")


def main():
    """メイン関数"""
    print("🚀 データベース切り替えテストを開始します\n")
    
    # 各テストを実行
    test_memory_database()
    test_neon_database()
    test_factory_pattern()
    
    print("🎊 すべてのテストが完了しました！")
    print("\n📋 使用方法:")
    print("1. メモリデータベース: DATABASE_TYPE=MEMORY")
    print("2. Neonデータベース: DATABASE_TYPE=NEON + Neon接続情報")
    print("3. env.localファイルで設定を変更してください")


if __name__ == "__main__":
    main() 