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

  # Remote state in a Cloudflare R2 bucket (S3-compatible), so state isn't
  # only on one laptop. Left empty here deliberately -- bucket name,
  # endpoint, and credentials live in backend.hcl (gitignored, not this
  # file) and get passed at init time:
  #   terraform init -backend-config=backend.hcl
  # See backend.hcl.example for the template.
  backend "s3" {}
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

provider "vercel" {
  api_token = var.vercel_api_token
  team      = var.vercel_team_id
}
