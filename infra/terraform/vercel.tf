# Attaches the domain to the existing Vercel project. This does NOT create
# the project (pacific-alpaca-website already exists, imported by ID via
# variables.tf) — it only adds the domain + redirect.
resource "vercel_project_domain" "apex" {
  project_id = var.vercel_project_id
  team_id    = var.vercel_team_id
  domain     = var.domain
}

resource "vercel_project_domain" "www" {
  project_id           = var.vercel_project_id
  team_id              = var.vercel_team_id
  domain               = "www.${var.domain}"
  redirect             = var.domain
  redirect_status_code = 308
}
