# aws role

AWS CLI、Terraform、GitHub CLI を導入する cloud tool role。

## Inputs

- `awscli_version`
- `terraform_version`
- `ghcli_version`
- `download_dir`
- `validate_installation`

## Dependencies

- `base`

## Outputs

- `aws`
- `terraform`
- `gh`

## Verify

- `tasks/validate.yml`
- `playbooks/check.yml` の `cloud`
- Molecule `cloud`
