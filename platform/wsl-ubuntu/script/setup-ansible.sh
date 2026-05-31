#!/bin/bash

# WSL Ubuntu Environment Setup Script (OpenSSH + Ansible)
# Author: AI Assistant
# Version: 3.0

set -euo pipefail

# Source common logging utilities
source "$(dirname "$0")/common/logging.sh"

# Configuration
readonly SSH_PORT=2200
readonly SSH_CONFIG="/etc/ssh/sshd_config"

# Check system requirements
check_prerequisites() {
    log_step "Checking prerequisites..."
    
    check_sudo
    
    if ! grep -q "microsoft" /proc/version 2>/dev/null; then
        log_warning "This script is optimized for WSL Ubuntu"
    fi
    
    log_success "Prerequisites check completed"
}

# Enable Universe repository (includes pip/pipx)
setup_universe_repository() {
    log_step "Setting up Universe repository..."
    
    log_info "Updating package lists..."
    sudo apt update || { log_error "Failed to update package lists"; exit 1; }
    
    log_info "Installing software-properties-common..."
    sudo apt install -y software-properties-common || { log_error "Failed to install software-properties-common"; exit 1; }
    
    log_info "Adding Universe repository..."
    sudo add-apt-repository -y universe || { log_error "Failed to add Universe repository"; exit 1; }
    
    log_info "Updating package index..."
    sudo apt update || { log_error "Failed to update package index"; exit 1; }
    
    log_success "Universe repository setup completed"
}

# Add Ansible PPA for latest version
setup_ansible_ppa() {
    log_step "Setting up Ansible PPA..."
    
    log_info "Adding Ansible PPA..."
    sudo add-apt-repository -y ppa:ansible/ansible || { log_error "Failed to add Ansible PPA"; exit 1; }
    
    log_info "Updating package lists..."
    sudo apt update || { log_error "Failed to update package lists after adding PPA"; exit 1; }
    
    log_success "Ansible PPA setup completed"
}

# Install Ansible
install_ansible() {
    log_step "Installing Ansible..."
    
    if command_exists ansible; then
        log_success "Ansible is already installed"
        ansible --version
        return 0
    fi
    
    log_info "Installing Ansible..."
    sudo apt install -y ansible || { log_error "Failed to install Ansible"; exit 1; }
    
    log_success "Ansible installed successfully"
    ansible --version
}

# Install make utility
install_make() {
    log_step "Installing make utility..."
    
    if command_exists make; then
        log_success "Make is already installed"
        return 0
    fi
    
    log_info "Installing make..."
    sudo apt install -y make || { log_error "Failed to install make"; exit 1; }
    
    log_success "Make installed successfully"
}

# Install OpenSSH server
install_openssh() {
    log_step "Installing OpenSSH server..."
    
    if command_exists ssh; then
        log_success "OpenSSH is already installed"
        return 0
    fi
    
    log_info "Installing OpenSSH server..."
    sudo apt install -y openssh-server || { log_error "Failed to install OpenSSH server"; exit 1; }
    
    log_success "OpenSSH server installed successfully"
}

# Generate SSH host keys
setup_ssh_keys() {
    log_step "Setting up SSH host keys..."
    
    if [[ -f /etc/ssh/ssh_host_rsa_key ]]; then
        log_info "SSH host keys already exist"
    else
        log_info "Generating SSH host keys..."
        sudo ssh-keygen -A || { log_error "Failed to generate SSH host keys"; exit 1; }
        log_success "SSH host keys generated"
    fi
}

# Configure SSH daemon
configure_ssh_daemon() {
    log_step "Configuring SSH daemon..."
    
    backup_file "$SSH_CONFIG"
    
    log_info "Setting SSH port to $SSH_PORT..."
    sudo sed -i "s/^#\?Port .*/Port $SSH_PORT/" "$SSH_CONFIG"
    
    log_info "Disabling root login..."
    sudo sed -i "s/^#\?PermitRootLogin .*/PermitRootLogin no/" "$SSH_CONFIG"
    
    log_info "Enabling public key authentication..."
    sudo sed -i "s/^#\?PubkeyAuthentication .*/PubkeyAuthentication yes/" "$SSH_CONFIG"
    
    log_success "SSH daemon configured"
}

# Start SSH service
start_ssh_service() {
    log_step "Starting SSH service..."
    
    log_info "Enabling SSH service..."
    sudo systemctl enable ssh || { log_error "Failed to enable SSH service"; exit 1; }
    
    log_info "Starting SSH service..."
    sudo systemctl start ssh || { log_error "Failed to start SSH service"; exit 1; }
    
    log_success "SSH service started and enabled"
}

# Verify SSH service
verify_ssh_service() {
    log_step "Verifying SSH service..."
    
    if sudo systemctl is-active ssh >/dev/null 2>&1; then
        log_success "SSH service is running"
    else
        log_error "SSH service is not running"
        exit 1
    fi
    
    if sudo ss -ltnp | grep -q ":$SSH_PORT "; then
        log_success "SSH is listening on port $SSH_PORT"
    else
        log_error "SSH is not listening on port $SSH_PORT"
        exit 1
    fi
    
    log_info "SSH service verification completed"
}

# Main setup function
setup_wsl_Environment() {
    log_info "Starting WSL Ubuntu Environment setup (OpenSSH + Ansible)..."
    
    # Phase 1: Prerequisites and basic setup
    check_prerequisites
    setup_universe_repository
    install_make
    
    # Phase 2: OpenSSH setup
    install_openssh
    setup_ssh_keys
    configure_ssh_daemon
    start_ssh_service
    verify_ssh_service
    
    # Phase 3: Ansible setup
    setup_ansible_ppa
    install_ansible
    
    log_success "WSL Ubuntu Environment setup completed successfully!"
    log_info "OpenSSH is running on port $SSH_PORT"
    log_info "You can connect via: ssh -p $SSH_PORT username@localhost"
    log_info "Ansible is ready for use"
}

# Script entry point
main() {
    setup_logging
    setup_wsl_Environment
}

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
