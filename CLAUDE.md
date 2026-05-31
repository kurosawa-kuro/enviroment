# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a comprehensive WSL Ubuntu Environment setup repository that uses Ansible automation to install and configure development tools, infrastructure services, and cloud platforms. The project includes infrastructure-as-code templates for AWS using Terraform, database management with Docker, and various development scripts.

## Common Commands

### WSL Ubuntu Ansible Environment Setup (platform/wsl-ubuntu/)
```bash
cd platform/wsl-ubuntu/
make ansible-install            # Install and configure WSL Ubuntu Environment with full playbook
make ansible-install-check      # Check Ansible version
make ansible-test              # Run playbook in check mode (dry-run)
make check-versions            # Check installed software versions
make setup-passwordless-sudo   # Setup passwordless sudo for current user
make cleanup-temp              # Clean up Ansible temporary directories
make generate-requirements     # Generate requirements.yml from group_vars/all.yml
make help                      # Show available targets
```

### Database Management (docker-database/)
```bash
cd docker-database/
make start-db                   # Start all databases (local, test, dwh)
make start-db-local            # Start local dev database (port 5432)
make start-db-test             # Start test database (port 5433)
make start-db-dwh              # Start data warehouse (port 5434)
make stop-db                   # Stop all databases
```

### Infrastructure (ec2-ubuntu/iac/terraform/)
```bash
cd ec2-ubuntu/iac/terraform/
make init-ec2 plan-ec2         # Initialize and plan EC2 deployment
make apply-ec2                 # Deploy EC2 infrastructure
make destroy-ec2               # Destroy EC2 infrastructure
make deploy-ec2                # Full deployment (init + plan + apply)
```

### Script Execution
```bash
# Platform-specific Ubuntu setup
cd ec2-ubuntu/script/
make setup                     # Run setup script with sudo
make check                     # Check installed versions

# WSL-specific setup scripts
cd script/
./setup-openssh.sh            # Setup OpenSSH for WSL
./setup-ansible.sh            # Setup Ansible for WSL
```

## Architecture

### Core Components

**WSL Ubuntu Ansible Automation (`platform/wsl-ubuntu/ansible/`)**
- `site.yml`: Main playbook orchestrating modular roles for complete Environment setup
- `ansible.cfg`: Configuration with tool versions, paths, and connection settings
- `group_vars/all.yml`: Single source of truth for all version configurations and variables
- `requirements.yml`: Auto-generated from `group_vars/all.yml` using `make generate-requirements`
- **Roles (as defined in site.yml):**
  - `base`: Core system packages and repositories
  - `ssh`: OpenSSH server setup and security
  - `development-runtime`: Node.js, Go, Java, Kotlin, Maven, Gradle
  - `docker`: Container engine and Docker Compose
  - `kubernetes`: kubectl, kind, helm, kustomize, minikube
  - `aws`: AWS CLI and cloud tools
  - `postgresql`: PostgreSQL 15 server with extensions (PostGIS, pgcrypto, uuid-ossp)
  - `redis`, `rabbitmq`, `kafka`: Optional messaging/caching services
  - `data_science`: Python analytics tools
  - `monitoring`: Observability stack

**Multi-Platform Infrastructure (`ec2-ubuntu/`, `ec2-amazon-linux/`)**
- `iac/terraform/`: AWS resource definitions (EC2, IAM, Cognito, EKS, SSG, SSM)
- `iac/cloud-formation/`: CloudFormation templates
- `script/`: Platform-specific setup scripts with version checking

**Database Infrastructure (`docker-database/`)**
- Multi-database Docker setup (local:5432, test:5433, dwh:5434)
- Custom PostgreSQL DWH image with analytics extensions
- Node.js connection testing utilities

**Development Scripts (`script/`)**
- WSL-specific setup automation (OpenSSH, Ansible)
- Common logging utilities and webhook notifications (Discord/Slack)

### Configuration Management

**Centralized Version Control (`platform/wsl-ubuntu/ansible/ansible.cfg`):**
- Tool versions: Node.js 22.11.0, Go 1.25.0, Java 21, Kotlin 2.2.10, Python 3.12.6
- Container tools: Docker 25.0.5, Kubernetes 1.27.3, Helm 3.14.0
- Cloud tools: AWS CLI 2.15.0, Terraform 1.6.6, GitHub CLI 2.45.0
- Database: PostgreSQL 15 on port 15432 (avoiding conflicts)
- Vault-encrypted sensitive variables in `group_vars/all.yml`
- Local working directory: `/home/wsl/.tmp-ansible`

### Service Architecture

**Database Stack:**
- PostgreSQL 15 (port 15432) with PostGIS, pgcrypto, uuid-ossp extensions
- Multi-Environment Docker setup (local:5432, test:5433, dwh:5434)
- Default credentials: postgres/postgres with UTF8 encoding

**Container & Orchestration:**
- Docker 25.0.5 with Docker Compose
- Kubernetes tools: kubectl, kind 0.20.0, helm 3.14.0, kustomize 5.6.0, minikube 1.33.1
- Local cluster testing with kind

**Development Runtimes:**
- Node.js 22.11.0, Go 1.25.0, Java 21, Kotlin 2.2.10
- Build tools: Maven 3.9.9, Gradle 8.12
- Python 3.12.6 with pipx 1.6.0

**Cloud & Infrastructure:**
- AWS CLI 2.15.0 with full service support
- Terraform 1.6.6 for infrastructure as code
- Multi-platform deployment (EC2 Ubuntu, Amazon Linux 2023)

## Development Workflow

1. **Initial Environment Setup**: 
   ```bash
   cd platform/wsl-ubuntu/
   make ansible-install     # Full WSL Ubuntu Environment setup
   ```

2. **Database Development**: 
   ```bash
   cd docker-database/
   make start-db-local     # PostgreSQL on port 5432
   ```

3. **Testing Environment**: 
   ```bash
   make ansible-test       # Dry-run playbook changes
   make start-db-test      # Isolated test database (port 5433)
   ```

4. **Infrastructure Management**: 
   ```bash
   cd ec2-ubuntu/iac/terraform/
   make deploy-ec2         # Full AWS infrastructure deployment
   ```

5. **Version Verification**: 
   ```bash
   make check-versions     # Verify all tool installations
   ```

## Important Notes

**Environment Requirements:**
- WSL Ubuntu Environment required for main automation
- Sudo access required for system-level installations
- Vault password needed for encrypted variables

**Database Configuration:**
- PostgreSQL 15 main instance on port 15432 (conflict avoidance)
- Docker databases: local:5432, test:5433, dwh:5434
- Default credentials: postgres/postgres
- Pre-configured extensions: PostGIS, pgcrypto, uuid-ossp

**File Locations:**
- Tool versions: `platform/wsl-ubuntu/ansible/ansible.cfg`
- Ansible working directory: `/home/wsl/.tmp-ansible`
- Logs: `/home/wsl/.ansible/ansible.log`
- Vault file: `.vault_pass` (git-ignored)

## Command Execution Policy

**PROHIBITED: Options and Custom Commands**
- DO NOT use command-line options, flags, or parameters unless explicitly defined in this document
- DO NOT create or modify custom commands outside of the predefined Makefile targets
- STRICTLY use only the commands listed in the "Common Commands" section above
- Any deviation from the documented commands is FORBIDDEN

**Enforcement:**
- All commands must match exactly as specified in the documented sections
- No additional parameters, options, or customizations are permitted
- This policy ensures consistency, security, and prevents unintended system modifications