# ========================================
# ElastiCache Redis Module
# ========================================

resource "aws_elasticache_subnet_group" "main" {
  name       = "${var.environment}-redis-subnet-group"
  subnet_ids = var.subnet_ids

  tags = {
    Name = "${var.environment}-redis-subnet-group"
  }
}

resource "aws_elasticache_replication_group" "main" {
  replication_group_id       = "${var.environment}-learnup-redis"
  replication_group_description = "Redis cluster for LearnApp ${var.environment}"

  # Engine
  engine         = "redis"
  engine_version = "7.0"
  port           = 6379

  # Node configuration
  node_type            = var.node_type
  num_cache_clusters   = var.num_cache_nodes
  parameter_group_name = aws_elasticache_parameter_group.main.name

  # Network
  subnet_group_name  = aws_elasticache_subnet_group.main.name
  security_group_ids = [var.security_group_id]

  # Security
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  auth_token                 = var.auth_token

  # High Availability
  automatic_failover_enabled = var.num_cache_nodes > 1
  multi_az_enabled           = var.num_cache_nodes > 1

  # Backup
  snapshot_retention_limit = 5
  snapshot_window          = "03:00-05:00"
  maintenance_window       = "mon:05:00-mon:07:00"

  # Notifications
  notification_topic_arn = var.sns_topic_arn

  # Auto minor version upgrade
  auto_minor_version_upgrade = true

  # Apply changes immediately (use false in production)
  apply_immediately = var.environment != "production"

  tags = {
    Name        = "${var.environment}-learnup-redis"
    Environment = var.environment
  }
}

# ========================================
# Parameter Group
# ========================================

resource "aws_elasticache_parameter_group" "main" {
  name   = "${var.environment}-redis7-params"
  family = "redis7"

  # Performance optimization
  parameter {
    name  = "maxmemory-policy"
    value = "allkeys-lru"
  }

  parameter {
    name  = "timeout"
    value = "300"
  }

  tags = {
    Name = "${var.environment}-redis7-params"
  }
}
