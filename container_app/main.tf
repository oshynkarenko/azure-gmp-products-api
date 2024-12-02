terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.12.0"
    }
  }

  required_version = ">= 1.1.0"
}

provider "azurerm" {
  features {}
  subscription_id = "b4058428-9b42-432b-9ae0-86688a737509"
}

resource "azurerm_resource_group" "os_docker_container_rg" {
  name     = "os-rg-docker-container"
  location = "North Europe"
}

resource "azurerm_container_registry" "os_docker_container_app" {
  name                = "oscontainerapp"
  resource_group_name = azurerm_resource_group.os_docker_container_rg.name
  location            = azurerm_resource_group.os_docker_container_rg.location
  sku                 = "Basic"
  admin_enabled       = true
}

resource "azurerm_log_analytics_workspace" "os_docker_container_analytics_workspace" {
  name                = "os-log-analytics"
  location            = azurerm_resource_group.os_docker_container_rg.location
  resource_group_name = azurerm_resource_group.os_docker_container_rg.name
}

resource "azurerm_container_app_environment" "os_docker_container_cae" {
  name                       = "os-cae-docker-container"
  location                   = azurerm_resource_group.os_docker_container_rg.location
  resource_group_name        = azurerm_resource_group.os_docker_container_rg.name
  log_analytics_workspace_id = azurerm_log_analytics_workspace.os_docker_container_analytics_workspace.id
}

resource "azurerm_container_app" "os_docker_container_ca_docker_acr" {
  name                         = "os-docker-container-ca-acr"
  container_app_environment_id = azurerm_container_app_environment.os_docker_container_cae.id
  resource_group_name          = azurerm_resource_group.os_docker_container_rg.name
  revision_mode                = "Single"

  registry {
    server               = azurerm_container_registry.os_docker_container_app.login_server
    username             = azurerm_container_registry.os_docker_container_app.admin_username
    password_secret_name = "acr-password"
  }

  ingress {
    allow_insecure_connections = false
    external_enabled           = true
    target_port                = 3000

    traffic_weight {
      percentage      = 100
      latest_revision = true
    }

  }

  template {
    container {
      name   = "os-docker-container-acr"
      image  = "${azurerm_container_registry.os_docker_container_app.login_server}/${var.os_container_name}:${var.os_docker_container_tag_acr}"
      cpu    = 0.25
      memory = "0.5Gi"

      env {
        name  = "CONTAINER_REGISTRY_NAME"
        value = "Azure Container Registry"
      }
    }
  }

  secret {
    name  = "acr-password"
    value = azurerm_container_registry.os_docker_container_app.admin_password
  }
}

resource "azurerm_container_app" "os_docker_container_ca_docker" {
  name                         = "os-docker-container-ca-dr"
  container_app_environment_id = azurerm_container_app_environment.os_docker_container_cae.id
  resource_group_name          = azurerm_resource_group.os_docker_container_rg.name
  revision_mode                = "Single"

  registry {
    server               = "docker.io"
    username             = var.docker_username
    password_secret_name = "docker-password"
  }

  ingress {
    allow_insecure_connections = false
    external_enabled           = true
    target_port                = 3000

    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }

  template {
    container {
      name   = "os-docker-container-dr"
      image  = "${var.docker_username}/os_docker_container_app:latest"
      cpu    = 0.25
      memory = "0.5Gi"

      env {
        name  = "CONTAINER_REGISTRY_NAME"
        value = "Docker Hub"
      }
    }
  }

  secret {
    name  = "docker-password"
    value = var.docker_password
  }
}

variable "os_container_name" {
  default = "os_docker_container_app"
}

variable "os_docker_container_tag_acr" {
  default = "latest"
}

variable "docker_username" {
  description = "Docker Hub username"
  type        = string
  sensitive   = true
}

variable "docker_password" {
  description = "Docker Hub password"
  type        = string
  sensitive   = true
}
