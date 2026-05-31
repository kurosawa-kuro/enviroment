# gcp role

Google Cloud CLI を `/opt/google-cloud-sdk` に展開し、PATH 導線を作る role。

## Inputs

- `gcloud_version`
- `download_dir`
- `validate_installation`

## Dependencies

- `base`

## Outputs

- `/opt/google-cloud-sdk`
- `/etc/profile.d/google-cloud-sdk.sh`
- `gcloud`, `gsutil`

## Verify

- `tasks/validate.yml`
- `playbooks/check.yml` の `cloud`
- Molecule `cloud`
