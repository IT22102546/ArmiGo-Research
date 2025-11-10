# ========================================
# S3 Buckets Module
# ========================================

locals {
  bucket_configs = var.buckets
}

# ========================================
# S3 Buckets
# ========================================

resource "aws_s3_bucket" "buckets" {
  for_each = local.bucket_configs

  bucket = each.value.name

  tags = {
    Name        = each.value.name
    Environment = var.environment
    Purpose     = each.key
  }
}

# ========================================
# Versioning
# ========================================

resource "aws_s3_bucket_versioning" "buckets" {
  for_each = { for k, v in local.bucket_configs : k => v if v.versioning }

  bucket = aws_s3_bucket.buckets[each.key].id

  versioning_configuration {
    status = "Enabled"
  }
}

# ========================================
# Encryption
# ========================================

resource "aws_s3_bucket_server_side_encryption_configuration" "buckets" {
  for_each = local.bucket_configs

  bucket = aws_s3_bucket.buckets[each.key].id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# ========================================
# Public Access Block
# ========================================

resource "aws_s3_bucket_public_access_block" "buckets" {
  for_each = local.bucket_configs

  bucket = aws_s3_bucket.buckets[each.key].id

  block_public_acls       = !lookup(each.value, "website", false)
  block_public_policy     = !lookup(each.value, "website", false)
  ignore_public_acls      = !lookup(each.value, "website", false)
  restrict_public_buckets = !lookup(each.value, "website", false)
}

# ========================================
# Website Configuration
# ========================================

resource "aws_s3_bucket_website_configuration" "buckets" {
  for_each = { for k, v in local.bucket_configs : k => v if lookup(v, "website", false) }

  bucket = aws_s3_bucket.buckets[each.key].id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "index.html"  # For SPA routing
  }
}

# ========================================
# CORS Configuration
# ========================================

resource "aws_s3_bucket_cors_configuration" "buckets" {
  for_each = { for k, v in local.bucket_configs : k => v if contains(["uploads", "admin_frontend"], k) }

  bucket = aws_s3_bucket.buckets[each.key].id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST", "DELETE", "HEAD"]
    allowed_origins = ["*"]  # Restrict in production
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

# ========================================
# Lifecycle Rules
# ========================================

resource "aws_s3_bucket_lifecycle_configuration" "buckets" {
  for_each = { for k, v in local.bucket_configs : k => v if v.lifecycle_rules }

  bucket = aws_s3_bucket.buckets[each.key].id

  rule {
    id     = "transition-to-ia"
    status = "Enabled"

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 90
      storage_class = "GLACIER_IR"
    }
  }

  rule {
    id     = "delete-old-versions"
    status = "Enabled"

    noncurrent_version_expiration {
      noncurrent_days = 90
    }
  }

  rule {
    id     = "delete-incomplete-uploads"
    status = "Enabled"

    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }
}

# ========================================
# Bucket Policies
# ========================================

# CloudFront access for website bucket
resource "aws_s3_bucket_policy" "admin_frontend" {
  for_each = { for k, v in local.bucket_configs : k => v if lookup(v, "website", false) }

  bucket = aws_s3_bucket.buckets[each.key].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "AllowCloudFrontAccess"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.buckets[each.key].arn}/*"
      }
    ]
  })
}
