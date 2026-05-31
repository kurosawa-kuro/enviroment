export function Home() {
  return (
    <div>
      <h2>ようこそ</h2>
      <p>Starter は Rust + Axum で構築されたサンプル Web アプリケーションです。</p>

      <div className="card">
        <h3>API エンドポイント</h3>
        <ul className="endpoint-list">
          <li><code>GET /api/health</code> &mdash; ヘルスチェック</li>
          <li><code>GET /api/microposts</code> &mdash; Micropost 一覧</li>
          <li><code>GET /api/microposts/&#123;id&#125;</code> &mdash; Micropost 取得</li>
          <li><code>POST /api/microposts</code> &mdash; Micropost 作成</li>
        </ul>
      </div>
    </div>
  )
}
