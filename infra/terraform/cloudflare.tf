# Creates the Cloudflare zone for pacificalpaca.com (singular -- NOT
# pacificalpacas.com, a separate legacy GoDaddy domain still running the old
# WordPress site; brand confirmed this Alibaba-Cloud-registered domain is
# the real one). Terraform becomes the zone's owner of record here — do NOT
# also click around DNS/WAF settings in the dashboard afterward, or
# `terraform plan` will keep fighting you.
resource "cloudflare_zone" "this" {
  account_id = var.cloudflare_account_id
  zone       = var.domain
  plan       = "free"
}

# pacificalpaca.com's real, currently-active email (NetEase/163 enterprise
# mail) -- confirmed live via public DNS lookup before this zone existed.
# Must be recreated here or switching nameservers to Cloudflare silently
# breaks email, exactly like almost happened with pacificalpacas.com.
resource "cloudflare_record" "mx_163_primary" {
  zone_id  = cloudflare_zone.this.id
  name     = "@"
  type     = "MX"
  content  = "mx.ym.163.com"
  priority = 10
  proxied  = false
  ttl      = 3600
}

resource "cloudflare_record" "mx_163_secondary" {
  zone_id  = cloudflare_zone.this.id
  name     = "@"
  type     = "MX"
  content  = "mx84.dns.com.cn"
  priority = 10
  proxied  = false
  ttl      = 3600
}

resource "cloudflare_record" "spf_163" {
  zone_id = cloudflare_zone.this.id
  name    = "@"
  type    = "TXT"
  content = "v=spf1 include:spf.163.com ~all"
  proxied = false
  ttl     = 3600
}

# Proxied (orange-cloud) records pointing at Vercel. Values are Vercel's
# general targets — run `vercel domains inspect <domain>` after adding the
# domain in Vercel to confirm nothing more specific is recommended for this
# project before applying.
resource "cloudflare_record" "apex" {
  zone_id = cloudflare_zone.this.id
  name    = "@"
  type    = "A"
  content = "76.76.21.21"
  proxied = true
  ttl     = 1 # ignored by Cloudflare when proxied
}

resource "cloudflare_record" "www" {
  zone_id = cloudflare_zone.this.id
  name    = "www"
  type    = "CNAME"
  content = "cname.vercel-dns-0.com"
  proxied = true
  ttl     = 1
}

# Full (strict) is required — Vercel auto-provisions a valid cert, and
# "Flexible" would cause a redirect loop against Vercel's forced HTTPS.
resource "cloudflare_zone_settings_override" "this" {
  zone_id = cloudflare_zone.this.id
  settings {
    ssl                      = "strict" # this is Cloudflare's "Full (strict)" mode
    always_use_https         = "on"
    min_tls_version          = "1.2"
    automatic_https_rewrites = "on"
  }
}

# Bot Fight Mode lives on its own resource, not in zone_settings_override's
# settings block (confirmed via `terraform providers schema` against the
# actual provider version — the settings-block attribute name doesn't
# exist here even though older docs/examples reference it that way).
# enable_js is required alongside fight_mode -- Cloudflare rejected the
# apply with "cannot enable Fight_Mode while EnableJS is disabled" when it
# was left at its (apparently non-`true`) default.
resource "cloudflare_bot_management" "this" {
  zone_id    = cloudflare_zone.this.id
  fight_mode = true
  enable_js  = true
}

# Resend domain verification records — pacificalpaca.com was registered in
# Resend on 2026-07-15 (domain id 21f73e4f-57e2-46a7-810f-96716c766d50,
# region us-east-1) via their API, replacing an earlier registration of
# pacificalpacas.com (deleted -- account plan only allows 1 domain). These
# are the real values Resend assigned, not placeholders. Resend won't mark
# the domain verified until these actually resolve, which only happens once
# the zone above is live — after `terraform apply` + the nameserver
# cutover, check verification status at resend.com/domains (or POST
# /domains/{id}/verify). Scoped to resend._domainkey/send subdomains, so
# these don't conflict with the apex-level 163.com SPF record above.
resource "cloudflare_record" "resend_dkim" {
  zone_id = cloudflare_zone.this.id
  name    = "resend._domainkey"
  type    = "TXT"
  content = "p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCzsJJ9adm1rSnd3oyoBoHdqPIti/ybtvdUnPwrmOMl4jkHuP6FwRTRYy6xtm0Vsc/LA1/ajbN5jIS9WgTH0fXhngCNzc1k6B0yK1rqLr+yWj0rYtEMUgxuczZ54WAfSA9lHXeylsxaEWA+b6L3s8AhLSXa/2DiMc1K7POJs/vIXQIDAQAB"
  proxied = false
  ttl     = 3600
}

resource "cloudflare_record" "resend_spf_mx" {
  zone_id  = cloudflare_zone.this.id
  name     = "send"
  type     = "MX"
  content  = "feedback-smtp.us-east-1.amazonses.com"
  priority = 10
  proxied  = false
  ttl      = 3600
}

resource "cloudflare_record" "resend_spf_txt" {
  zone_id = cloudflare_zone.this.id
  name    = "send"
  type    = "TXT"
  content = "v=spf1 include:amazonses.com ~all"
  proxied = false
  ttl     = 3600
}

# NOTE: Cloudflare's Managed WAF Ruleset (execute-on-all-traffic) requires a
# paid plan -- applying it on this zone's Free plan failed with "not
# entitled to execute this managed ruleset". Bot Fight Mode above and the
# rate limit below are the free-tier protection; upgrade to Pro if the full
# OWASP-style managed ruleset is needed later.

# Light rate limit on the admin surface (login/cert-generation panel).
# Free plan constraints (both hit real errors on apply): period must be
# exactly 10 seconds ("not entitled to use the period 60, can only use a
# period among [10]") and mitigation_timeout must also be exactly 10
# ("not entitled to use a mitigation timeout different from 10") -- so a
# breach only blocks for 10s, not the 10-minute block originally intended.
# Tune once you have real traffic numbers or upgrade to Pro for longer
# blocks; this is a starting guess, not a measured value.
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
      period              = 10
      requests_per_period = 5
      mitigation_timeout  = 10
    }
  }
}
