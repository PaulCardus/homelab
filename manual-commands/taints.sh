kubectl taint nodes k8s-monitoring-1 monitoring=true:NoSchedule
kubectl label nodes k8s-monitoring-1 monitoring=true

kubectl taint nodes k8s-monitoring-1 redis=true:NoSchedule
kubectl label nodes k8s-monitoring-1 redis=true