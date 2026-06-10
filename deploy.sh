#!/usr/bin/env bash
# ==============================================================================
#  EcoTrack — Google Cloud Run Automated Deployment Script
#  Made for PromptWars Virtual
# ==============================================================================

set -eo pipefail

# ANSI color codes for premium terminal feedback
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================================================${NC}"
echo -e "${GREEN}   🌍 EcoTrack — Cloud Run Deployment Utility${NC}"
echo -e "${BLUE}======================================================================${NC}"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}Error: gcloud CLI is not installed. Please run this in Google Cloud Shell or install the SDK.${NC}"
    exit 1
fi

# Get current project ID
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)

if [ -z "$PROJECT_ID" ]; then
    echo -e "${YELLOW}Warning: No default GCP project selected.${NC}"
    echo -n "Please enter your GCP Project ID: "
    read -r PROJECT_ID
    if [ -z "$PROJECT_ID" ]; then
        echo -e "${RED}Error: Project ID is required to deploy.${NC}"
        exit 1
    fi
    gcloud config set project "$PROJECT_ID"
else
    echo -e "${GREEN}Detected Active GCP Project:${NC} ${YELLOW}$PROJECT_ID${NC}"
fi

echo -e "\n${BLUE}[1/3] Enabling Google Cloud APIs...${NC}"
gcloud services enable run.googleapis.com cloudbuild.googleapis.com

echo -e "\n${BLUE}[2/3] Fetching latest codebase from GitHub...${NC}"
if [ -d ".git" ]; then
    echo -e "Git repository detected. Pulling updates..."
    git pull origin main || echo -e "${YELLOW}Warning: Git pull failed, deploying current folder contents...${NC}"
else
    echo -e "${YELLOW}Warning: Not in a git repository. Proceeding with local folder build...${NC}"
fi

echo -e "\n${BLUE}[3/3] Building container image and deploying to Cloud Run...${NC}"
echo -e "Service Name: ${GREEN}ecotrack${NC}"
echo -e "Region:       ${GREEN}us-central1${NC}"
echo -e "Platform:     ${GREEN}Fully Managed${NC}\n"

# Run Cloud Run deploy command
gcloud run deploy ecotrack \
    --source . \
    --region us-central1 \
    --allow-unauthenticated \
    --project "$PROJECT_ID"

echo -e "\n${GREEN}======================================================================${NC}"
echo -e "${GREEN}🎉 Deployment Complete! EcoTrack is now live with updated headers and accessibility.${NC}"
echo -e "${GREEN}======================================================================${NC}"
