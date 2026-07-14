# Creates the Cloudflare zone for pacificalpacas.com. Terraform becomes the
# zone's owner of record here — do NOT also click around DNS/WAF settings in
# the dashboard afterward, or `terraform plan` will keep fighting you.
resource "cloudflare_zone" "this" {
  account_id = var.cloudflare_account_id
  zone       = var.domain
  plan       = "free"
}

# Proxied (orange-cloud) records pointing at Vercel. Values are Vercel's
# general targets — run `vercel domains inspect <domain>` after adding the
# domain in Vercel to confirm nothing more specific is recommended for this
# project before applying.
resource "cloudflare_record" "apex" {
  zone_id = cloudflare_zone.this.id
  name    = "@"
  type    = "A"
  value   = "76.76.21.21"
  proxied = true
  ttl     = 1 # ignored by Cloudflare when proxied
}

resource "cloudflare_record" "www" {
  zone_id = cloudflare_zone.this.id
  name    = "www"
  type    = "CNAME"
  value   = "cname.vercel-dns-0.com"
  proxied = true
  ttl     = 1
}

# Full (strict) is required — Vercel auto-provisions a valid cert, and
# "Flexible" would cause a redirect loop against Vercel's forced HTTPS.
resource "cloudflare_zone_settings_override" "this" {
  zone_id = cloudflare_zone.this.id
  settings {
    ssl                      = "full_strict"
    always_use_https         = "on"
    min_tls_version          = "1.2"
    automatic_https_rewrites = "on"
    bot_fight_mode           = "on"
  }
}

# Cloudflare's free Managed Ruleset — baseline WAF coverage (OWASP-style
# rules) without hand-writing individual rules.
resource "cloudflare_ruleset" "waf_managed" {
  zone_id     = cloudflare_zone.this.id
  name        = "Managed WAF"
  description = "Cloudflare Managed Ruleset, execute on incoming requests"
  kind        = "zone"
  phase       = "http_request_firewall_managed"

  rules {
    action = "execute"
    action_parameters {
      id = "efb7b8c949ac4650a09736fc376e9aee" # Cloudflare Managed Ruleset
    }
    expression  = "true"
    description = "Execute Cloudflare Managed Ruleset on all traffic"
    enabled     = true
  }
}

# Light rate limit on the admin surface (login/cert-generation panel) — 30
# requests per minute per IP, block for 10 minutes on breach. Tune once you
# have real traffic numbers; this is a starting guess, not a measured value.
resource "cloudflare_ruleset" "rate_limit_admin" {
  zone_id     = cloudflare_zone.this.id
  name        = "Admin rate limit"
  description = "Throttle /admin against credential-stuffing / scraping"
  kind        = "zone"
  phase       = "http_ratelimit"

  rules {
    action      = "block"
    expression  = "(http.request.uri.path contains \"/admin\")"
    description = "Rate limit /admin"
    enabled     = true

    ratelimit {
      characteristics     = ["cf.colo.id", "ip.src"]
      period              = 60
      requests_per_period = 30
      mitigation_timeout  = 600
    }
  }
}
