# DomainDB - AI Domain Finder

AI-powered domain name generator using Ollama and real-time WHOIS availability checking.

## Overview

DomainDB integrates with your existing homelab infrastructure:
- **Uses existing Redis** from `infrastructure/redis` namespace
- **Connects to external Ollama** server at 192.168.68.133:11434
- **Deploys via ArgoCD** using the homelab-apps ApplicationSet

## Architecture

```
External Ollama (192.168.68.133:11434) ←─┐
                                          │
┌─────────────────────────────────────────┼─────┐
│ Kubernetes Cluster                      │     │
│                                         │     │
│ ┌─────────────────────────────────────┐ │     │
│ │ domaindb namespace                  │ │     │
│ │                                     │ │     │
│ │ ┌─────────────┐ ┌─────────────────┐ │ │     │
│ │ │ Frontend    │ │ Backend         │─┼─┘     │
│ │ │ (Next.js)   │ │ (FastAPI)       │ │       │
│ │ └─────────────┘ └─────────────────┘ │       │
│ │                         │           │       │
│ └─────────────────────────┼───────────┘       │
│                           │                   │
│ ┌─────────────────────────▼───────────┐       │
│ │ redis namespace                     │       │
│ │ ┌─────────────────────────────────┐ │       │
│ │ │ Redis Master                    │ │       │
│ │ │ (Infrastructure component)      │ │       │
│ │ └─────────────────────────────────┘ │       │
│ └─────────────────────────────────────┘       │
└─────────────────────────────────────────────────┘
```

## Configuration

### Environment Variables
- `OLLAMA_HOST`: http://192.168.68.133:11434
- `REDIS_HOST`: redis-master.redis.svc.cluster.local
- `REDIS_PASSWORD`: changeme123 (matches infrastructure/redis)

### Resource Allocation
- **Frontend**: 2 replicas, 256Mi-512Mi RAM, 100m-500m CPU
- **Backend**: 2 replicas, 512Mi-1Gi RAM, 500m-1 CPU

## Deployment

### 1. Prerequisites
Ensure your homelab infrastructure is running:
```bash
# Check Redis is running
kubectl get pods -n redis

# Check ingress-nginx is running
kubectl get pods -n ingress-nginx

# Verify Ollama is accessible
curl http://192.168.68.133:11434/api/tags
```

### 2. Build and Push Images
```bash
cd /home/paul/pollinate/domaindb.store

# Build images
docker build -t ghcr.io/paulcardus/domaindb-frontend:latest ./frontend
docker build -t ghcr.io/paulcardus/domaindb-backend:latest ./backend

# Push to GitHub Container Registry
docker push ghcr.io/paulcardus/domaindb-frontend:latest
docker push ghcr.io/paulcardus/domaindb-backend:latest
```

### 3. Deploy via ArgoCD
The app will automatically deploy once you:
1. Commit the apps/domaindb directory to your homelab repo
2. ArgoCD will detect the new application via the homelab-apps ApplicationSet

```bash
# Check ArgoCD picked up the app
kubectl get applications -n argocd | grep domaindb

# Monitor deployment
kubectl get pods -n domaindb -w
```

### 4. Access the Application
Once deployed, access DomainDB at: https://domaindb.store

## Features

### Domain Generation
- AI-powered suggestions using your Ollama llama3.1:8b model
- Customizable TLDs (.com, .net, .io, .ai, etc.)
- Style preferences (brandable, professional, creative, technical)
- Length and character constraints

### Availability Checking
- Real-time WHOIS lookups
- Intelligent caching via Redis:
  - Available domains: 1 hour cache
  - Taken domains: 7 day cache
- Batch checking for efficiency

### User Interface
- Modern React/Next.js frontend
- Real-time availability indicators
- Copy-to-clipboard functionality
- Responsive design

## Monitoring

### Health Checks
- Frontend: `/api/health`
- Backend: `/health`

### Logs
```bash
# Backend logs
kubectl logs -f deployment/domaindb-backend -n domaindb

# Frontend logs  
kubectl logs -f deployment/domaindb-frontend -n domaindb
```

### Status Check
```bash
# Check all resources
kubectl get all -n domaindb

# Check ingress
kubectl get ingress -n domaindb
```

## Troubleshooting

### Common Issues

1. **Ollama Connection Failed**
   ```bash
   # Test from backend pod
   kubectl exec -it deployment/domaindb-backend -n domaindb -- curl http://192.168.68.133:11434/api/tags
   ```

2. **Redis Connection Failed**
   ```bash
   # Test Redis connectivity
   kubectl exec -it deployment/domaindb-backend -n domaindb -- nc -zv redis-master.redis.svc.cluster.local 6379
   ```

3. **Ingress Not Working**
   ```bash
   # Check ingress status
   kubectl describe ingress domaindb-frontend -n domaindb
   
   # Check cert-manager certificate
   kubectl get certificate -n domaindb
   ```

### Debug Commands
```bash
# Check pod events
kubectl get events -n domaindb --sort-by='.lastTimestamp'

# Pod details
kubectl describe pod <pod-name> -n domaindb

# Service endpoints
kubectl get endpoints -n domaindb
```

## Scaling

### Horizontal Scaling
Edit `values.yaml`:
```yaml
frontend:
  replicaCount: 4

backend:
  replicaCount: 6
```

### Resource Scaling
```yaml
backend:
  resources:
    requests:
      memory: "1Gi"
      cpu: "500m"
    limits:
      memory: "2Gi" 
      cpu: "2"
```

## Security

### TLS
- Automatic HTTPS via cert-manager
- Let's Encrypt certificates
- Certificate secret: `domaindb-store-tls`

### Network Security
- Redis access limited to cluster internal
- External Ollama access via cluster networking
- No exposed Redis or internal services

## Updates

### Rolling Updates
1. Build new images with updated tags
2. Update `values.yaml` with new image tags
3. Commit to git - ArgoCD handles the rest

### Configuration Changes
1. Edit `values.yaml`
2. Commit to git
3. ArgoCD automatically syncs changes