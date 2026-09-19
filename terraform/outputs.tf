output "resource_group_name" {
  value = azurerm_resource_group.main.name
}

output "vnet_name" {
  value = azurerm_virtual_network.main.name
}

output "frontend_subnet_id" {
  value = azurerm_subnet.frontend.id
}

output "backend_subnet_id" {
  value = azurerm_subnet.backend.id
}

output "redis_subnet_id" {
  value = azurerm_subnet.redis.id
}

output "redis_hostname" {
  value = azurerm_managed_redis.main.hostname
}

output "redis_port" {
  value = length(azurerm_managed_redis.main.default_database) > 0 ? azurerm_managed_redis.main.default_database[0].port : var.redis_port
}

output "frontend_public_ip" {
  value = azurerm_public_ip.frontend.ip_address
}

output "frontend_url" {
  value = "http://${azurerm_public_ip.frontend.ip_address}"
}

output "backend_private_load_balancer_ip" {
  value = "10.0.2.10"
}