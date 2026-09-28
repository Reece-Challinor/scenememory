# SceneMemory GCP Cloud Run Deployment & Operational Guide

**Project:** Spatial Proof Lab / SceneMemory v1.0.0  
**Infrastructure Target:** Google Cloud Run (Serverless Container Platform)  
**Cost Posture:** Scale-to-Zero ($0.00 idle spend)  

---

## 1. Prerequisites

- Google Cloud Platform (GCP) Account with an active billing project.
- Google Cloud SDK CLI (`gcloud`) or access to GCP Web Console UI.

---

## 2. Option A: Automated CLI Deployment

Set your GCP project ID and run the deployment script:

```bash
export SCENEMEMORY_PROJECT_ID="your-gcp-project-id"
export SCENEMEMORY_REGION="us-central1"
./scripts/deploy-gcp.sh
```

### Script Execution Sequence:
1. Enables Cloud Run, Cloud Build, and Artifact Registry APIs.
2. Builds multi-stage Docker container via Cloud Build.
3. Deploys service `scenememory` to Cloud Run with flags `--min-instances 0 --max-instances 1 --cpu 1 --memory 256Mi --port 8080`.
4. Outputs service URL and health check URL.

---

## 3. Option B: No-CLI GCP Web Console Deployment

If `gcloud` CLI is not installed locally:

1. Open the [Google Cloud Console](https://console.cloud.google.com/run).
2. Select your GCP project from the top dropdown menu.
3. Click **Create Service**.
4. Choose **Continuously deploy from a repository** or **Upload Source Code**.
5. Set Service Name: `scenememory`.
6. Region: `us-central1`.
7. Capacity: **1 CPU, 256 MiB RAM**.
8. Autoscaling: **Minimum instances: 0**, **Maximum instances: 1**.
9. Ingress: **Allow all traffic** (Public demo).
10. Container Port: **8080**.
11. Click **Create**.

---

## 4. Health Verification & Service Teardown

### Health Verification
```bash
curl -i https://<YOUR-CLOUD-RUN-URL>/healthz
# Expected output: HTTP/1.1 200 OK {"status":"HEALTHY","service":"scenememory"}
```

### Resource Teardown Command
To completely delete the Cloud Run service and stop any resource utilization:

```bash
gcloud run services delete scenememory --project "$SCENEMEMORY_PROJECT_ID" --region us-central1
```
