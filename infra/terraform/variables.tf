variable "cloudflare_api_token" {
  description = "Cloudflare API token scoped to Zone:DNS:Edit, Zone:Zone Settings:Edit, Zone:Firewall Services:Edit for pacificalpacas.com only."
  type        = string
  sensitive   = true
}

variable "cloudflare_account_id" {
  description = "Cloudflare account ID (dashboard → Overview, right sidebar)."
  type        = string
}

variable "vercel_api_token" {
  description = "Vercel API token (Account Settings → Tokens)."
  type        = string
  sensitive   = true
}

variable "vercel_team_id" {
  description = "Vercel team ID — matches orgId in .vercel/project.json."
  type        = string
  default     = "team_F1dXYNG6H7HNPP4OB6Rm5SJD"
}

variable "vercel_project_id" {
  description = "Vercel project ID — matches projectId in .vercel/project.json."
  type        = string
  default     = "prj_h9qpJHQT6IQFkciPKDrktOS1IknA"
}

variable "domain" {
  description = "Apex domain."
  type        = string
  default     = "pacificalpacas.com"
}
