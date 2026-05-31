# docker role

Docker Engine と compose plugin を導入し、必要に応じて service 管理を行う role。

## Inputs

- `docker_version`
- `docker_manage_service`
- `validate_installation`

## Dependencies

- `base`

## Outputs

- `docker`
- `docker compose`
- 任意で `docker` systemd service

## Verify

- `tasks/validate.yml`
- `playbooks/check.yml` の `container`
- Molecule `docker`
