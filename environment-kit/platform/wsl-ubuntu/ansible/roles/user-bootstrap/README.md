# user-bootstrap role

Git、`.gitignore_global`、`.bashrc`、`.ssh` 権限など、opt-in の個人設定を反映する role。

## Inputs

- `default_wsl_user`
- `env_setting_file`
- `git_default_branch`
- `git_pull_rebase`
- `git_core_autocrlf`
- `git_core_filemode`
- `git_global_excludesfile`
- `git_user_name`
- `git_user_email`

## Dependencies

- `git` が利用可能であること

## Outputs

- `~/.ssh`
- `~/.gitignore_global`
- `~/.bashrc`
- global git config

## Verify

- `tasks/validate.yml`
- Molecule `user-bootstrap`
