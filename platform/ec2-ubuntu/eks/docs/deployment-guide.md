# EKS Deployment Guide

## Prerequisites

- AWS CLI configured with appropriate permissions
- Docker installed locally
- Git repository access

## Infrastructure Deployment

### 1. Deploy EKS Cluster
```bash
cd infrastructure/cloudformation
make deploy
```

### 2. Verify Deployment
```bash
make status
```

### 3. Connect to Bastion Host
```bash
../../scripts/management/start_session_bastion.sh
```

## Application Deployment

### Backend Application
```bash
cd applications/backend
make build
make deploy-k8s
```

### Frontend Application
```bash
cd applications/frontend
make build
make deploy-k8s
```

## Kubernetes Management

### Apply Base Manifests
```bash
cd infrastructure/kubernetes/base
kubectl apply -f .
```

### Using Kustomize (Development)
```bash
cd infrastructure/kubernetes/overlays/dev
kubectl apply -k .
```

### Using Kustomize (Production)
```bash
cd infrastructure/kubernetes/overlays/prod
kubectl apply -k .
```

## Verification Steps

### 1. Check Cluster Status
```bash
kubectl get nodes
kubectl get pods --all-namespaces
```

### 2. Test Application Endpoints
```bash
kubectl port-forward service/backend-service 8000:8000
kubectl port-forward service/frontend-service 3000:3000
```

### 3. View Logs
```bash
kubectl logs -f deployment/backend-deployment
kubectl logs -f deployment/frontend-deployment
```

## Cleanup

### Remove Applications
```bash
kubectl delete -k infrastructure/kubernetes/overlays/dev
```

### Remove Infrastructure
```bash
cd infrastructure/cloudformation
make destroy
```