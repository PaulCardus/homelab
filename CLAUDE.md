# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a Kubernetes homelab configuration repository managed using ArgoCD with GitOps practices. The infrastructure and applications are defined as Helm charts and Kubernetes manifests, automatically deployed via ArgoCD ApplicationSets.

## Architecture

The repository follows a clear separation of concerns:

- `apps/` - Application deployments (currently empty, managed by ArgoCD ApplicationSet)
- `infrastructure/` - Core infrastructure components (ingress, load balancing, storage, etc.)
- `infrastructure-archived/` - Previously used monitoring components (Loki, Promtail, monitoring)
- `argocd-appsets/` - ArgoCD ApplicationSet definitions that automatically discover and deploy charts

### Key Components

- **ArgoCD ApplicationSets**: Two main ApplicationSets automatically deploy all charts in `apps/` and `infrastructure/` directories
- **MetalLB**: Provides LoadBalancer services with IP pool 192.168.68.130-149
- **Ingress NGINX**: Configured with structured JSON logging and LoadBalancer service type
- **Elastic Stack**: ECK (Elastic Cloud on Kubernetes) operator and stack for monitoring
- **Redis**: Data store with Helm chart configuration
- **Local Path Provisioner**: Storage provisioning for the cluster

## Development Workflow

### Common Commands

```bash
# Apply individual manifests for testing
kubectl apply -f infrastructure/local-path-provisioner/local-path-provisioner.yaml

# Apply node taints and labels for monitoring
./manual-commands/taints.sh

# Check ArgoCD ApplicationSets status
kubectl get applicationsets -n argocd

# Sync specific ArgoCD application
argocd app sync <app-name>
```

### Helm Chart Structure

Each infrastructure component uses standard Helm chart structure:
- `Chart.yaml` - Chart metadata and dependencies
- `values.yaml` - Configuration values
- `templates/` - Kubernetes manifests (where applicable)

### ArgoCD Integration

- Applications are automatically discovered by ApplicationSets based on directory structure
- Each directory in `apps/` and `infrastructure/` becomes an ArgoCD application
- Automated sync with prune and self-heal enabled
- Namespaces are auto-created matching the directory basename

### Network Configuration

The homelab assumes network subnet `192.168.68.x` with MetalLB managing LoadBalancer IP assignments. Update MetalLB values if your network differs.

## Important Files

- `argocd-appsets/homelab-apps.yaml` - Manages application deployments
- `argocd-appsets/infrastructure.yaml` - Manages infrastructure deployments  
- `infrastructure/metallb/values.yaml` - Network IP pool configuration
- `manual-commands/taints.sh` - Node affinity setup for monitoring workloads