# cache role

共通作業ディレクトリ、APT キャッシュ、ダウンロードキャッシュ、環境変数を整える role。

## Inputs

- `download_dir`
- `preload_cache`
- `validate_installation`

## Dependencies

- なし

## Outputs

- `{{ download_dir }}/cache/*`
- `/etc/apt/apt.conf.d/01cache`
- `/etc/profile.d/cache-env.sh`
- `/usr/local/bin/cache_manager.sh`

## Verify

- `tasks/validate.yml`
- Molecule `base`
