resource "azurerm_managed_redis" "main" {
  name                = "${var.project_name}-redis"
  resource_group_name = azurerm_resource_group.main.name
  location            = var.location

  sku_name              = "Balanced_B0"
  public_network_access = "Disabled"

  default_database {
    access_keys_authentication_enabled = true
    client_protocol                    = "Encrypted"
    clustering_policy                  = "EnterpriseCluster"
    eviction_policy                    = "VolatileLRU"
  }
}