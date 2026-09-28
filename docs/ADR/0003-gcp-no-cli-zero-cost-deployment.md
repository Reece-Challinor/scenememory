# ADR 0003: GCP Zero-Cost Cloud Posture & No-CLI Web Console Fallback

**Status:** Accepted  
**Date:** 2026-09-28  
**Context:** Spatial Proof Lab / SceneMemory v1.0.0  

## Context and Problem Statement
The application requires deployment options for public demonstration while adhering strictly to zero cloud cost guidelines and providing robust operational fallbacks if local gcloud CLI tools or credentials are not pre-authenticated.

## Decision Drivers
1. **Zero Unexpected Billing:** Ensure no GPU or VM compute charges accumulate.
2. **No-CLI Operational Fallback:** Allow complete setup via GCP Web Console without local gcloud CLI dependency.
3. **Container Contract Standard:** Ensure compliance with standard HTTP 8080 `/healthz` health checks.

## Decision Outcome
Deploy SceneMemory as a containerized static application on Google Cloud Run with scale-to-zero configuration (`--min-instances 0`, `--max-instances 1`).

### Deployment Modes
1. **Automated CLI:** `scripts/deploy-gcp.sh` script invoking `gcloud run deploy`.
2. **No-CLI Web Console Fallback:** Upload source archive to Cloud Run Web Console UI directly.
