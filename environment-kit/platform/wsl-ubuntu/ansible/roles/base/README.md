# base role

WSL 基盤パッケージ、locale / timezone、`/etc/wsl.conf`、`pipx`、`uv`、Doppler CLI を導入する基盤 role。

## Inputs

- `download_dir`
- `doppler_version`
- `python_uv_enabled`
- `timezone`
- `locale_lang`
- `default_wsl_user`
- `base_manage_timezone`
- `base_manage_locale`
- `validate_installation`

## Dependencies

- なし

## Outputs

- 基本パッケージ導入
- `/etc/wsl.conf`
- `/usr/local/bin/doppler`
- 任意で `uv`

## Verify

- `tasks/validate.yml`
- `playbooks/check.yml` の `core`
- Molecule `base`
