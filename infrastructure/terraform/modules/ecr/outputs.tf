output "repository_urls" {
  description = "ECR repository URLs"
  value       = aws_ecr_repository.repositories[*].repository_url
}

output "repository_arns" {
  description = "ECR repository ARNs"
  value       = aws_ecr_repository.repositories[*].arn
}

output "repository_names" {
  description = "ECR repository names"
  value       = aws_ecr_repository.repositories[*].name
}
