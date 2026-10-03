resource "random_password" "redis" {
  length  = 32
  special = false
}

resource "aws_elasticache_subnet_group" "main" {
  name       = "${var.project_name}-redis-subnets"
  subnet_ids = aws_subnet.redis[*].id

  tags = local.common_tags
}

resource "aws_elasticache_replication_group" "main" {
  replication_group_id       = "${var.project_name}-redis"
  description                = "Private Redis cache for ${var.project_name}"
  engine                     = "redis"
  engine_version             = "7.1"
  node_type                  = var.redis_node_type
  num_cache_clusters         = 1
  parameter_group_name       = "default.redis7"
  port                       = var.redis_port
  subnet_group_name          = aws_elasticache_subnet_group.main.name
  security_group_ids         = [aws_security_group.redis.id]
  auth_token                 = random_password.redis.result
  auth_token_update_strategy = "ROTATE"
  transit_encryption_enabled = true
  at_rest_encryption_enabled = true
  automatic_failover_enabled = false
  multi_az_enabled           = false
  apply_immediately          = true

  tags = local.common_tags
}
