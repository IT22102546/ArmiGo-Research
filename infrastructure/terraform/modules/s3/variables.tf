variable "environment" {
  description = "Environment name"
  type        = string
}

variable "buckets" {
  description = "Map of bucket configurations"
  type = map(object({
    name            = string
    versioning      = bool
    lifecycle_rules = bool
    website         = optional(bool, false)
  }))
}
