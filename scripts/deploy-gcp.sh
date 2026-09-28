#!/usr/bin/env bash
# ==============================================================================
# SPATIAL PROOF LAB — GCP CLOUD RUN DEPLOYMENT SCRIPT
# Deploys SceneMemory static application to Google Cloud Run (Serverless)
#
# Usage:
#   export SCENEMEMORY_PROJECT_ID="your-gcp-project-id"
#   ./scripts/deploy-gcp.sh
# ==============================================================================

set -euo pipefail

SCENEMEMORY_PROJECT_ID="${SCENEMEMORY_PROJECT_ID:-}"
SCENEMEMORY_REGION="${SCENEMEMORY_REGION:-us-central1}"
SCENEMEMORY_SERVICE="${SCENEMEMORY_SERVICE:-scenememory}"

if [ -z "$SCENEMEMORY_PROJECT_ID" ]; then
  echo "Error: SCENEMEMORY_PROJECT_ID environment variable is not set."
  echo "Usage: export SCENEMEMORY_PROJECT_ID=\"<your-gcp-project-id>\" && ./scripts/deploy-gcp.sh"
  exit 1
fi

echo "===================================================="
echo "Deploying SceneMemory to GCP Cloud Run..."
echo "Project: $SCENEMEMORY_PROJECT_ID"
echo "Region:  $SCENEMEMORY_REGION"
echo "Service: $SCENEMEMORY_SERVICE"
echo "===================================================="

# Check gcloud CLI
if ! command -v gcloud &> /dev/null; then
  echo "gcloud CLI is not installed. Install via: brew install --cask gcloud-cli"
  echo "Or use the web console no-CLI fallback documented in docs/GCP_DEPLOYMENT_GUIDE.md"
  exit 1
fi

echo "Enabling required Google Cloud APIs..."
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com \
  --project "$SCENEMEMORY_PROJECT_ID"

echo "Deploying Cloud Run service from source..."
gcloud run deploy "$SCENEMEMORY_SERVICE" \
  --source . \
  --project "$SCENEMEMORY_PROJECT_ID" \
  --region "$SCENEMEMORY_REGION" \
  --allow-unauthenticated \
  --min-instances 0 \
  --max-instances 1 \
  --cpu 1 \
  --memory 256Mi \
  --port 8080

echo "Deployment complete! Retrieving service URL..."
SERVICE_URL=$(gcloud run services describe "$SCENEMEMORY_SERVICE" \
  --project "$SCENEMEMORY_PROJECT_ID" \
  --region "$SCENEMEMORY_REGION" \
  --format='value(status.url)')

echo "===================================================="
echo "SceneMemory Live URL: $SERVICE_URL"
echo "Health Check:          $SERVICE_URL/healthz"
echo "===================================================="
