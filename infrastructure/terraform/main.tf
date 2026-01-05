# ========================================
# LearnApp Platform - Terraform Main Configuration
# ========================================
# This file orchestrates all AWS resources

terraform {
  required_version = ">= 1.5.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }

  # Backend configuration for state management
  # Uncomment after creating S3 bucket manually
  # backend "s3" {
  #   bucket         = "learnup-terraform-state"
  #   key            = "production/terraform.tfstate"
  #   region         = "us-east-1"
  #   encrypt        = true
  #   dynamodb_table = "learnup-terraform-locks"
  # }
}

# ========================================
# Provider Configuration
# ========================================

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "LearnApp"
      Environment = var.environment
      ManagedBy   = "Terraform"
      Owner       = "LearnApp Team"
      CostCenter  = "Engineering"
    }
  }
}

# ========================================
# Data Sources
# ========================================

# Get current AWS account ID
data "aws_caller_identity" "current" {}

# Get available AZs
data "aws_availability_zones" "available" {
  state = "available"
}

# ========================================
# Random Resources
# ========================================

resource "random_string" "db_password" {
  length  = 32
  special = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

resource "random_string" "redis_auth_token" {
  length  = 64
  special = false
}

# ========================================
# VPC Module
# ========================================

module "vpc" {
  source = "./modules/vpc"

  environment         = var.environment
  vpc_cidr            = var.vpc_cidr
  availability_zones  = slice(data.aws_availability_zones.available.names, 0, 2)
  
  public_subnet_cidrs  = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs
  database_subnet_cidrs = var.database_subnet_cidrs

  enable_nat_gateway = var.enable_nat_gateway
  enable_vpn_gateway = false
  enable_dns_support = true
  enable_dns_hostnames = true
}

# ========================================
# Security Groups
# ========================================

module "security_groups" {
  source = "./modules/security"

  environment = var.environment
  vpc_id      = module.vpc.vpc_id
}

# ========================================
# RDS PostgreSQL Database
# ========================================

module "rds" {
  source = "./modules/rds"

  environment        = var.environment
  vpc_id             = module.vpc.vpc_id
  database_subnet_ids = module.vpc.database_subnet_ids
  
  db_name            = var.db_name
  db_username        = var.db_username
  db_password        = random_string.db_password.result
  
  instance_class     = var.rds_instance_class
  allocated_storage  = var.rds_allocated_storage
  max_allocated_storage = var.rds_max_allocated_storage
  
  multi_az           = var.rds_multi_az
  backup_retention   = var.rds_backup_retention
  
  security_group_id  = module.security_groups.rds_security_group_id
}

# ========================================
# ElastiCache Redis
# ========================================

module "redis" {
  source = "./modules/redis"

  environment        = var.environment
  vpc_id             = module.vpc.vpc_id
  subnet_ids         = module.vpc.private_subnet_ids
  
  node_type          = var.redis_node_type
  num_cache_nodes    = var.redis_num_nodes
  auth_token         = random_string.redis_auth_token.result
  
  security_group_id  = module.security_groups.redis_security_group_id
}

# ========================================
# S3 Buckets
# ========================================

module "s3" {
  source = "./modules/s3"

  environment = var.environment
  
  buckets = {
    uploads = {
      name = "${var.project_name}-${var.environment}-uploads"
      versioning = true
      lifecycle_rules = true
    }
    backups = {
      name = "${var.project_name}-${var.environment}-backups"
      versioning = true
      lifecycle_rules = true
    }
    logs = {
      name = "${var.project_name}-${var.environment}-logs"
      versioning = false
      lifecycle_rules = true
    }
    admin_frontend = {
      name = "${var.project_name}-${var.environment}-admin-frontend"
      versioning = false
      website = true
    }
  }
}

# ========================================
# ECR Repositories
# ========================================

module "ecr" {
  source = "./modules/ecr"

  environment = var.environment
  
  repositories = [
    "${var.project_name}-backend",
    "${var.project_name}-ai-service"
  ]
}

# ========================================
# ECS Cluster
# ========================================

module "ecs" {
  source = "./modules/ecs"

  environment        = var.environment
  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids
  public_subnet_ids  = module.vpc.public_subnet_ids
  
  # Backend Service
  backend_image      = "${module.ecr.repository_urls[0]}:latest"
  backend_cpu        = var.backend_cpu
  backend_memory     = var.backend_memory
  backend_min_tasks  = var.backend_min_tasks
  backend_max_tasks  = var.backend_max_tasks
  
  # AI Service
  ai_service_image   = "${module.ecr.repository_urls[1]}:latest"
  ai_service_cpu     = var.ai_service_cpu
  ai_service_memory  = var.ai_service_memory
  
  # Environment variables
  database_url       = module.rds.database_url
  redis_url          = module.redis.redis_url
  
  # Security
  ecs_security_group_id = module.security_groups.ecs_security_group_id
  alb_security_group_id = module.security_groups.alb_security_group_id
  
  # Secrets
  jwt_secret_arn     = aws_secretsmanager_secret.jwt_secret.arn
  jwt_refresh_secret_arn = aws_secretsmanager_secret.jwt_refresh_secret.arn
}

# ========================================
# Application Load Balancer
# ========================================

module "alb" {
  source = "./modules/alb"

  environment        = var.environment
  vpc_id             = module.vpc.vpc_id
  public_subnet_ids  = module.vpc.public_subnet_ids
  
  security_group_id  = module.security_groups.alb_security_group_id
  
  backend_target_group_arn = module.ecs.backend_target_group_arn
  
  # SSL Certificate ARN (create manually in ACM first)
  certificate_arn    = var.acm_certificate_arn
  
  enable_https       = var.enable_https
}

# ========================================
# CloudFront Distribution
# ========================================

module "cloudfront" {
  source = "./modules/cloudfront"

  environment = var.environment
  
  # Origins
  alb_domain_name           = module.alb.alb_dns_name
  admin_s3_bucket_domain    = module.s3.bucket_regional_domains["admin_frontend"]
  
  # SSL
  certificate_arn           = var.acm_certificate_arn_us_east_1
  
  # Domains
  api_domain                = "api.${var.domain_name}"
  admin_domain              = "admin.${var.domain_name}"
  
  enable_waf                = var.enable_waf
}

# ========================================
# Route 53 DNS
# ========================================

module "route53" {
  source = "./modules/route53"

  domain_name               = var.domain_name
  
  # CloudFront distributions
  api_cloudfront_domain     = module.cloudfront.api_distribution_domain
  api_cloudfront_zone_id    = module.cloudfront.api_distribution_zone_id
  
  admin_cloudfront_domain   = module.cloudfront.admin_distribution_domain
  admin_cloudfront_zone_id  = module.cloudfront.admin_distribution_zone_id
  
  # ALB (if not using CloudFront)
  alb_dns_name              = module.alb.alb_dns_name
  alb_zone_id               = module.alb.alb_zone_id
}

# ========================================
# Secrets Manager
# ========================================

resource "aws_secretsmanager_secret" "jwt_secret" {
  name        = "${var.project_name}/${var.environment}/jwt-secret"
  description = "JWT secret for LearnApp platform"
  
  recovery_window_in_days = 7
}

resource "aws_secretsmanager_secret_version" "jwt_secret" {
  secret_id     = aws_secretsmanager_secret.jwt_secret.id
  secret_string = random_string.jwt_secret.result
}

resource "random_string" "jwt_secret" {
  length  = 64
  special = false
}

resource "aws_secretsmanager_secret" "jwt_refresh_secret" {
  name        = "${var.project_name}/${var.environment}/jwt-refresh-secret"
  description = "JWT refresh secret for LearnApp platform"
  
  recovery_window_in_days = 7
}

resource "aws_secretsmanager_secret_version" "jwt_refresh_secret" {
  secret_id     = aws_secretsmanager_secret.jwt_refresh_secret.id
  secret_string = random_string.jwt_refresh_secret.result
}

resource "random_string" "jwt_refresh_secret" {
  length  = 64
  special = false
}

resource "aws_secretsmanager_secret" "database_credentials" {
  name        = "${var.project_name}/${var.environment}/database-credentials"
  description = "Database credentials for LearnApp platform"
  
  recovery_window_in_days = 7
}

resource "aws_secretsmanager_secret_version" "database_credentials" {
  secret_id     = aws_secretsmanager_secret.database_credentials.id
  secret_string = jsonencode({
    username = var.db_username
    password = random_string.db_password.result
    host     = module.rds.db_instance_endpoint
    port     = 5432
    database = var.db_name
    url      = module.rds.database_url
  })
}

# ========================================
# CloudWatch Log Groups
# ========================================

resource "aws_cloudwatch_log_group" "backend" {
  name              = "/ecs/${var.environment}/backend"
  retention_in_days = var.log_retention_days

  tags = {
    Name = "backend-logs"
  }
}

resource "aws_cloudwatch_log_group" "ai_service" {
  name              = "/ecs/${var.environment}/ai-service"
  retention_in_days = var.log_retention_days

  tags = {
    Name = "ai-service-logs"
  }
}

# ========================================
# CloudWatch Alarms
# ========================================

module "monitoring" {
  source = "./modules/monitoring"

  environment       = var.environment
  cluster_name      = module.ecs.cluster_name
  backend_service   = module.ecs.backend_service_name
  
  alarm_email       = var.alarm_email
  
  # Thresholds
  cpu_threshold     = 80
  memory_threshold  = 80
  error_rate_threshold = 5
}

# ========================================
# Backup Configuration
# ========================================

module "backup" {
  source = "./modules/backup"

  environment       = var.environment
  
  # RDS
  rds_arn           = module.rds.db_instance_arn
  
  # S3
  s3_arns           = [
    module.s3.bucket_arns["uploads"],
    module.s3.bucket_arns["backups"]
  ]
  
  backup_schedule   = "cron(0 2 * * ? *)"  # 2 AM daily
  retention_days    = 30
}

# ========================================
# WAF (Web Application Firewall)
# ========================================

module "waf" {
  source = "./modules/waf"
  count  = var.enable_waf ? 1 : 0

  environment = var.environment
  
  # Associate with CloudFront
  cloudfront_arn = module.cloudfront.api_distribution_arn
  
  # Rules
  enable_rate_limiting = true
  rate_limit           = 2000  # requests per 5 minutes
  
  enable_geo_blocking  = false
  blocked_countries    = []
}
