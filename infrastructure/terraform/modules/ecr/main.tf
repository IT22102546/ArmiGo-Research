# ========================================
# ECR Repositories Module
# ========================================

resource "aws_ecr_repository" "repositories" {
  count = length(var.repositories)

  name                 = var.repositories[count.index]
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = {
    Name        = var.repositories[count.index]
    Environment = var.environment
  }
}

# ========================================
# Lifecycle Policy
# ========================================

resource "aws_ecr_lifecycle_policy" "repositories" {
  count = length(var.repositories)

  repository = aws_ecr_repository.repositories[count.index].name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last 10 images"
        selection = {
          tagStatus     = "tagged"
          tagPrefixList = ["v"]
          countType     = "imageCountMoreThan"
          countNumber   = 10
        }
        action = {
          type = "expire"
        }
      },
      {
        rulePriority = 2
        description  = "Delete untagged images older than 7 days"
        selection = {
          tagStatus   = "untagged"
          countType   = "sinceImagePushed"
          countUnit   = "days"
          countNumber = 7
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}
