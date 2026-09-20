locals {
  redis_url = "rediss://:${urlencode(azurerm_managed_redis.main.default_database[0].primary_access_key)}@${azurerm_managed_redis.main.hostname}:${azurerm_managed_redis.main.default_database[0].port}"

  backend_base_url = "http://${azurerm_lb.backend.frontend_ip_configuration[0].private_ip_address}:5001"
}

resource "azurerm_linux_virtual_machine_scale_set" "frontend" {
  name                 = "${var.project_name}-frontend-vmss"
  location             = azurerm_resource_group.main.location
  resource_group_name  = azurerm_resource_group.main.name
  sku                  = var.vm_size
  instances            = var.frontend_instance_count
  admin_username       = var.admin_username
  computer_name_prefix = "sudoku-fe"

  admin_ssh_key {
    username   = var.admin_username
    public_key = var.admin_ssh_public_key
  }

  source_image_reference {
    publisher = "Canonical"
    offer     = "0001-com-ubuntu-server-jammy"
    sku       = "22_04-lts-gen2"
    version   = "latest"
  }

  os_disk {
    storage_account_type = "Standard_LRS"
    caching              = "ReadWrite"
  }

  network_interface {
    name    = "frontend-nic"
    primary = true

    ip_configuration {
      name                                   = "frontend-ip"
      primary                                = true
      subnet_id                              = azurerm_subnet.frontend.id
      load_balancer_backend_address_pool_ids = [azurerm_lb_backend_address_pool.frontend.id]
    }
  }

  custom_data = base64encode(<<-CLOUD_INIT
    #cloud-config
    runcmd:
      - apt-get update
      - apt-get install -y docker.io
      - systemctl enable --now docker
      - docker pull ${var.frontend_image}
      - docker run -d --restart unless-stopped --name frontend -p 80:80 -e BACKEND_BASE_URL=${local.backend_base_url} -e FRONTEND_REDIS_URL=${local.redis_url} ${var.frontend_image}
  CLOUD_INIT
  )
}

resource "azurerm_linux_virtual_machine_scale_set" "backend" {
  name                 = "${var.project_name}-backend-vmss"
  location             = azurerm_resource_group.main.location
  resource_group_name  = azurerm_resource_group.main.name
  sku                  = var.vm_size
  instances            = var.backend_instance_count
  admin_username       = var.admin_username
  computer_name_prefix = "sudoku-be"

  admin_ssh_key {
    username   = var.admin_username
    public_key = var.admin_ssh_public_key
  }

  source_image_reference {
    publisher = "Canonical"
    offer     = "0001-com-ubuntu-server-jammy"
    sku       = "22_04-lts-gen2"
    version   = "latest"
  }

  os_disk {
    storage_account_type = "Standard_LRS"
    caching              = "ReadWrite"
  }

  network_interface {
    name    = "backend-nic"
    primary = true

    ip_configuration {
      name                                   = "backend-ip"
      primary                                = true
      subnet_id                              = azurerm_subnet.backend.id
      load_balancer_backend_address_pool_ids = [azurerm_lb_backend_address_pool.backend.id]
    }
  }

  custom_data = base64encode(<<-CLOUD_INIT
    #cloud-config
    runcmd:
      - apt-get update
      - apt-get install -y docker.io
      - systemctl enable --now docker
      - docker pull ${var.backend_image}
      - docker run -d --restart unless-stopped --name backend -p 5001:5001 -e PORT=5001 -e REDIS_URL=${local.redis_url} ${var.backend_image}
  CLOUD_INIT
  )
}