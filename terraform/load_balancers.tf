resource "azurerm_public_ip" "frontend" {
  name                = "${var.project_name}-frontend-public-ip"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  allocation_method   = "Static"
  sku                 = "Standard"
}

resource "azurerm_lb" "frontend" {
  name                = "${var.project_name}-frontend-lb"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  sku                 = "Standard"

  frontend_ip_configuration {
    name                 = "public"
    public_ip_address_id = azurerm_public_ip.frontend.id
  }
}

resource "azurerm_lb_backend_address_pool" "frontend" {
  name            = "frontend-pool"
  loadbalancer_id = azurerm_lb.frontend.id
}

resource "azurerm_lb_probe" "frontend" {
  name            = "frontend-health"
  loadbalancer_id = azurerm_lb.frontend.id
  protocol        = "Http"
  port            = 80
  request_path    = "/health"
}

resource "azurerm_lb_rule" "frontend" {
  name                           = "frontend-http"
  loadbalancer_id                = azurerm_lb.frontend.id
  protocol                       = "Tcp"
  frontend_port                  = 80
  backend_port                   = 80
  frontend_ip_configuration_name = "public"
  backend_address_pool_ids       = [azurerm_lb_backend_address_pool.frontend.id]
  probe_id                       = azurerm_lb_probe.frontend.id
}

resource "azurerm_lb" "backend" {
  name                = "${var.project_name}-backend-lb"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  sku                 = "Standard"

  frontend_ip_configuration {
    name                          = "private"
    subnet_id                     = azurerm_subnet.backend.id
    private_ip_address            = "10.0.2.10"
    private_ip_address_allocation = "Static"
  }
}

resource "azurerm_lb_backend_address_pool" "backend" {
  name            = "backend-pool"
  loadbalancer_id = azurerm_lb.backend.id
}

resource "azurerm_lb_probe" "backend" {
  name            = "backend-health"
  loadbalancer_id = azurerm_lb.backend.id
  protocol        = "Http"
  port            = 5001
  request_path    = "/health"
}

resource "azurerm_lb_rule" "backend" {
  name                           = "backend-api"
  loadbalancer_id                = azurerm_lb.backend.id
  protocol                       = "Tcp"
  frontend_port                  = 5001
  backend_port                   = 5001
  frontend_ip_configuration_name = "private"
  backend_address_pool_ids       = [azurerm_lb_backend_address_pool.backend.id]
  probe_id                       = azurerm_lb_probe.backend.id
}