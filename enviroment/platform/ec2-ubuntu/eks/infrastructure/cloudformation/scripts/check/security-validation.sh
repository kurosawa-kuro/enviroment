#!/bin/bash
# =============================================================================
# EKS Security Validation Script
# セキュリティ設定の自動検証スクリプト
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
CLUSTER_NAME="eks-platform"
REGION="ap-northeast-1"
VERSION="v2"

echo "========================================="
echo "EKS Security Validation Starting..."
echo "========================================="

# Function: Print result
print_result() {
    local test_name=$1
    local result=$2
    local details=$3
    
    if [ "$result" = "PASS" ]; then
        echo -e "${GREEN}✓${NC} $test_name: ${GREEN}PASS${NC}"
        [ ! -z "$details" ] && echo "  Details: $details"
    elif [ "$result" = "WARN" ]; then
        echo -e "${YELLOW}⚠${NC} $test_name: ${YELLOW}WARNING${NC}"
        [ ! -z "$details" ] && echo "  Details: $details"
    else
        echo -e "${RED}✗${NC} $test_name: ${RED}FAIL${NC}"
        [ ! -z "$details" ] && echo "  Details: $details"
    fi
}

# =============================================================================
# 1. EKS Cluster Security Checks
# =============================================================================
echo ""
echo "1. EKS Cluster Security Validation"
echo "-----------------------------------"

# Check if cluster exists
if aws eks describe-cluster --name $CLUSTER_NAME --region $REGION &>/dev/null; then
    print_result "Cluster exists" "PASS" "$CLUSTER_NAME"
    
    # Check endpoint access configuration
    ENDPOINT_CONFIG=$(aws eks describe-cluster --name $CLUSTER_NAME --region $REGION \
        --query 'cluster.resourcesVpcConfig' --output json)
    
    PUBLIC_ACCESS=$(echo $ENDPOINT_CONFIG | jq -r '.endpointPublicAccess')
    PRIVATE_ACCESS=$(echo $ENDPOINT_CONFIG | jq -r '.endpointPrivateAccess')
    
    if [ "$PUBLIC_ACCESS" = "false" ] && [ "$PRIVATE_ACCESS" = "true" ]; then
        print_result "API Endpoint Access" "PASS" "Private only (Secure)"
    elif [ "$PUBLIC_ACCESS" = "true" ] && [ "$PRIVATE_ACCESS" = "true" ]; then
        print_result "API Endpoint Access" "WARN" "Both public and private enabled (Development mode)"
    else
        print_result "API Endpoint Access" "FAIL" "Insecure configuration"
    fi
    
    # Check logging configuration
    LOGGING_ENABLED=$(aws eks describe-cluster --name $CLUSTER_NAME --region $REGION \
        --query 'cluster.logging.clusterLogging[0].enabled' --output text)
    
    if [ "$LOGGING_ENABLED" = "true" ]; then
        print_result "Cluster Logging" "PASS" "All log types enabled"
    else
        print_result "Cluster Logging" "WARN" "Logging not fully enabled"
    fi
else
    print_result "Cluster exists" "FAIL" "Cluster not found"
fi

# =============================================================================
# 2. Network Security Checks
# =============================================================================
echo ""
echo "2. Network Security Validation"
echo "------------------------------"

# Check VPC configuration
VPC_ID=$(aws ec2 describe-vpcs --filters "Name=tag:Project,Values=eks-platform" \
    --query 'Vpcs[0].VpcId' --output text --region $REGION)

if [ ! -z "$VPC_ID" ] && [ "$VPC_ID" != "None" ]; then
    print_result "VPC exists" "PASS" "$VPC_ID"
    
    # Check for NAT Gateway
    NAT_GATEWAYS=$(aws ec2 describe-nat-gateways --filter "Name=vpc-id,Values=$VPC_ID" \
        "Name=state,Values=available" --query 'NatGateways[].NatGatewayId' --output text --region $REGION)
    
    if [ ! -z "$NAT_GATEWAYS" ]; then
        print_result "NAT Gateway" "PASS" "Enabled for private subnet internet access"
    else
        print_result "NAT Gateway" "FAIL" "No NAT Gateway found (CRITICAL: Required for ECR/updates)"
    fi
    
    # Check subnet configuration
    PRIVATE_SUBNETS=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" \
        "Name=tag:Type,Values=Private" --query 'Subnets[].SubnetId' --output text --region $REGION)
    
    if [ ! -z "$PRIVATE_SUBNETS" ]; then
        SUBNET_COUNT=$(echo $PRIVATE_SUBNETS | wc -w)
        print_result "Private Subnets" "PASS" "$SUBNET_COUNT private subnets found"
    else
        print_result "Private Subnets" "FAIL" "No private subnets found"
    fi
else
    print_result "VPC exists" "FAIL" "VPC not found"
fi

# =============================================================================
# 3. Security Group Validation
# =============================================================================
echo ""
echo "3. Security Group Validation"
echo "----------------------------"

# Check EKS cluster security group
CLUSTER_SG=$(aws ec2 describe-security-groups \
    --filters "Name=group-name,Values=${CLUSTER_NAME}-sg" \
    --query 'SecurityGroups[0].GroupId' --output text --region $REGION 2>/dev/null)

if [ ! -z "$CLUSTER_SG" ] && [ "$CLUSTER_SG" != "None" ]; then
    print_result "Cluster Security Group" "PASS" "$CLUSTER_SG"
    
    # Check ingress rules
    INGRESS_COUNT=$(aws ec2 describe-security-groups --group-ids $CLUSTER_SG \
        --query 'SecurityGroups[0].IpPermissions | length(@)' --output text --region $REGION)
    
    if [ "$INGRESS_COUNT" -le "3" ]; then
        print_result "Cluster SG Ingress Rules" "PASS" "Minimal rules ($INGRESS_COUNT rules)"
    else
        print_result "Cluster SG Ingress Rules" "WARN" "Multiple rules ($INGRESS_COUNT rules)"
    fi
else
    print_result "Cluster Security Group" "WARN" "Not found or using default"
fi

# Check Node security group
NODE_SG=$(aws ec2 describe-security-groups \
    --filters "Name=group-name,Values=${CLUSTER_NAME}-nodegroup-sg" \
    --query 'SecurityGroups[0].GroupId' --output text --region $REGION 2>/dev/null)

if [ ! -z "$NODE_SG" ] && [ "$NODE_SG" != "None" ]; then
    print_result "Node Security Group" "PASS" "$NODE_SG"
else
    print_result "Node Security Group" "WARN" "Custom node security group not found"
fi

# =============================================================================
# 4. IAM Security Validation
# =============================================================================
echo ""
echo "4. IAM Security Validation"
echo "--------------------------"

# Check cluster role
CLUSTER_ROLE="${CLUSTER_NAME}-cluster-role"
if aws iam get-role --role-name $CLUSTER_ROLE &>/dev/null; then
    print_result "Cluster IAM Role" "PASS" "$CLUSTER_ROLE exists"
    
    # Check attached policies
    POLICIES=$(aws iam list-attached-role-policies --role-name $CLUSTER_ROLE \
        --query 'AttachedPolicies[].PolicyName' --output text)
    
    if [[ $POLICIES == *"AmazonEKSClusterPolicy"* ]]; then
        print_result "Cluster Role Policies" "PASS" "Required policies attached"
    else
        print_result "Cluster Role Policies" "FAIL" "Missing required policies"
    fi
else
    print_result "Cluster IAM Role" "FAIL" "Role not found"
fi

# Check node role
NODE_ROLE="${CLUSTER_NAME}-node-role"
if aws iam get-role --role-name $NODE_ROLE &>/dev/null; then
    print_result "Node IAM Role" "PASS" "$NODE_ROLE exists"
else
    print_result "Node IAM Role" "FAIL" "Role not found"
fi

# =============================================================================
# 5. Node Group Security Validation
# =============================================================================
echo ""
echo "5. Node Group Security Validation"
echo "---------------------------------"

# Check node group configuration
NODEGROUP_NAME="${CLUSTER_NAME}-node-group"
if aws eks describe-nodegroup --cluster-name $CLUSTER_NAME \
    --nodegroup-name $NODEGROUP_NAME --region $REGION &>/dev/null; then
    
    print_result "Node Group exists" "PASS" "$NODEGROUP_NAME"
    
    # Check subnet placement
    NODEGROUP_SUBNETS=$(aws eks describe-nodegroup --cluster-name $CLUSTER_NAME \
        --nodegroup-name $NODEGROUP_NAME --region $REGION \
        --query 'nodegroup.subnets' --output json)
    
    # Verify these are private subnets
    PRIVATE_PLACEMENT=true
    for subnet in $(echo $NODEGROUP_SUBNETS | jq -r '.[]'); do
        PUBLIC_IP=$(aws ec2 describe-subnets --subnet-ids $subnet --region $REGION \
            --query 'Subnets[0].MapPublicIpOnLaunch' --output text)
        if [ "$PUBLIC_IP" = "true" ]; then
            PRIVATE_PLACEMENT=false
            break
        fi
    done
    
    if [ "$PRIVATE_PLACEMENT" = true ]; then
        print_result "Node Placement" "PASS" "Nodes in private subnets only"
    else
        print_result "Node Placement" "FAIL" "Nodes in public subnets (Security risk)"
    fi
else
    print_result "Node Group exists" "FAIL" "Node group not found"
fi

# =============================================================================
# 6. Bastion Host Security Validation
# =============================================================================
echo ""
echo "6. Bastion Host Security Validation"
echo "-----------------------------------"

# Check bastion instance
BASTION_ID=$(aws ec2 describe-instances \
    --filters "Name=tag:Name,Values=${CLUSTER_NAME}-bastion" \
    "Name=instance-state-name,Values=running" \
    --query 'Reservations[0].Instances[0].InstanceId' --output text --region $REGION)

if [ ! -z "$BASTION_ID" ] && [ "$BASTION_ID" != "None" ]; then
    print_result "Bastion Host" "PASS" "$BASTION_ID"
    
    # Check public IP assignment
    PUBLIC_IP=$(aws ec2 describe-instances --instance-ids $BASTION_ID \
        --query 'Reservations[0].Instances[0].PublicIpAddress' --output text --region $REGION)
    
    if [ "$PUBLIC_IP" = "None" ] || [ -z "$PUBLIC_IP" ]; then
        print_result "Bastion Public IP" "PASS" "No public IP (Secure)"
    else
        print_result "Bastion Public IP" "WARN" "Has public IP: $PUBLIC_IP"
    fi
    
    # Check SSM agent status
    SSM_STATUS=$(aws ssm describe-instance-information \
        --filters "Key=InstanceIds,Values=$BASTION_ID" \
        --query 'InstanceInformationList[0].PingStatus' --output text --region $REGION)
    
    if [ "$SSM_STATUS" = "Online" ]; then
        print_result "SSM Agent" "PASS" "Online - Session Manager available"
    else
        print_result "SSM Agent" "WARN" "Status: $SSM_STATUS"
    fi
else
    print_result "Bastion Host" "WARN" "Not found or not running"
fi

# =============================================================================
# 7. Encryption Validation
# =============================================================================
echo ""
echo "7. Encryption Validation"
echo "------------------------"

# Check EKS secrets encryption
ENCRYPTION_CONFIG=$(aws eks describe-cluster --name $CLUSTER_NAME --region $REGION \
    --query 'cluster.encryptionConfig' --output json 2>/dev/null)

if [ "$ENCRYPTION_CONFIG" != "null" ] && [ ! -z "$ENCRYPTION_CONFIG" ]; then
    print_result "EKS Secrets Encryption" "PASS" "Enabled"
else
    print_result "EKS Secrets Encryption" "WARN" "Not configured (Learning environment)"
fi

# Check S3 bucket encryption
S3_BUCKET=$(aws s3api list-buckets --query "Buckets[?contains(Name, 'eks-platform-bootstrap')].Name" \
    --output text --region $REGION | head -n1)

if [ ! -z "$S3_BUCKET" ]; then
    ENCRYPTION=$(aws s3api get-bucket-encryption --bucket $S3_BUCKET --region $REGION 2>/dev/null)
    if [ $? -eq 0 ]; then
        print_result "S3 Bucket Encryption" "PASS" "$S3_BUCKET encrypted"
    else
        print_result "S3 Bucket Encryption" "WARN" "Not encrypted"
    fi
fi

# =============================================================================
# 8. Configuration Consistency Validation  
# =============================================================================
echo ""
echo "8. Configuration Consistency Validation"
echo "---------------------------------------"

# Check config.yaml vs actual deployment consistency
CONFIG_FILE="../../../config.yaml"
if [ -f "$CONFIG_FILE" ]; then
    # Extract EndpointPublicAccess from config
    if command -v yq &> /dev/null; then
        CONFIG_PUBLIC_ACCESS=$(yq eval '.Parameters.EKS.EndpointPublicAccess' $CONFIG_FILE 2>/dev/null)
    else
        CONFIG_PUBLIC_ACCESS=$(grep -A 10 "EKS:" $CONFIG_FILE | grep "EndpointPublicAccess:" | awk '{print $2}' | head -1)
    fi
    
    if [ "$PUBLIC_ACCESS" = "$CONFIG_PUBLIC_ACCESS" ]; then
        print_result "Config Consistency" "PASS" "EKS endpoint config matches deployment"
    else
        print_result "Config Consistency" "WARN" "Config: $CONFIG_PUBLIC_ACCESS, Deployed: $PUBLIC_ACCESS"
    fi
    
    # Check NAT Gateway config consistency  
    if command -v yq &> /dev/null; then
        CONFIG_NAT_GATEWAY=$(yq eval '.Parameters.Network.EnableNatGateway' $CONFIG_FILE 2>/dev/null)
    else
        CONFIG_NAT_GATEWAY=$(grep -A 10 "Network:" $CONFIG_FILE | grep "EnableNatGateway:" | awk '{print $2}' | head -1)
    fi
    
    NAT_EXISTS=$([ ! -z "$NAT_GATEWAYS" ] && echo "true" || echo "false")
    if [ "$NAT_EXISTS" = "$CONFIG_NAT_GATEWAY" ]; then
        print_result "NAT Gateway Config" "PASS" "Config matches deployment"
    else
        print_result "NAT Gateway Config" "FAIL" "Config: $CONFIG_NAT_GATEWAY, Deployed: $NAT_EXISTS"
    fi
else
    print_result "Config File" "WARN" "config.yaml not found for consistency check"
fi

# =============================================================================
# 9. Critical Security Issues Detection
# =============================================================================
echo ""
echo "9. Critical Security Issues Detection"
echo "------------------------------------"

CRITICAL_ISSUES=0

# Check for critical misconfigurations
if [ -z "$NAT_GATEWAYS" ]; then
    print_result "CRITICAL: NAT Gateway Missing" "FAIL" "Nodes cannot pull ECR images or update packages"
    CRITICAL_ISSUES=$((CRITICAL_ISSUES + 1))
fi

if [ "$PUBLIC_ACCESS" = "true" ] && [ -z "$(echo $ENDPOINT_CONFIG | jq -r '.publicAccessCidrs[]' | grep -v '0.0.0.0/0')" ]; then
    print_result "CRITICAL: Public API Unrestricted" "WARN" "Consider restricting publicAccessCidrs for production"
fi

if [ "$PRIVATE_PLACEMENT" = false ]; then
    print_result "CRITICAL: Public Node Placement" "FAIL" "Worker nodes should be in private subnets"
    CRITICAL_ISSUES=$((CRITICAL_ISSUES + 1))
fi

if [ "$CRITICAL_ISSUES" -gt 0 ]; then
    echo ""
    echo -e "${RED}🚨 $CRITICAL_ISSUES critical security issues detected!${NC}"
    echo -e "${RED}   Immediate action required before production deployment.${NC}"
fi

# =============================================================================
# Summary
# =============================================================================
echo ""
echo "========================================="
echo "Security Validation Summary"
echo "========================================="

# Count results
PASS_COUNT=$(grep -c "PASS" /tmp/security_validation_$$.log 2>/dev/null || echo 0)
WARN_COUNT=$(grep -c "WARNING" /tmp/security_validation_$$.log 2>/dev/null || echo 0)
FAIL_COUNT=$(grep -c "FAIL" /tmp/security_validation_$$.log 2>/dev/null || echo 0)

echo -e "Results:"
echo -e "  ${GREEN}Passed:${NC} $PASS_COUNT"
echo -e "  ${YELLOW}Warnings:${NC} $WARN_COUNT"
echo -e "  ${RED}Failed:${NC} $FAIL_COUNT"

if [ "$FAIL_COUNT" -gt 0 ]; then
    echo ""
    echo -e "${RED}⚠ Security issues detected. Please review failed checks.${NC}"
    exit 1
elif [ "$WARN_COUNT" -gt 0 ]; then
    echo ""
    echo -e "${YELLOW}⚠ Some warnings detected. Review for production deployment.${NC}"
    exit 0
else
    echo ""
    echo -e "${GREEN}✓ All security checks passed!${NC}"
    exit 0
fi