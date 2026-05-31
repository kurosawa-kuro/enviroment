import streamlit as st
from typing import Dict, List, Any
import os
from dotenv import load_dotenv
from service import TodoService

# 環境変数の読み込み
load_dotenv('env.local')

def initialize_session_state() -> None:
    """初期化処理：セッション状態の設定"""
    if 'todo_service' not in st.session_state:
        st.session_state.todo_service = TodoService()
    if 'filter_state' not in st.session_state:
        st.session_state.filter_state = "all"
    if 'filter_category' not in st.session_state:
        st.session_state.filter_category = None

def display_database_info() -> None:
    """データベース情報の表示"""
    todo_service = st.session_state.todo_service
    db_info = todo_service.get_database_info()
    
    st.sidebar.markdown("---")
    st.sidebar.subheader("🗄️ データベース情報")
    
    # データベースタイプの表示
    db_type = db_info['database_type']
    if db_type == 'MEMORY':
        st.sidebar.info("💾 メモリ内データベース")
    elif db_type == 'NEON':
        st.sidebar.success("☁️ Neon PostgreSQL")
        st.sidebar.caption(f"ホスト: {db_info.get('neon_host', 'N/A')}")
        st.sidebar.caption(f"データベース: {db_info.get('neon_database', 'N/A')}")
    
    st.sidebar.caption(f"リポジトリ: {db_info['repository_class']}")

def display_todos(todos: List[Dict[str, Any]]) -> None:
    """Todoリストの表示"""
    if not todos:
        st.info("📝 該当するTodoはありません")
        return
    
    todo_service = st.session_state.todo_service
    
    for todo in todos:
        with st.container():
            col1, col2 = st.columns([5, 1])
            with col1:
                status_icon = "✅" if todo['state'] == 'done' else "⏳"
                status_text = "完了" if todo['state'] == 'done' else "未完了"
                st.write(f"{status_icon} **{todo['title']}** ({status_text})")
                
                # カテゴリの表示
                categories = todo_service.get_todo_categories(todo['id'])
                if categories:
                    category_tags = " ".join([f"🏷️{cat['title']}" for cat in categories])
                    st.caption(category_tags)
                
                # 作成日時の表示（存在する場合）
                if 'created_at' in todo:
                    st.caption(f"作成: {todo['created_at'][:19]}")
            with col2:
                st.caption(f"ID: {todo['id']}")

def display_statistics() -> None:
    """統計情報の表示"""
    todo_service = st.session_state.todo_service
    stats = todo_service.get_statistics()
    
    col1, col2, col3 = st.columns(3)
    with col1:
        st.metric("総数", stats['total'])
    with col2:
        st.metric("未完了", stats['todo'])
    with col3:
        st.metric("完了", stats['done'])

def main() -> None:
    """メイン処理"""
    st.set_page_config(
        page_title="Simple Todo App",
        page_icon="📝",
        layout="wide"
    )
    
    initialize_session_state()
    todo_service = st.session_state.todo_service
    
    # サイドバーにデータベース情報を表示
    display_database_info()
    
    st.title("📝 Simple Todo App")
    st.markdown("---")
    
    # 統計情報表示
    display_statistics()
    st.markdown("---")
    
    # カテゴリ管理
    st.subheader("🏷️ カテゴリ管理")
    with st.form("add_category_form", clear_on_submit=True):
        col1, col2 = st.columns([4, 1])
        with col1:
            new_category_title = st.text_input(
                "カテゴリ名",
                placeholder="カテゴリ名を入力してください...",
                label_visibility="collapsed"
            )
        with col2:
            category_submitted = st.form_submit_button("カテゴリ追加", use_container_width=True)
        
        if category_submitted:
            if new_category_title:
                if todo_service.add_category(new_category_title):
                    st.success(f"カテゴリ「{new_category_title}」を追加しました！")
                    st.rerun()
                else:
                    st.error("カテゴリの追加に失敗しました")
            else:
                st.error("カテゴリ名を入力してください")
    
    # 既存カテゴリの表示
    categories = todo_service.get_all_categories()
    if categories:
        st.write("**既存カテゴリ:**")
        category_tags = " ".join([f"🏷️{cat['title']}" for cat in categories])
        st.caption(category_tags)
    
    st.markdown("---")

    # Todo追加フォーム
    st.subheader("✏️ 新しいTodoを追加")
    with st.form("add_todo_form", clear_on_submit=True):
        new_todo_title = st.text_input(
            "Todoタイトル",
            placeholder="やることを入力してください..."
        )
        
        # カテゴリ選択
        selected_categories = []
        if categories:
            selected_categories = st.multiselect(
                "カテゴリを選択（複数選択可）",
                options=[cat['id'] for cat in categories],
                format_func=lambda x: next(cat['title'] for cat in categories if cat['id'] == x),
                default=[]
            )
        
        submitted = st.form_submit_button("追加", use_container_width=True)
        
        if submitted:
            if new_todo_title:
                if todo_service.add_todo(new_todo_title, selected_categories):
                    st.success(f"「{new_todo_title}」を追加しました！")
                    st.rerun()
                else:
                    st.error("Todoの追加に失敗しました")
            else:
                st.error("Todoタイトルを入力してください")
    
    st.markdown("---")
    
    # フィルター機能
    st.subheader("🔍 フィルター")
    
    col1, col2 = st.columns(2)
    
    with col1:
        filter_options = {
            "all": "全て表示",
            "todo": "未完了のみ",
            "done": "完了のみ"
        }
        
        selected_filter = st.selectbox(
            "状態でフィルター",
            options=list(filter_options.keys()),
            format_func=lambda x: filter_options[x],
            index=list(filter_options.keys()).index(st.session_state.filter_state)
        )
        
        if selected_filter != st.session_state.filter_state:
            st.session_state.filter_state = selected_filter
            st.rerun()
    
    with col2:
        # カテゴリフィルター
        if categories:
            category_options = [None] + [cat['id'] for cat in categories]
            
            selected_category = st.selectbox(
                "カテゴリでフィルター",
                options=category_options,
                format_func=lambda x: "全カテゴリ" if x is None else next(cat['title'] for cat in categories if cat['id'] == x),
                index=0 if st.session_state.filter_category is None else category_options.index(st.session_state.filter_category)
            )
            
            if selected_category != st.session_state.filter_category:
                st.session_state.filter_category = selected_category
                st.rerun()
    
    # Todoリスト表示
    filter_label = filter_options[st.session_state.filter_state]
    if st.session_state.filter_category is not None:
        category_name = next(cat['title'] for cat in categories if cat['id'] == st.session_state.filter_category)
        filter_label += f" - カテゴリ: {category_name}"
    
    st.subheader(f"📋 Todoリスト ({filter_label})")
    filtered_todos = todo_service.get_filtered_todos(
        st.session_state.filter_state, 
        st.session_state.filter_category
    )
    display_todos(filtered_todos)
    
    # デバッグ情報（開発用）
    with st.expander("🔧 デバッグ情報", expanded=False):
        debug_info = todo_service.get_debug_info()
        debug_info.update({
            "current_filter": st.session_state.filter_state,
            "filter_category": st.session_state.filter_category,
            "database_info": todo_service.get_database_info()
        })
        st.json(debug_info)

if __name__ == "__main__":
    main()