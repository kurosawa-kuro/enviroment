# development-runtime role

Rust、Node.js、Go、任意の Java / Kotlin をまとめて導入する runtime role。

当面は domain role へ分割せず、複合 role のまま interface を明示して維持する。入口 playbook からは `install_*_enabled` を通じて、どの runtime を収束対象にするかを宣言的に渡す。

## Inputs

### Versions

- `rust_version`
- `nodejs_version`
- `go_version`
- `java_version`
- `kotlin_version`
- `maven_version`
- `gradle_version`

### Feature gates

- `install_rust_enabled`
- `install_nodejs_enabled`
- `install_go_enabled`
- `install_java_enabled`
- `install_kotlin_enabled`
- `validate_installation`

## Dependencies

- `base`
  - `curl`, `apt`, profile.d, build tools などの前提を提供する

## Outputs

- `/opt/rust`
- `node`, `npm`
- `/usr/local/go`
- 任意で `java`, `javac`, `mvn`, `gradle`, `kotlin`, `kotlinc`
- `/etc/profile.d/rust.sh`
- `/etc/profile.d/go.sh`
- Java / Kotlin 向け profile.d

## Internal structure

- `tasks/install.yml`
  - gate 変数に応じて各 runtime task を呼び分ける
- `tasks/rust.yml`
- `tasks/nodejs.yml`
- `tasks/golang.yml`
- `tasks/java.yml`
- `tasks/kotlin.yml`
- `tasks/validate.yml`
  - enabled な runtime だけを検証する

## Verify

- role 内 `tasks/validate.yml`
- `playbooks/check.yml` の `runtime`
- Molecule `runtime`

## Current decision

- `runtime_rust` / `runtime_nodejs` / `runtime_go` へ即分割はしない
- まずは複合 role の interface を固定し、playbook 側からの呼び出し契約を安定させる
- 分割が必要になった時は、この gate 変数を domain role へ写して移行する
