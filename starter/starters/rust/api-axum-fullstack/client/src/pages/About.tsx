export function About() {
  return (
    <div>
      <h2>About</h2>
      <p>このアプリケーションは以下の技術で構築されています。</p>

      <div className="card">
        <h3>使用技術</h3>
        <ul className="tech-list">
          <li><strong>Rust</strong> &mdash; システムプログラミング言語</li>
          <li><strong>Axum</strong> &mdash; 非同期 Web フレームワーク</li>
          <li><strong>React</strong> &mdash; UI ライブラリ</li>
          <li><strong>TypeScript</strong> &mdash; 型安全な JavaScript</li>
          <li><strong>Pico CSS</strong> &mdash; 軽量 CSS フレームワーク</li>
          <li><strong>Tokio</strong> &mdash; 非同期ランタイム</li>
          <li><strong>SQLite</strong> &mdash; 組み込みデータベース (rusqlite)</li>
        </ul>
      </div>
    </div>
  )
}
