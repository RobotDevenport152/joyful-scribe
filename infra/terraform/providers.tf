terraform {
  required_version = ">= 1.6.0"

  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
    vercel = {
      source  = "vercel/vercel"
      version = "~> 1.0"
    }
  }

  # State is not configured to a remote backend yet — this runs with local
  # state by default. Before a second person touches this, move to a remote
  # backend (Terraform Cloud, or an S3/R2 bucket) so state isn't only on one
  # laptop.
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

provider "vercel" {
  api_token = var.vercel_api_token
  team      = var.vercel_team_id
}
