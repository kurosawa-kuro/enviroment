# Backend Web Frameworks

Web API backend の参照ブループリント。

## 一覧

| ファイル | 用途 |
|---|---|
| [fastapi.md](./fastapi.md) | Python + FastAPI の API / 小規模 CRUD 構成 |
| [rust.md](./rust.md) | Rust + axum の型安全な API 構成 |
| [hono.md](./hono.md) | TypeScript + Hono の軽量 API 構成 |
| [express.md](./express.md) | Node.js + Express の API 構成 |
| [go-chi.md](./go-chi.md) | Go + chi の標準 HTTP API 構成 |
| [go-gin.md](./go-gin.md) | Go + Gin の API 構成 |
| [java-springboot.md](./java-springboot.md) | Java + Spring Boot の業務 API 構成 |
| [kotlin-springboot.md](./kotlin-springboot.md) | Kotlin + Spring Boot の型安全 API 構成 |

## 採用判断

| 要件 | 推奨 |
|---|---|
| Python の ML / batch 資産と近い API | FastAPI |
| 型で境界を固める高信頼 API | Rust + axum |
| 小さく速い TypeScript API | Hono |
| Node.js の定番 API | Express |
| Go 標準寄りの薄い API | chi |
| Go でフル機能な Web API | Gin |
| 企業系・長期保守・JVM | Spring Boot |
| Spring Boot で null 安全や DSL を重視 | Kotlin Spring Boot |
