# ========================================
# Terraform Variables
# ========================================

# ========================================
# General Configuration
# ========================================

variable "project_name" {
  description = "Project name to be used in resource naming"
  type        = string
  default     = "learnup"
}

variable "environment" {
  description = "Environment name (dev, staging, production)"
  type        = string
  default     = "production"
  
  validation {
    condition     = contains(["dev", "staging", "production"], var.environment)
    error_message = "Environment must be dev, staging, or production."
  }
}

variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "us-east-1"
}

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
  # Example: learnup.com
}

# ========================================
# VPC Configuration
# ========================================

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.11.0/24"]
}

variable "database_subnet_cidrs" {
  description = "CIDR blocks for database subnets"
  type        = list(string)
  default     = ["10.0.20.0/24", "10.0.21.0/24"]
}

variable "enable_nat_gateway" {
  description = "Enable NAT Gateway for private subnets"
  type        = bool
  default     = true
}

# ========================================
# RDS Configuration
# ========================================

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "learnup_db"
}

variable "db_username" {
  description = "Database master username"
  type        = string
  default     = "learnup_admin"
  sensitive   = true
}

variable "rds_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.medium"
  
  # Options:
  # - db.t3.micro (2GB RAM, 2 vCPU) - Dev/Test - $25/month
  # - db.t3.small (2GB RAM, 2 vCPU) - Small prod - $50/month
  # - db.t3.medium (4GB RAM, 2 vCPU) - Medium prod - $100/month
  # - db.t3.large (8GB RAM, 2 vCPU) - Large prod - $200/month
}

variable "rds_allocated_storage" {
  description = "Initial storage size in GB"
  type        = number
  default     = 20
}

variable "rds_max_allocated_storage" {
  description = "Maximum storage size for autoscaling in GB"
  type        = number
  default     = 100
}

variable "rds_multi_az" {
  description = "Enable Multi-AZ for RDS (high availability)"
  type        = bool
  default     = true  # Set to false for dev to save costs
}

variable "rds_backup_retention" {
  description = "Number of days to retain backups"
  type        = number
  default     = 7
}

# ========================================
# Redis Configuration
# ========================================

variable "redis_node_type" {
  description = "ElastiCache Redis node type"
  type        = string
  default     = "cache.t3.micro"
  
  # Options:
  # - cache.t3.micro (0.5GB) - Dev/Test - $15/month
  # - cache.t3.small (1.37GB) - Small prod - $30/month
  # - cache.t3.medium (3.09GB) - Medium prod - $60/month
  # - cache.r6g.large (13.07GB) - Large prod - $150/month
}

variable "redis_num_nodes" {
  description = "Number of cache nodes"
  type        = number
  default     = 2  # For cluster mode
}

# ========================================
# ECS Configuration
# ========================================

variable "backend_cpu" {
  description = "CPU units for backend tasks (1024 = 1 vCPU)"
  type        = number
  default     = 512
  
  # Options: 256, 512, 1024, 2048, 4096
}

variable "backend_memory" {
  description = "Memory for backend tasks in MB"
  type        = number
  default     = 1024
  
  # Must be compatible with CPU:
  # 512 CPU: 1024-4096 MB
  # 1024 CPU: 2048-8192 MB
}

variable "backend_min_tasks" {
  description = "Minimum number of backend tasks"
  type        = number
  default     = 2
}

variable "backend_max_tasks" {
  description = "Maximum number of backend tasks"
  type        = number
  default     = 6
}

variable "ai_service_cpu" {
  description = "CPU units for AI service tasks"
  type        = number
  default     = 1024
}

variable "ai_service_memory" {
  description = "Memory for AI service tasks in MB"
  type        = number
  default     = 2048
}

# ========================================
# SSL/TLS Configuration
# ========================================

variable "acm_certificate_arn" {
  description = "ARN of ACM certificate for ALB (same region)"
  type        = string
  default     = ""
  
  # Create certificate in AWS Certificate Manager first:
  # aws acm request-certificate \
  #   --domain-name "*.learnup.com" \
  #   --subject-alternative-names "learnup.com" \
  #   --validation-method DNS
}

variable "acm_certificate_arn_us_east_1" {
  description = "ARN of ACM certificate in us-east-1 for CloudFront"
  type        = string
  default     = ""
  
  # CloudFront requires certificate in us-east-1
}

variable "enable_https" {
  description = "Enable HTTPS on ALB"
  type        = bool
  default     = true
}

# ========================================
# Monitoring Configuration
# ========================================

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 7
  
  # Options: 1, 3, 5, 7, 14, 30, 60, 90, 120, 150, 180, 365, 400, 545, 731, 1827, 3653
}

variable "alarm_email" {
  description = "Email address for CloudWatch alarms"
  type        = string
  default     = "admin@learnup.com"
}

# ========================================
# Security Configuration
# ========================================

variable "enable_waf" {
  description = "Enable AWS WAF for CloudFront"
  type        = bool
  default     = true  # Set to false for dev to save costs
}

variable "allowed_ip_ranges" {
  description = "IP ranges allowed to access admin panel (optional)"
  type        = list(string)
  default     = ["0.0.0.0/0"]  # Allow all, or restrict to office IPs
}

# ========================================
# Cost Optimization
# ========================================

variable "enable_spot_instances" {
  description = "Use Spot instances for ECS tasks (cost savings)"
  type        = bool
  default     = false  # Use for non-critical workloads
}

variable "enable_s3_lifecycle" {
  description = "Enable S3 lifecycle policies for cost optimization"
  type        = bool
  default     = true
}

# ========================================
# Backup Configuration
# ========================================

variable "backup_retention_days" {
  description = "Number of days to retain AWS Backup snapshots"
  type        = number
  default     = 30
}

# ========================================
# Tags
# ========================================

variable "additional_tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default     = {}
}
