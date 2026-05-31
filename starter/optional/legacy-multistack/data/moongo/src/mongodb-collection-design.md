# MongoDB コレクション設計

MongoDB Atlasでのコレクション（テーブル相当）設計ガイドです。

---

## コレクション作成 ToDo

1. **MongoDB Atlas に接続**

   ```bash
   # mongosh を使用
   mongosh "mongodb+srv://user:password@cluster.mongodb.net/news-app"
   ```

2. **データベースとコレクションを作成**

   ```javascript
   // データベースを選択（存在しない場合は自動作成）
   use news-app

   // todo コレクションを作成
   db.createCollection("todos")

   // category コレクションを作成
   db.createCollection("categories")
   ```

3. **スキーマバリデーションを設定（オプション）**

   ```javascript
   db.runCommand({
     collMod: "todos",
     validator: {
       $jsonSchema: {
         bsonType: "object",
         required: ["title"],
         properties: {
           title: {
             bsonType: "string",
             description: "タイトルは必須です"
           },
           categoryIds: {
             bsonType: "array",
             items: {
               bsonType: "objectId"
             },
             description: "カテゴリIDの配列"
           },
           createdAt: {
             bsonType: "date"
           },
           updatedAt: {
             bsonType: "date"
           }
         }
       }
     }
   })
   ```

4. **インデックスを作成**

   ```javascript
   // タイトルにインデックスを作成
   db.todos.createIndex({ title: 1 })

   // カテゴリIDにインデックスを作成
   db.todos.createIndex({ categoryIds: 1 })

   // 作成日時にインデックスを作成
   db.todos.createIndex({ createdAt: -1 })
   ```

5. **サンプルデータを挿入**

   ```javascript
   // カテゴリを挿入
   db.categories.insertMany([
     { title: "日用品", createdAt: new Date() },
     { title: "仕事", createdAt: new Date() }
   ])

   // カテゴリIDを取得
   const categories = db.categories.find().toArray()

   // Todoを挿入（カテゴリ参照付き）
   db.todos.insertOne({
     title: "買い物",
     categoryIds: [categories[0]._id, categories[1]._id],
     createdAt: new Date(),
     updatedAt: new Date()
   })
   ```

6. **データの確認**

   ```javascript
   // 全てのTodoを取得
   db.todos.find().pretty()

   // カテゴリ情報と結合して取得（Aggregation）
   db.todos.aggregate([
     {
       $lookup: {
         from: "categories",
         localField: "categoryIds",
         foreignField: "_id",
         as: "categories"
       }
     }
   ])
   ```

---

## MongoDB vs PostgreSQL の違い

| 概念 | PostgreSQL | MongoDB |
|------|------------|---------|
| テーブル | table | collection |
| 行 | row | document |
| 列 | column | field |
| スキーマ | 厳密に定義 | 柔軟（スキーマレス） |
| リレーション | JOIN | $lookup / 埋め込み |
| 主キー | id (SERIAL) | _id (ObjectId) |

## 注意事項

- MongoDBはスキーマレスですが、スキーマバリデーションを使用することで整合性を保てます
- 多対多リレーションは、配列フィールドまたは埋め込みドキュメントで表現できます
- 大量のデータを扱う場合は、適切なインデックス設計が重要です
