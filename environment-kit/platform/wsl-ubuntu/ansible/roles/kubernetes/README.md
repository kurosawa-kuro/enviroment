# kubernetes role

既定では `kubectl` / `kind` / `helm` / `kustomize` を導入し、必要に応じて node 系や plugin 系ツールも追加する role。

## Inputs

- `kubectl_version`
- `kubernetes_version`
- `kind_version`
- `helm_version`
- `kustomize_version`
- `kubernetes_install_*`
- `download_dir`
- `validate_installation`

## Dependencies

- `base`
- 実機フル構成では `docker` を前提にすることが多い

## Outputs

- `kubectl`
- `kind`
- `helm`
- `kustomize`
- 任意で `kubeadm`, `kubelet`, `containerd`, `crictl`, `nerdctl`, plugin 群

## Verify

- `tasks/validate.yml`
- `playbooks/check.yml` の `container`
- Molecule `kubernetes-security`
