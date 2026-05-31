# development-runtime role

Rust、Node.js、Go、任意の Java / Kotlin をまとめて導入する runtime role。今後の分割候補でもある基準 role。

## Inputs

- `rust_version`
- `nodejs_version`
- `go_version`
- `java_version`
- `kotlin_version`
- `maven_version`
- `gradle_version`
- `install_java_enabled`
- `install_kotlin_enabled`
- `validate_installation`

## Dependencies

- `base`

## Outputs

- `/opt/rust`
- `node`, `npm`
- `/usr/local/go`
- 任意で `java`, `mvn`, `gradle`, `kotlin`

## Verify

- `tasks/validate.yml`
- `playbooks/check.yml` の `runtime`
- Molecule `runtime`
