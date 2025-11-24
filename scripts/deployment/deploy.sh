#!/bin/bash

# VetCare Hospital Management System - Deployment Script
# This script handles the deployment of the entire application stack

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-development}
VERSION=${2:-latest}
REGISTRY=${3:-localhost:5000}

echo -e "${BLUE}🚀 Starting VetCare Hospital Management System Deployment${NC}"
echo -e "${BLUE}Environment: ${ENVIRONMENT}${NC}"
echo -e "${BLUE}Version: ${VERSION}${NC}"
echo -e "${BLUE}Registry: ${REGISTRY}${NC}"

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose and try again."
    exit 1
fi

# Create necessary directories
print_status "Creating necessary directories..."
mkdir -p logs
mkdir -p uploads
mkdir -p ssl
mkdir -p monitoring/grafana/dashboards
mkdir -p monitoring/grafana/datasources

# Set environment variables
export NODE_ENV=$ENVIRONMENT
export VERSION=$VERSION

# Build and start services
print_status "Building and starting services..."

case $ENVIRONMENT in
    "development")
        print_status "Starting development environment..."
        docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build -d
        ;;
    "staging")
        print_status "Starting staging environment..."
        docker-compose -f docker-compose.yml -f docker-compose.staging.yml up --build -d
        ;;
    "production")
        print_status "Starting production environment..."
        docker-compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d
        ;;
    *)
        print_error "Invalid environment. Use: development, staging, or production"
        exit 1
        ;;
esac

# Wait for services to be ready
print_status "Waiting for services to be ready..."
sleep 30

# Health checks
print_status "Performing health checks..."

# Check database
if docker-compose exec mysql mysqladmin ping -h localhost --silent; then
    print_status "Database is healthy"
else
    print_error "Database health check failed"
    exit 1
fi

# Check Redis
if docker-compose exec redis redis-cli ping | grep -q PONG; then
    print_status "Redis is healthy"
else
    print_error "Redis health check failed"
    exit 1
fi

# Check backend API
if curl -f http://localhost:3001/health > /dev/null 2>&1; then
    print_status "Backend API is healthy"
else
    print_error "Backend API health check failed"
    exit 1
fi

# Check frontend
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    print_status "Frontend is healthy"
else
    print_error "Frontend health check failed"
    exit 1
fi

# Run database migrations
print_status "Running database migrations..."
docker-compose exec backend npm run migrate

# Seed database if development
if [ "$ENVIRONMENT" = "development" ]; then
    print_status "Seeding database with initial data..."
    docker-compose exec backend npm run seed
fi

# Display service information
echo -e "${BLUE}🎉 Deployment completed successfully!${NC}"
echo ""
echo -e "${GREEN}Service URLs:${NC}"
echo -e "  Frontend:     http://localhost:3000"
echo -e "  Backend API:  http://localhost:3001"
echo -e "  API Docs:     http://localhost:3001/api-docs"
echo -e "  Health Check: http://localhost:3001/health"
echo -e "  Grafana:      http://localhost:3001 (admin/admin)"
echo -e "  Prometheus:   http://localhost:9090"
echo ""
echo -e "${GREEN}Database:${NC}"
echo -e "  Host: localhost"
echo -e "  Port: 3306"
echo -e "  Database: animal_clinic_db"
echo -e "  Username: vetcare_user"
echo -e "  Password: vetcare_pass_2024"
echo ""
echo -e "${GREEN}Redis:${NC}"
echo -e "  Host: localhost"
echo -e "  Port: 6379"
echo ""

# Show running containers
print_status "Running containers:"
docker-compose ps

print_status "Deployment completed successfully!"
