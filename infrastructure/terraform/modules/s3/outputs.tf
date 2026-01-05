output "bucket_ids" {
  description = "S3 bucket IDs"
  value       = { for k, v in aws_s3_bucket.buckets : k => v.id }
}

output "bucket_arns" {
  description = "S3 bucket ARNs"
  value       = { for k, v in aws_s3_bucket.buckets : k => v.arn }
}

output "bucket_names" {
  description = "S3 bucket names"
  value       = { for k, v in aws_s3_bucket.buckets : k => v.bucket }
}

output "bucket_regional_domains" {
  description = "S3 bucket regional domain names"
  value       = { for k, v in aws_s3_bucket.buckets : k => v.bucket_regional_domain_name }
}

output "website_endpoints" {
  description = "S3 website endpoints"
  value       = { for k, v in aws_s3_bucket_website_configuration.buckets : k => v.website_endpoint }
}
