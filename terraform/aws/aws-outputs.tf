output "frontend_url" {
  value = "http://${aws_lb.frontend.dns_name}"
}

output "frontend_ssh_command" {
  value = "ssh -p 50000 ${var.admin_username}@${aws_lb.ssh.dns_name}"
}

output "backend_internal_url" {
  value = "http://${aws_lb.backend.dns_name}:5001"
}

output "redis_endpoint" {
  value = aws_elasticache_replication_group.main.primary_endpoint_address
}

output "redis_port" {
  value = aws_elasticache_replication_group.main.port
}
