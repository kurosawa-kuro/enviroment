# security role

Trivy、kube-bench、kube-hunter、kubescape などのセキュリティ CLI を導入する role。

## Inputs

- `trivy_version`
- `kube_bench_version`
- `kube_hunter_version`
- `kubescape_version`
- `auditd`
- `apparmor_utils`
- `download_dir`
- `validate_installation`

## Dependencies

- `base`
- `pipx` が `kube-hunter` 用に必要

## Outputs

- `trivy`
- `kube-bench`
- `kube-hunter`
- `kubescape`
- 任意で `auditd`, `apparmor-utils`

## Verify

- `tasks/validate.yml`
- `playbooks/check.yml` の `security`
- Molecule `kubernetes-security`
