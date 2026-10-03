variable "location" {
  description = "Azure region for all application infrastructure"
  type        = string
  default     = "East US"
}

variable "redis_port" {
  description = "Redis port for the managed instance. Azure Managed Redis commonly uses 10000."
  type        = number
  default     = 10000
}


variable "project_name" {
  description = "Project name"
  type        = string
  default     = "sudoku"
}

variable "admin_username" {
  description = "Linux administrator username for the scale sets"
  type        = string
  default     = "azureuser"
}

variable "admin_ssh_public_key" {
  description = "SSH public key used to access the scale-set instances"
  type        = string
  sensitive   = true
}

variable "frontend_image" {
  description = "Container image for the frontend"
  type        = string
  default     = "ghcr.io/hasan92mari/sudoku-frontend:latest"
}

variable "backend_image" {
  description = "Container image for the backend"
  type        = string
  default     = "ghcr.io/hasan92mari/sudoku-backend:latest"
}

variable "frontend_instance_count" {
  description = "Number of frontend VM instances"
  type        = number
  default     = 1
}

variable "backend_instance_count" {
  description = "Number of backend VM instances"
  type        = number
  default     = 1
}

variable "vm_size" {
  description = "VM size used by both scale sets. Use a size that is available in the selected Azure region."
  type        = string
  default     = "Standard_B1s"
}