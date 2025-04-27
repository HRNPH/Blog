---
title: Isolated Kubernetes Cluster on Proxmox with Terraform and Ansible - part 1
published: 2025-04-27
updated: 2025-04-27
description: "Step-by-step guide to building a fully self-hosted, isolated Kubernetes cluster using Proxmox, Terraform, Ansible, MicroK8s packed with Rancher, and ArgoCD accessible via local domain properly - without wasting your home network IPs."
image: "./cover.png"
tags: [Homelab, Kubernetes, Terraform, Ansible, MicroK8s, Rancher, ArgoCD]
category: "Homelab"
draft: false
---

# Introduction

In this blog, I show you how to built a **self-hosted Kubernetes cluster** on **Proxmox** using **Terraform**, **Ansible**, **MicroK8s**, **Rancher**, and **ArgoCD**.

::github{repo="hrnph/Proxmox-k8s-Terraform"}

## What you will get

- A fully functional Kubernetes cluster with Rancher and ArgoCD
- A self-hosted solution with no external dependencies
- An easy to modify and extend templates
- A clear? understanding of how to set up a Kubernetes cluster on Proxmox
- A clear? understanding of how to use Terraform and Ansible for infrastructure automation

:::note
I did this project for my r/homelab, so I don't have a lot of resources like r/homedatacenter.
with a single Proxmox node with 32GB of RAM and 12 CPU cores.
I love HP Prodesk for this job and you should too for a low budget homelab.
:::

---

# Overview Diagram

![Diagram](./0-flow.svg)

## Design Decision & Planning of what we want to achieve

Before building the cluster, the following goals were set

- ✅ **Complete network isolation:** The Kubernetes cluster should not pollute or consume home LAN IP addresses unnecessarily.
- ✅ **Controlled external access:** Only intentional, limited ingress into the cluster (e.g., Rancher/ArgoCD UIs) should be exposed.
- ✅ **Infrastructure as Code (IaC):** Both VM creation (Terraform) and configuration (Ansible) must be fully automated and reproducible.
- ✅ **Lightweight Kubernetes:** Using MicroK8s for a minimal, fast, HA-capable cluster.
- ✅ **Modern management UIs:** Deploy Rancher and ArgoCD for visual cluster and app control.
- ✅ **SSH Gateway (Jumpbox):** Centralized, secured SSH access via a single VM, without needing to expose cluster nodes individually and we can turn this off without affecting the cluster, like if you don't need local dns access via to master-nodes anymore ex using tailscale or cloudflare tunnels/warps or whatever you want to use.

### Key Components and Flow

| Component                       | Purpose                                                                                                                                                                |
| :------------------------------ | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Proxmox**                     | Hypervisor that hosts all VMs.                                                                                                                                         |
| **Terraform**                   | Automates VM provisioning inside Proxmox.                                                                                                                              |
| **VMs**                         | Cluster nodes (Masters, Workers, Jumpbox) created via Terraform.                                                                                                       |
| **Jumpbox**                     | Secure SSH gateway into the cluster private network.                                                                                                                   |
| **Ansible**                     | Automates installation and configuration of MicroK8s, Rancher, and ArgoCD.                                                                                             |
| **MicroK8s**                    | Kubernetes cluster running across master and worker VMs.                                                                                                               |
| **Ingress Controller**          | Routes traffic internally from user DNS requests to services.                                                                                                          |
| **Rancher & ArgoCD UIs**        | Management UIs for the cluster and GitOps applications.                                                                                                                |
| **DNS (Pi-hole or /etc/hosts)** | Local resolution of friendly service names to the exposed master node IP.                                                                                              |
| **Cloudflare Tunnels**          | Secure external access to services without exposing IPs, All still defined in Terraform. (for now you can actually just use cloudflare tunnels on jumpbox or master-1) |

### Security Choices

- Only `master-1` exposes a LAN IP (192.168.1.250) for ingress traffic.
- No internal cluster node can initiate outbound connections into the home network.
- Jumpbox can be destroyed after provisioning for improved security hardening.

### Why MicroK8s?

- Fast deployment and updates via Snap packages
- Lightweight but HA-capable Kubernetes
- Built-in Helm 3, Ingress, and Cert-Manager
- No etcd dependency (uses Dqlite HA by default)

:::tip
This design replicates cloud provider Private Subnets inside a homelab environment.
:::

---

# Step 1: Proxmox Networking

Create `vmbr0` (LAN) and `vmbr1` (Cluster):

```bash
# /etc/network/interfaces

auto vmbr0
iface vmbr0 inet static
    address 192.168.1.100/24
    gateway 192.168.1.1
    bridge_ports eno1
    bridge_stp off
    bridge_fd 0

auto vmbr1
iface vmbr1 inet static
    address 192.168.3.1/24
    bridge_ports none
    bridge_stp off
    bridge_fd 0
    post-up echo 1 > /proc/sys/net/ipv4/ip_forward
    post-up iptables -t nat -A POSTROUTING -s 192.168.3.0/24 -o vmbr0 -j MASQUERADE
    post-down iptables -t nat -D POSTROUTING -s 192.168.3.0/24 -o vmbr0 -j MASQUERADE
```

✅ Cluster nodes have isolated internet access.

---

# Step 2: Terraform VM Provisioning

```bash
terraform init
terraform plan -out ./plans/1-init
terraform apply ./plans/1-init
```

Creates:

- 2 Masters
- 3 Workers
- 1 Jumpbox (for SSH)

---

# Step 3: Ansible Cluster Configuration

```bash
ansible-playbook -i inventory.ini playbook.yml
```

Tasks:

- Install MicroK8s
- HA cluster setup
- Rancher + ArgoCD deployment
- Expose via Ingress

---

# Step 4: Access Rancher and ArgoCD

DNS Mapping:
This can be done in your router or `/etc/hosts` file.
by adding the following lines to your `/etc/hosts` file for linux and macOS

:::note
help yourself if you are using Windows, not my forté
:::

```bash
192.168.1.250 rancher.madoka
192.168.1.250 argocd.madoka
```

Then access:

- Rancher: `https://rancher.madoka`
- ArgoCD: `https://argocd.madoka`

✅ Full UI access secured.

---

# Important Files Overview

| File                | Purpose                                  |
| :------------------ | :--------------------------------------- |
| `main.tf`           | Terraform VMs definitions                |
| `terraform.tfvars`  | Sensitive variables (Proxmox login, IPs) |
| `inventory.ini`     | Ansible inventory (hosts, jumpbox proxy) |
| `playbook.yml`      | Ansible tasks (K8s, Rancher, ArgoCD)     |
| `.terraform/`       | Terraform local cache (auto)             |
| `terraform.tfstate` | Tracks live infra (do not edit manually) |

---

# Final Thoughts

✅ Secure Kubernetes cluster  
✅ Rancher and ArgoCD fully operational  
✅ Infrastructure as code  
✅ Minimal home network exposure

---

:::tip
Next upgrade will be adding Cloudflare Tunnels for public network access.
This is a great way to expose services without exposing your home network IPs.

for now you can actually just use cloudflare tunnels on jumpbox or master-1, This is also applied to tailscale or whatever you want to use
:::
