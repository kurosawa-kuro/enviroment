# Java Spring Boot API Blueprint

Java + Spring Boot で業務 API を作る時の公開用ブループリント。

## 採用する場面

- JVM / Spring ecosystem を前提にした長期保守 API。
- 認証、DB、バッチ、外部連携を段階的に増やす。
- 型、DI、テストの標準構成を重視する。

## 推奨スタック

| 項目 | 推奨 |
|---|---|
| Language | Java 21 |
| Framework | Spring Boot 3 |
| Build | Gradle or Maven |
| Web | Spring Web |
| Validation | Bean Validation |
| Test | JUnit 5 + Spring Boot Test |
| DB | Spring Data JDBC or JPA, only when needed |
| Config | `application.yml` + environment variables |

## ディレクトリ

```text
src/main/java/com/example/app/
  AppApplication.java
  config/
  health/
    HealthController.java
  item/
    ItemController.java
    ItemService.java
    ItemRepository.java
    ItemRequest.java
    ItemResponse.java
  common/
    ApiError.java
    GlobalExceptionHandler.java
src/main/resources/
  application.yml
src/test/java/com/example/app/
  health/
  item/
.env.example
build.gradle
Makefile
```

## API 契約

- `GET /healthz`: process health。
- `GET /readyz`: 外部依存の readiness。
- `GET /api/items`: 一覧。
- `POST /api/items`: 作成。

## 設定

`application.yml` は公開してよいデフォルトだけにする。

```yaml
server:
  port: ${PORT:8080}

app:
  log-level: ${LOG_LEVEL:INFO}
```

`.env.example`:

```dotenv
PORT=8080
DATABASE_URL=
LOG_LEVEL=INFO
```

実 `application-local.yml`、`secret.yaml`、service account はコミットしない。

## 実装ルール

- Controller は request / response 変換だけに寄せる。
- Service にユースケースを置く。
- Repository は DB 採用後に追加する。DB なしの API では無理に置かない。
- `@ControllerAdvice` でエラー形式を統一する。
- Actuator を入れる場合、公開 endpoint を絞る。
- OpenAPI は外部契約が必要な時だけ `springdoc-openapi` を入れる。

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
