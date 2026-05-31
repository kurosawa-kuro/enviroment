#!/bin/bash
set -e

# Logging
LOG_FILE="/var/log/user-data.log"
exec > >(tee -a ${LOG_FILE})
exec 2>&1

echo "======================================"
echo "Starting user-data setup at $(date)"
echo "======================================"
echo "AWS Region: ${AwsRegion}"
echo "Cluster Name: ${CLUSTER_NAME}"
echo "S3 Bucket: ${S3_BUCKET}"

# Install required packages
echo "Installing required packages..."
apt-get install -y \
  curl \
  wget \
  git \
  unzip \
  software-properties-common \
  apt-transport-https \
  ca-certificates \
  gnupg \
  lsb-release

# Install Docker
echo "Installing Docker..."
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io

# Install kubectl
echo "Installing kubectl..."
KUBECTL_VERSION=$(curl -L -s https://dl.k8s.io/release/stable.txt)
curl -LO "https://dl.k8s.io/release/${KUBECTL_VERSION}/bin/linux/amd64/kubectl"
chmod +x kubectl
mv kubectl /usr/local/bin/

# Install ArgoCD CLI
echo "Installing ArgoCD CLI..."
ARGOCD_VERSION=$(curl --silent "https://api.github.com/repos/argoproj/argo-cd/releases/latest" | grep '"tag_name"' | sed -E 's/.*"([^"]+)".*/\1/')
curl -sSL -o argocd-linux-amd64 "https://github.com/argoproj/argo-cd/releases/download/${ARGOCD_VERSION}/argocd-linux-amd64"
install -m 555 argocd-linux-amd64 /usr/local/bin/argocd
rm argocd-linux-amd64

# Install Helm
echo "Installing Helm..."
curl https://baltocdn.com/helm/signing.asc | gpg --dearmor | tee /usr/share/keyrings/helm.gpg > /dev/null
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/helm.gpg] https://baltocdn.com/helm/stable/debian/ all main" | tee /etc/apt/sources.list.d/helm-stable-debian.list
apt-get update
apt-get install -y helm

# Install essential tools
echo "Installing essential tools..."
apt-get install -y jq

# Configure kubectl for EKS
echo "Configuring kubectl for EKS..."
aws eks update-kubeconfig --region ${AwsRegion} --name ${CLUSTER_NAME}

# Install AWS Load Balancer Controller prerequisites
echo "Installing AWS Load Balancer Controller prerequisites..."

# Download IAM policy from S3 bucket (more reliable than GitHub)
if [ ! -z "${S3_BUCKET}" ]; then
  echo "Downloading IAM policy from S3..."
  aws s3 cp s3://${S3_BUCKET}/scripts/iam_policy.json ./iam_policy.json --region ${AwsRegion} || {
    echo "Warning: Could not download from S3, using fallback GitHub download..."
    curl -o iam_policy.json https://raw.githubusercontent.com/kubernetes-sigs/aws-load-balancer-controller/v2.7.2/docs/install/iam_policy.json
  }
else
  echo "S3 bucket not configured, downloading from GitHub..."
  curl -o iam_policy.json https://raw.githubusercontent.com/kubernetes-sigs/aws-load-balancer-controller/v2.7.2/docs/install/iam_policy.json
fi

# Create IAM policy for AWS Load Balancer Controller (if not exists)
if [ -f "iam_policy.json" ]; then
  aws iam create-policy \
    --policy-name AWSLoadBalancerControllerIAMPolicy \
    --policy-document file://iam_policy.json \
    --region ${AwsRegion} || echo "Policy already exists"
else
  echo "Error: iam_policy.json not found, skipping policy creation"
fi

# Create ubuntu user
echo "Setting up ubuntu user..."
useradd -m -s /bin/bash ubuntu

# Add ubuntu user to docker group
usermod -aG docker ubuntu

# Set up kubectl config for ubuntu user
mkdir -p /home/ubuntu/.kube
cp /root/.kube/config /home/ubuntu/.kube/config
chown -R ubuntu:ubuntu /home/ubuntu/.kube

# Verify EKS cluster connectivity
echo "Verifying EKS cluster connectivity..."
max_retries=10
retry_count=0
while [ $retry_count -lt $max_retries ]; do
  if kubectl cluster-info >/dev/null 2>&1; then
    echo "✓ Successfully connected to EKS cluster"
    kubectl get nodes
    break
  else
    echo "⚠ Waiting for EKS cluster to be ready... (attempt $((retry_count+1))/$max_retries)"
    sleep 30
    retry_count=$((retry_count+1))
  fi
done

if [ $retry_count -eq $max_retries ]; then
  echo "✗ Failed to connect to EKS cluster after $max_retries attempts"
fi

# Create useful aliases
echo "Setting up aliases..."
cat >> /home/ubuntu/.bashrc <<'EOF'

# Kubernetes aliases
alias k="kubectl"
alias kg="kubectl get"
alias kd="kubectl describe"
alias kl="kubectl logs"
alias kx="kubectl exec -it"
alias ka="kubectl apply -f"
alias kgp="kubectl get pods"
alias kgs="kubectl get svc"
alias kgn="kubectl get nodes"

# ArgoCD aliases
alias argoapp="argocd app"
alias argosync="argocd app sync"

# Docker aliases
alias d="docker"
alias dps="docker ps"
alias dpsa="docker ps -a"
alias di="docker images"
alias dex="docker exec -it"
alias dl="docker logs"

# Helper functions
kns() {
  kubectl config set-context --current --namespace=$1
}

kdebug() {
  kubectl run debug-${RANDOM} --rm -i --tty --image=alpine -- /bin/sh
}

# EKS cluster info
eksstatus() {
  echo "=== EKS Cluster Status ==="
  kubectl cluster-info
  echo ""
  kubectl get nodes -o wide
  echo ""
  kubectl get pods --all-namespaces
}

# Deploy sample application
deploysample() {
  echo "Deploying sample nginx application..."
  kubectl create deployment nginx --image=nginx:latest --port=80
  kubectl expose deployment nginx --type=NodePort --port=80 --target-port=80 --name=nginx-service
  kubectl get services
}
EOF

# Configure SSM Session Manager logging
echo "Configuring SSM Session Manager..."
cat > /etc/amazon/ssm/seelog.xml <<'EOF'
<seelog type="adaptive" mininterval="2000000" maxinterval="100000000" critmsgcount="500" minlevel="info">
    <exceptions>
        <exception filepattern="test*" minlevel="error"/>
    </exceptions>
    <outputs formatid="fmtinfo">
        <console formatid="fmtinfo"/>
        <rollingfile type="size" filename="/var/log/amazon/ssm/amazon-ssm-agent.log" maxsize="30000000" maxrolls="5"/>
        <filter levels="error,critical" formatid="fmterror">
            <rollingfile type="size" filename="/var/log/amazon/ssm/errors.log" maxsize="10000000" maxrolls="5"/>
        </filter>
    </outputs>
    <formats>
        <format id="fmterror" format="%Date %Time %LEVEL [%FuncShort @ %File.%Line] %Msg%n"/>
        <format id="fmtdebug" format="%Date %Time %LEVEL [%FuncShort @ %File.%Line] %Msg%n"/>
        <format id="fmtinfo" format="%Date %Time %LEVEL %Msg%n"/>
    </formats>
</seelog>
EOF

# Create completion marker
echo "Setup completed at $(date)" > /var/log/setup-complete.flag

echo "======================================"
echo "User-data setup completed at $(date)"
echo "======================================"

# Reboot to apply all changes
echo "Rebooting in 10 seconds..."
sleep 10
reboot


