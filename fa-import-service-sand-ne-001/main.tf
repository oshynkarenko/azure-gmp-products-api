terraform {
  required_providers {
    azurerm = {
      source          = "hashicorp/azurerm"
      version         = "~> 4.9.0"
    }
  }

  required_version = ">= 1.1.0"
}

provider "azurerm" {
  features {}
  subscription_id = "b4058428-9b42-432b-9ae0-86688a737509"
}

resource "azurerm_resource_group" "import_service_rg" {
  name     = "rg-import-service-sand-ne-001"
  location = "northeurope"
}

resource "azurerm_storage_account" "import_service_storage_account" {
  name                             = "oshynkarenkone003"
  resource_group_name              = azurerm_resource_group.import_service_rg.name
  location                         = "northeurope"
  account_tier                     = "Standard"
  account_replication_type         = "LRS"
  access_tier                      = "Cool"
  account_kind             = "StorageV2"
/*  enable_https_traffic_only        = true
  allow_nested_items_to_be_public  = true
  shared_access_key_enabled        = true
  public_network_access_enabled    = true*/

  blob_properties {
    cors_rule {
      allowed_headers    = ["*"]
      allowed_methods    = ["GET", "POST", "PUT", "OPTIONS"]
      allowed_origins    = ["*"]
      exposed_headers    = ["*"]
      max_age_in_seconds = 3600
    }
  }
}

resource "azurerm_storage_container" "uploaded" {
  name                  = "uploaded"
  storage_account_name  = azurerm_storage_account.import_service_storage_account.name
  container_access_type = "private"
}

resource "azurerm_storage_container" "parsed" {
  name                  = "parsed"
  storage_account_name  = azurerm_storage_account.import_service_storage_account.name
  container_access_type = "private"
}

resource "azurerm_storage_share" "import_service_storage_share" {
  name  = "fa-import-service-share"
  quota = 2

  storage_account_name = azurerm_storage_account.import_service_storage_account.name
}

resource "azurerm_service_plan" "import_service_service_plan" {
  name     = "asp-import-service-sand-ne-001"
  location = "northeurope"

  os_type  = "Windows"
  sku_name = "Y1"

  resource_group_name = azurerm_resource_group.import_service_rg.name
}

resource "azurerm_application_insights" "import_service_application_insights" {
  name             = "appins-fa-import-service-sand-ne-001"
  location         = "northeurope"
  application_type = "web"

  resource_group_name = azurerm_resource_group.import_service_rg.name
}

resource "azurerm_windows_function_app" "import_service" {
  name     = "fa-import-service-ne-os-001"
  location = "northeurope"

  service_plan_id     = azurerm_service_plan.import_service_service_plan.id
  resource_group_name = azurerm_resource_group.import_service_rg.name

  storage_account_name       = azurerm_storage_account.import_service_storage_account.name
  storage_account_access_key = azurerm_storage_account.import_service_storage_account.primary_access_key

  functions_extension_version = "~4"
  builtin_logging_enabled     = false

  site_config {
    always_on                              = false
    application_insights_key               = azurerm_application_insights.import_service_application_insights.instrumentation_key
    application_insights_connection_string = azurerm_application_insights.import_service_application_insights.connection_string

    use_32_bit_worker = true

    cors {
      allowed_origins = ["*"]
    }

    application_stack {
      node_version = "~18"
    }
  }

  identity {
    type = "SystemAssigned"
  }

  app_settings = {
    WEBSITE_CONTENTAZUREFILECONNECTIONSTRING = azurerm_storage_account.import_service_storage_account.primary_connection_string
    WEBSITE_CONTENTSHARE                     = azurerm_storage_share.import_service_storage_share.name
    DOTNET_USE_POLLING_FILE_WATCHER          = 1
    WEBSITE_RUN_FROM_PACKAGE                 = 1
    FUNCTIONS_WORKER_RUNTIME                 = "node"
    AZURE_STORAGE_ACCOUNT_NAME               = azurerm_storage_account.import_service_storage_account.name
    AZURE_STORAGE_KEY                        = azurerm_storage_account.import_service_storage_account.primary_access_key
  }

  lifecycle {
    ignore_changes = [
      app_settings,
      site_config["application_stack"],
      tags["hidden-link: /app-insights-instrumentation-key"],
      tags["hidden-link: /app-insights-resource-id"],
      tags["hidden-link: /app-insights-conn-string"],
    ]
  }
}