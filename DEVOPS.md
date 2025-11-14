# CI/CD & Monitoring: Jenkins + Docker + Kubernetes + Prometheus/Grafana

This file contains example files and instructions to set up a CI/CD pipeline using Jenkins that builds a React app, pushes a Docker image, and updates a Kubernetes Deployment. It also includes how to install kube-prometheus-stack (Prometheus + Grafana) and an example PrometheusRule alert.

Files added
- `Jenkinsfile` — Declarative Jenkins pipeline that builds, pushes, and deploys with `kubectl set image`.
- `Dockerfile.prod` — Multi-stage build (Node build + NGINX serve).
- `k8s/deployment.yaml` — Deployment with rolling update strategy (replicas: 3).
- `k8s/service.yaml` — ClusterIP service exposing port 80.
- `k8s/ingress.yaml` — Optional ingress example (replace host).
- `k8s/secret-example.yaml` — Example placeholder for `imagePullSecrets`.
- `k8s/prometheusrule-portfolio.yaml` — PrometheusRule alert for high memory.

Quick variables you will want to set

- REGISTRY_USERNAME (your Docker Hub username or GitHub Container Registry path). For this repo I set defaults to `ghcr.io/sandy07-byte`.
- Jenkins credentials:
  - `docker-registry-creds` (username/password)
  - `kubeconfig-file-creds` (secret file containing kubeconfig for kubectl)

Docker image name

The manifests and Jenkinsfile assume images are named: `<REGISTRY_USERNAME>/portfolio`.

Commands: build locally and push

Replace YOUR_REGISTRY with `docker.io/YOUR_USERNAME` or `ghcr.io/sandy07-byte` (recommended for GitHub repos).

```powershell
# build locally (example using GitHub Container Registry)
docker build -t ghcr.io/sandy07-byte/portfolio:latest -f Dockerfile.prod .
# push (for GHCR you'll need to login with a personal access token as password)
docker push ghcr.io/sandy07-byte/portfolio:latest
```

Kubernetes: create imagePullSecret

Replace the username/password and email values and namespace as needed.

```bash
# For Docker Hub
kubectl create secret docker-registry regcred \
  --docker-server=https://index.docker.io/v1/ \
  --docker-username=YOUR_USERNAME \
  --docker-password=YOUR_PASSWORD \
  --docker-email=you@example.com -n default

# For GitHub Container Registry (GHCR):
kubectl create secret docker-registry regcred \
  --docker-server=https://ghcr.io \
  --docker-username=sandy07-byte \
  --docker-password=YOUR_GH_PERSONAL_ACCESS_TOKEN \
  --docker-email=you@example.com -n default
```

Then reference the secret in `k8s/deployment.yaml` by uncommenting `imagePullSecrets`.

Set image manually (if you want to test):

```bash
kubectl set image deployment/portfolio-deployment portfolio-deployment=YOUR_REGISTRY/portfolio:latest -n default --record
kubectl rollout status deployment/portfolio-deployment -n default
```

Jenkins: required credentials and setup

1. In Jenkins > Credentials (global):
   - Add a Username/Password credential with ID `docker-registry-creds` for your Docker registry.
   - Add a Secret File credential with ID `kubeconfig-file-creds` that contains a kubeconfig file allowing Jenkins to run `kubectl` against your cluster.

2. Make sure the Jenkins agent/node where the pipeline runs has Docker and kubectl installed.

3. Optional environment variables in Jenkins (Global pipeline env or job parameters):
   - `IMAGE_NAME` or set `DOCKER_REGISTRY` in environment to your registry username to avoid editing the Jenkinsfile.

GitHub webhook -> Jenkins

There are two common options:

- Use the GitHub plugin + webhook: Create a webhook on your GitHub repo (Settings > Webhooks) with the URL:

  `https://<JENKINS_HOST>/github-webhook/`

  Choose Content type: `application/json` and trigger: `Just the push event`.

- Or use GitHub App / GitHub Branch Source plugin for multibranch pipelines.

If you use the webhook, configure the Jenkins job as a Multibranch Pipeline (recommended) or a Pipeline job with SCM polling disabled and the webhook will trigger runs on push.

Install Prometheus + Grafana (kube-prometheus-stack)

```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update
helm install monitoring prometheus-community/kube-prometheus-stack --namespace monitoring --create-namespace

# Wait for pods to be ready
kubectl get pods -n monitoring
```

Access Grafana

```bash
# port-forward
kubectl port-forward svc/monitoring-grafana 3000:80 -n monitoring
# default user is admin; to get password:
kubectl get secret monitoring-grafana -n monitoring -o jsonpath="{.data.admin-password}" | base64 --decode
```

PrometheusRule example

The file `k8s/prometheusrule-portfolio.yaml` defines `PortfolioHighMemoryUsage` that fires when any portfolio pod uses more than 200Mi for 5 minutes. Adjust thresholds and namespace labels to suit your environment.

Notes & next steps

- Replace placeholder names like `REPLACE_WITH_REGISTRY_USERNAME`, `example.com`, and credential IDs with your real values.
- The Jenkinsfile uses `sh` steps; ensure the agent runs on a Linux node with Docker and kubectl installed.
- Consider adding image tags based on git commit or semantic versioning for traceability.
- For production, secure Jenkins with TLS and limit kubeconfig permissions to only what's necessary for deployments.
