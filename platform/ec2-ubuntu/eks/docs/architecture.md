# EKS Architecture Overview

## Infrastructure Components

### AWS Resources
- **EKS Cluster**: Kubernetes control plane
- **VPC**: Dedicated network with public subnets
- **EC2 Bastion Host**: Management and access point
- **IAM Roles**: Service permissions and access control
- **Security Groups**: Network access rules

### Kubernetes Components
- **Node Groups**: Worker nodes for application workloads
- **ConfigMaps**: Configuration management
- **Deployments**: Application lifecycle management
- **Services**: Network exposure and load balancing

## Application Architecture

### Backend Application
- Node.js REST API service
- Port 8000 exposure
- Dockerized deployment
- Health check endpoints

### Frontend Application
- Static web application
- Port 3000 exposure
- Container-based deployment

## Management Tools

### Bastion Host Tools
- kubectl: Kubernetes CLI
- ArgoCD: GitOps continuous delivery
- Helm: Kubernetes package manager
- Docker: Container runtime
- AWS CLI: AWS service management

## Security Model

### Network Security
- VPC isolation
- Security group rules
- Public subnet with controlled access

### Access Control
- IAM role-based permissions
- SSM Session Manager for bastion access
- Kubernetes RBAC integration

## Deployment Pipeline

1. **Infrastructure**: CloudFormation stack deployment
2. **Applications**: Container image building and registry push
3. **Kubernetes**: Manifest application via kubectl or ArgoCD
4. **Monitoring**: Health checks and logging