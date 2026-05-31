# Kotlin Spring Boot API Blueprint

Kotlin + Spring Boot で型安全な業務 API を作る時の公開用ブループリント。

## 採用する場面

- Spring Boot を使いながら null 安全と簡潔な記述を重視したい。
- JVM の長期保守性と Kotlin の表現力を両方使いたい。
- Java Spring Boot より DTO / validation をコンパクトに保ちたい。

## 推奨スタック

| 項目 | 推奨 |
|---|---|
| Language | Kotlin 2.x |
| Runtime | Java 21 |
| Framework | Spring Boot 3 |
| Build | Gradle Kotlin DSL |
| Web | Spring Web |
| Validation | Bean Validation |
| Test | JUnit 5 + kotest assertions optional |
| Config | `application.yml` + environment variables |

## ディレクトリ

```text
src/main/kotlin/com/example/app/
  AppApplication.kt
  config/
  health/
    HealthController.kt
  item/
    ItemController.kt
    ItemService.kt
    ItemRepository.kt
    ItemRequest.kt
    ItemResponse.kt
  common/
    ApiError.kt
    GlobalExceptionHandler.kt
src/main/resources/
  application.yml
src/test/kotlin/com/example/app/
  health/
  item/
.env.example
build.gradle.kts
Makefile
```

## API 契約

- `GET /healthz`: process health。
- `GET /readyz`: 外部依存の readiness。
- `GET /api/items`: 一覧。
- `POST /api/items`: 作成。

## 設定

```yaml
server:
  port: ${PORT:8080}

app:
  log-level: ${LOG_LEVEL:INFO}
```

```dotenv
PORT=8080
DATABASE_URL=
LOG_LEVEL=INFO
```

`.env.example` 以外の env ファイルや `secret.yaml` はコミットしない。

## 実装ルール

- DTO は `data class` にする。
- nullable な設定値は起動時に検証して落とす。
- Controller は Spring の型に依存してよいが、Service は HTTP 境界から離す。
- `@ControllerAdvice` で例外を API エラーに変換する。
- DB は必要になった段階で JDBC / JPA / Exposed から選ぶ。
- `application-local.yml` を作る場合は `.gitignore` 対象にする。

## Makefile 例

```makefile
.PHONY: run test build

run:
	./gradlew bootRun

test:
	./gradlew test

build:
	./gradlew build
```
