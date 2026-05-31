#!/bin/bash

# Database health check script
# This script checks if the PostgreSQL database is accessible and responding
# Usage: ./health-db-check.sh [--tables] [--help]

# Configuration
DB_HOST="localhost"
DB_PORT="5432"
DB_USER="postgres"
DB_NAME="local_dev"
DB_PASSWORD="postgres"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default behavior
SHOW_TABLES=true

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --no-tables)
            SHOW_TABLES=false
            shift
            ;;
        --help|-h)
            echo "Database Health Check Script"
            echo ""
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --no-tables  Hide database tables (default: show tables)"
            echo "  --help, -h   Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0              # Health check with table listing (default)"
            echo "  $0 --no-tables  # Basic health check without table listing"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    case $status in
        "success")
            echo -e "${GREEN}✓${NC} $message"
            ;;
        "error")
            echo -e "${RED}✗${NC} $message"
            ;;
        "warning")
            echo -e "${YELLOW}⚠${NC} $message"
            ;;
        "info")
            echo -e "${BLUE}ℹ${NC} $message"
            ;;
    esac
}

# Function to execute psql command with proper authentication
execute_psql() {
    local query="$1"
    local silent="$2"
    
    # Try with PGPASSWORD first
    if [ -n "$DB_PASSWORD" ]; then
        if [ "$silent" = "true" ]; then
            PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "$query" 2>/dev/null
        else
            PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "$query"
        fi
        return $?
    fi
    
    # Try without password (trust authentication)
    if [ "$silent" = "true" ]; then
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "$query" 2>/dev/null
    else
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "$query"
    fi
    return $?
}

# Function to display database tables
show_tables() {
    print_status "info" "Fetching database tables..."
    
    local tables_query="SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"
    local tables=$(execute_psql "$tables_query" "true")
    
    if [ $? -eq 0 ] && [ -n "$tables" ]; then
        echo ""
        print_status "success" "Database tables found:"
        echo "┌─────────────────────────────────────┐"
        echo "│ Table Name                          │"
        echo "├─────────────────────────────────────┤"
        
        # Count tables and format output
        local table_count=0
        while IFS= read -r table; do
            if [ -n "$table" ]; then
                # Clean up the table name (remove leading/trailing whitespace)
                table=$(echo "$table" | xargs)
                printf "│ %-35s │\n" "$table"
                ((table_count++))
            fi
        done <<< "$tables"
        
        echo "└─────────────────────────────────────┘"
        print_status "info" "Total tables: $table_count"
    else
        print_status "warning" "No tables found or unable to retrieve table list"
    fi
}

# Check if psql is available
if ! command -v psql &> /dev/null; then
    print_status "error" "psql command not found. Please install PostgreSQL client."
    exit 1
fi

# Try to connect to the database
echo "Checking database connection..."

# Test connection
execute_psql "SELECT 1;" "true"
if [ $? -eq 0 ]; then
    print_status "success" "Database connection successful"
    
    # Show tables if requested
    if [ "$SHOW_TABLES" = true ]; then
        show_tables
    fi
    
    exit 0
fi

# If connection failed, try interactive password prompt
print_status "warning" "Attempting connection with password prompt..."
execute_psql "SELECT 1;" "false"
if [ $? -eq 0 ]; then
    print_status "success" "Database connection successful with password prompt"
    
    # Show tables if requested
    if [ "$SHOW_TABLES" = true ]; then
        show_tables
    fi
    
    exit 0
fi

# If all methods fail
print_status "error" "Failed to connect to database"
print_status "error" "Please check:"
echo "  - Database server is running on $DB_HOST:$DB_PORT"
echo "  - User '$DB_USER' exists and has access to database '$DB_NAME'"
echo "  - Authentication method is properly configured"
echo "  - Network connectivity to the database server"

exit 1