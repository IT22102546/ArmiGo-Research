# ========================================
# Terraform Outputs
# ========================================

# ========================================
# VPC Outputs
# ========================================

output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = module.vpc.public_subnet_ids
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = module.vpc.private_subnet_ids
}

output "database_subnet_ids" {
  description = "Database subnet IDs"
  value       = module.vpc.database_subnet_ids
}

# ========================================
# RDS Outputs
# ========================================

output "rds_endpoint" {
  description = "RDS PostgreSQL endpoint"
  value       = module.rds.db_instance_endpoint
  sensitive   = true
}

output "rds_arn" {
  description = "RDS PostgreSQL ARN"
  value       = module.rds.db_instance_arn
}

output "database_url" {
  description = "Full database connection URL"
  value       = module.rds.database_url
  sensitive   = true
}

# ========================================
# Redis Outputs
# ========================================

output "redis_endpoint" {
  description = "ElastiCache Redis endpoint"
  value       = module.redis.redis_endpoint
  sensitive   = true
}

output "redis_port" {
  description = "ElastiCache Redis port"
  value       = module.redis.redis_port
}

# ========================================
# S3 Outputs
# ========================================

output "s3_bucket_uploads" {
  description = "S3 bucket name for uploads"
  value       = module.s3.bucket_names["uploads"]
}

output "s3_bucket_backups" {
  description = "S3 bucket name for backups"
  value       = module.s3.bucket_names["backups"]
}

output "s3_bucket_logs" {
  description = "S3 bucket name for logs"
  value       = module.s3.bucket_names["logs"]
}

output "s3_bucket_admin_frontend" {
  description = "S3 bucket name for admin frontend"
  value       = module.s3.bucket_names["admin_frontend"]
}

output "s3_bucket_admin_website_endpoint" {
  description = "S3 website endpoint for admin frontend"
  value       = module.s3.website_endpoints["admin_frontend"]
}

# ========================================
# ECR Outputs
# ========================================

output "ecr_repository_urls" {
  description = "ECR repository URLs"
  value       = module.ecr.repository_urls
}

output "ecr_backend_url" {
  description = "Backend ECR repository URL"
  value       = module.ecr.repository_urls[0]
}

output "ecr_ai_service_url" {
  description = "AI Service ECR repository URL"
  value       = module.ecr.repository_urls[1]
}

# ========================================
# ECS Outputs
# ========================================

output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = module.ecs.cluster_name
}

output "ecs_cluster_arn" {
  description = "ECS cluster ARN"
  value       = module.ecs.cluster_arn
}

output "backend_service_name" {
  description = "Backend ECS service name"
  value       = module.ecs.backend_service_name
}

output "ai_service_name" {
  description = "AI ECS service name"
  value       = module.ecs.ai_service_name
}

# ========================================
# ALB Outputs
# ========================================

output "alb_dns_name" {
  description = "Application Load Balancer DNS name"
  value       = module.alb.alb_dns_name
}

output "alb_arn" {
  description = "Application Load Balancer ARN"
  value       = module.alb.alb_arn
}

output "alb_zone_id" {
  description = "ALB Route 53 zone ID"
  value       = module.alb.alb_zone_id
}

# ========================================
# CloudFront Outputs
# ========================================

output "cloudfront_api_domain" {
  description = "CloudFront distribution domain for API"
  value       = module.cloudfront.api_distribution_domain
}

output "cloudfront_admin_domain" {
  description = "CloudFront distribution domain for admin"
  value       = module.cloudfront.admin_distribution_domain
}

output "cloudfront_api_id" {
  description = "CloudFront distribution ID for API"
  value       = module.cloudfront.api_distribution_id
}

output "cloudfront_admin_id" {
  description = "CloudFront distribution ID for admin"
  value       = module.cloudfront.admin_distribution_id
}

# ========================================
# Route 53 Outputs
# ========================================

output "route53_zone_id" {
  description = "Route 53 hosted zone ID"
  value       = module.route53.zone_id
}

output "route53_name_servers" {
  description = "Route 53 name servers"
  value       = module.route53.name_servers
}

# ========================================
# Secrets Manager Outputs
# ========================================

output "jwt_secret_arn" {
  description = "JWT secret ARN in Secrets Manager"
  value       = aws_secretsmanager_secret.jwt_secret.arn
}

output "jwt_refresh_secret_arn" {
  description = "JWT refresh secret ARN in Secrets Manager"
  value       = aws_secretsmanager_secret.jwt_refresh_secret.arn
}

output "database_credentials_arn" {
  description = "Database credentials ARN in Secrets Manager"
  value       = aws_secretsmanager_secret.database_credentials.arn
}

# ========================================
# CloudWatch Outputs
# ========================================

output "cloudwatch_log_group_backend" {
  description = "CloudWatch log group for backend"
  value       = aws_cloudwatch_log_group.backend.name
}

output "cloudwatch_log_group_ai_service" {
  description = "CloudWatch log group for AI service"
  value       = aws_cloudwatch_log_group.ai_service.name
}

# ========================================
# Summary Outputs
# ========================================

output "deployment_summary" {
  description = "Deployment summary with all important URLs"
  value = <<-EOT
  
  ========================================
  LearnApp Platform Deployment Summary
  ========================================
  
  API Endpoint:      https://api.${var.domain_name}
  Admin Dashboard:   https://admin.${var.domain_name}
  
  Database Endpoint: ${module.rds.db_instance_endpoint}
  Redis Endpoint:    ${module.redis.redis_endpoint}
  
  ECR Backend:       ${module.ecr.repository_urls[0]}
  ECR AI Service:    ${module.ecr.repository_urls[1]}
  
  S3 Uploads:        ${module.s3.bucket_names["uploads"]}
  S3 Backups:        ${module.s3.bucket_names["backups"]}
  
  ECS Cluster:       ${module.ecs.cluster_name}
  Backend Service:   ${module.ecs.backend_service_name}
  
  CloudWatch Logs:   
    - ${aws_cloudwatch_log_group.backend.name}
    - ${aws_cloudwatch_log_group.ai_service.name}
  
  Next Steps:
  1. Update Route 53 name servers at your domain registrar
  2. Run database migrations: npx prisma migrate deploy
  3. Seed initial data: npm run db:seed
  4. Test API: curl https://api.${var.domain_name}/api/v1/health
  5. Deploy admin dashboard to S3
  6. Configure monitoring alerts
  
  ========================================
  EOT
}

# ========================================
# Environment Variables Output
# ========================================

output "environment_variables" {
  description = "Environment variables for application deployment"
  value = {
    NODE_ENV         = var.environment
    DATABASE_URL     = module.rds.database_url
    REDIS_URL        = module.redis.redis_url
    AWS_REGION       = var.aws_region
    S3_BUCKET_UPLOADS = module.s3.bucket_names["uploads"]
    S3_BUCKET_BACKUPS = module.s3.bucket_names["backups"]
    CLOUDFRONT_API_URL = "https://${module.cloudfront.api_distribution_domain}"
    CLOUDFRONT_ADMIN_URL = "https://${module.cloudfront.admin_distribution_domain}"
  }
  sensitive = true
}

# ========================================
# Connection Strings Output
# ========================================

output "connection_strings" {
  description = "Connection strings for manual testing"
  value = {
    database = "psql '${module.rds.database_url}'"
    redis    = "redis-cli -h ${module.redis.redis_endpoint} -p ${module.redis.redis_port} -a <AUTH_TOKEN>"
  }
  sensitive = true
}
