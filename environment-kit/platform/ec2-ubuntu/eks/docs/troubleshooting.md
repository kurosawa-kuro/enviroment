# EKS Troubleshooting Guide

## Common Issues

### CloudFormation Deployment Issues

#### Stack Creation Failures
```bash
# Check stack events
aws cloudformation describe-stack-events --stack-name simple-eks-stack

# View stack status
make status
```

#### IAM Permission Errors
- Ensure AWS CLI has sufficient permissions
- Check IAM roles and policies
- Verify service-linked roles exist

### Bastion Host Connection Issues

#### Cannot Connect via SSM
```bash
# Verify SSM agent status
systemctl status snap.amazon-ssm-agent.amazon-ssm-agent.service

# Check IAM instance profile
aws iam get-instance-profile --instance-profile-name <profile-name>
```

#### kubectl Not Working
```bash
# Re-configure kubectl
aws eks update-kubeconfig --region ap-northeast-1 --name simple-cluster

# Verify configuration
kubectl config current-context
```

### Application Deployment Issues

#### Pod Not Starting
```bash
# Check pod status
kubectl describe pod <pod-name>

# View logs
kubectl logs <pod-name>

# Check resource constraints
kubectl top nodes
kubectl top pods
```

#### Service Not Accessible
```bash
# Check service endpoints
kubectl get endpoints

# Verify service configuration
kubectl describe service <service-name>

# Test port forwarding
kubectl port-forward service/<service-name> <local-port>:<service-port>
```

### Network Issues

#### DNS Resolution Problems
```bash
# Test cluster DNS
kubectl run test-pod --image=busybox --rm -it -- nslookup kubernetes.default

# Check CoreDNS pods
kubectl get pods -n kube-system -l k8s-app=kube-dns
```

#### Security Group Issues
```bash
# Check security group rules
aws ec2 describe-security-groups --group-ids <sg-id>

# Verify VPC and subnet configuration
aws ec2 describe-vpcs --vpc-ids <vpc-id>
```

## Debugging Commands

### Cluster Information
```bash
kubectl cluster-info
kubectl get nodes -o wide
kubectl get pods --all-namespaces
```

### Resource Status
```bash
kubectl get all
kubectl describe deployment <deployment-name>
kubectl get events --sort-by=.metadata.creationTimestamp
```

### Logs and Monitoring
```bash
# Application logs
kubectl logs -f deployment/<deployment-name>

# System logs on bastion
sudo journalctl -u kubelet
```

## Recovery Procedures

### Restart Deployment
```bash
kubectl rollout restart deployment/<deployment-name>
```

### Force Pod Recreation
```bash
kubectl delete pod <pod-name>
```

### Reset Cluster Connection
```bash
rm ~/.kube/config
aws eks update-kubeconfig --region ap-northeast-1 --name simple-cluster
```