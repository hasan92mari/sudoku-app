variable "aws_region" {
  description = "AWS region for the application infrastructure"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Prefix used for AWS resource names"
  type        = string
  default     = "sudoku"
}

variable "vpc_cidr" {
  description = "CIDR block for the application VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "admin_username" {
  description = "SSH username for the Ubuntu instances"
  type        = string
  default     = "ubuntu"
}

variable "admin_ssh_public_key" {
  description = "Public key installed on the frontend and backend instances"
  type        = string
  sensitive   = true
}

variable "instance_type" {
  description = "EC2 instance type for both application Auto Scaling groups"
  type        = string
  default     = "t3.micro"
}

variable "redis_node_type" {
  description = "ElastiCache node type"
  type        = string
  default     = "cache.t3.micro"
}

variable "redis_port" {
  description = "Port used by the Redis replication group"
  type        = number
  default     = 6379
}

variable "frontend_instance_count" {
  description = "Number of frontend EC2 instances"
  type        = number
  default     = 1

  validation {
    condition     = var.frontend_instance_count >= 1
    error_message = "frontend_instance_count must be at least 1."
  }
}

variable "backend_instance_count" {
  description = "Number of backend EC2 instances"
  type        = number
  default     = 1

  validation {
    condition     = var.backend_instance_count >= 1
    error_message = "backend_instance_count must be at least 1."
  }
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
