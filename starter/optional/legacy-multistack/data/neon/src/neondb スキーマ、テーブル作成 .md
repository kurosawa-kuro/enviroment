以下のように ToDo リストを更新しました。
`todo` と `category` の多対多関係を表す中間テーブル `todo_category` を追加しています。

---

## スキーマ作成＆テーブル定義 ToDo

1. **Neon データベースに接続**

   ```bash
   psql 'postgresql://neondb_owner:…'
   ```

2. **スキーマを作成**

   ```sql
   -- 例として「todo_app」スキーマを作成
   CREATE SCHEMA todo_app;
   ```

3. **`todo` テーブルを作成**

   ```sql
   CREATE TABLE todo_app.todo (
     id    SERIAL    PRIMARY KEY,
     title TEXT      NOT NULL
   );
   ```

4. **`category` テーブルを作成**

   ```sql
   CREATE TABLE todo_app.category (
     id    SERIAL    PRIMARY KEY,
     title TEXT      NOT NULL
   );
   ```

5. **中間テーブル `todo_category` を作成**

   ```sql
   CREATE TABLE todo_app.todo_category (
     todo_id     INTEGER NOT NULL
       REFERENCES todo_app.todo(id)
       ON DELETE CASCADE,
     category_id INTEGER NOT NULL
       REFERENCES todo_app.category(id)
       ON DELETE CASCADE,
     PRIMARY KEY (todo_id, category_id)
   );
   ```

6. **定義内容の確認**

   ```sql
   -- スキーマ一覧
   \dn todo_app

   -- テーブル一覧
   \dt todo_app.*

   -- テーブル定義確認
   \d todo_app.todo
   \d todo_app.category
   \d todo_app.todo_category
   ```

7. **動作テスト**

   ```sql
   -- サンプルデータ挿入
   INSERT INTO todo_app.todo    (title)      VALUES ('買い物');
   INSERT INTO todo_app.category(title)      VALUES ('日用品');
   INSERT INTO todo_app.category(title)      VALUES ('仕事');

   -- リレーション登録
   INSERT INTO todo_app.todo_category(todo_id, category_id)
     VALUES (1, 1), (1, 2);

   -- JOIN で確認
   SELECT t.id, t.title, c.title AS category
     FROM todo_app.todo t
     JOIN todo_app.todo_category tc ON tc.todo_id = t.id
     JOIN todo_app.category c       ON c.id       = tc.category_id;
   ```

---

これで、`todo` ⇔ `category` の多対多リレーションが正しく定義・運用できるはずです。ご確認ください！
