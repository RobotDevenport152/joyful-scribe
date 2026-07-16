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

# Enables DNSSEC on Cloudflare's side only. This is NOT sufficient by
# itself -- the registrar (Aliyun/万网, the same console the nameservers
# were changed in) also needs the resulting DS record added, same
# two-step shape as the earlier nameserver cutover. Check
# `terraform output dnssec_ds_record` after apply and add it there.
# Until that DS record is added, `status` here will show "pending".
resource "cloudflare_zone_dnssec" "this" {
  zone_id = cloudflare_zone.this.id
}

# pacificalpaca.com's email moved off NetEase/163 (paid, cumbersome to set
# up) to Cloudflare Email Routing (free) forwarding to a Gmail inbox
# (2026-07-16, at the user's request). Cloudflare manages the MX/routing
# TXT records itself once email_routing_settings.enabled = true -- do not
# declare those as cloudflare_record resources, they're not ours to own.
#
# cloudflare_email_routing_address creates the destination and triggers a
# verification email to it -- Cloudflare won't actually forward anything
# until a human clicks the link in that email. Check
# `terraform output email_routing_destination_verified` after apply; if
# it's null, go verify it.
resource "cloudflare_email_routing_settings" "this" {
  zone_id = cloudflare_zone.this.id
  enabled = true
}

resource "cloudflare_email_routing_address" "gmail" {
  account_id = var.cloudflare_account_id
  email      = var.email_routing_destination
}

# The catch-all rule itself is NOT managed here as
# cloudflare_email_routing_catch_all, deliberately: creating it via this
# token/API hit a persistent, unresolved "Authentication error (10000)" on
# every read/write to /zones/{id}/email/routing/rules* despite the token
# having every zone/account permission that seemed relevant (confirmed via
# research this is a known, undocumented gap in Cloudflare's own token
# permission system -- see cloudflare/terraform-provider-cloudflare#6616,
# another user hitting the identical symptom with no resolution). Worked
# around by creating the rule by hand in the dashboard (Email > Email
# Routing > Routing Rules > catch-all -> forward to
# var.email_routing_destination) instead. Then found
# cloudflare_email_routing_catch_all doesn't support `terraform import`
# at all ("resource ... doesn't support import"), so it can't be brought
# under Terraform's management after the fact either -- it's permanently
# dashboard-managed unless Cloudflare's provider or token permissions
# change. If this ever needs recreating (e.g. the zone is rebuilt), redo
# it by hand in the dashboard, not via this file.

# NOT managed as a cloudflare_record resource here, deliberately: enabling
# email_routing_settings above makes Cloudflare auto-create and own an SPF
# TXT record at the apex (`include:_spf.mx.cloudflare.net`). A second,
# Terraform-managed SPF record for Google (so Gmail's Send-As feature can
# send "as" info@pacificalpaca.com) collided with it -- SPF only allows one
# record per name, so Cloudflare locked the zone's Email Routing Rules API
# entirely (`status: misconfigured/locked`, `spf.multiple`) and every rule
# read/write 401'd with a misleading generic "Authentication error" until
# this was found and fixed (2026-07-16). Fix: deleted the Terraform-owned
# duplicate and merged `include:_spf.google.com` into Cloudflare's own
# record by hand via the API. If that record is ever recreated (e.g.
# email_routing_settings gets destroyed/recreated), re-merge the Google
# include manually -- do not add a second cloudflare_record TXT resource
# for SPF at "@" again.

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
#
# HSTS max_age is 1 year, include_subdomains on (www already redirects to
# apex over HTTPS via vercel_project_domain.www, so this doesn't break
# anything) -- preload deliberately left off/unset. Preload submits the
# domain to browsers' built-in HSTS list, which is effectively
# irreversible on any practical timescale (removal takes months and only
# works if every browser vendor's preload list has already shipped the
# removal) -- not worth that commitment for a domain that's still
# actively being reconfigured. Revisit once the site's HTTPS setup has
# been stable for a while.
#
# minify was tried here too (html/css/js on) but Cloudflare rejected it
# via Terraform ("Invalid value for zone setting minify (1007)") and,
# tested directly against the raw API, silently no-ops instead of
# erroring -- classic Auto Minify appears to be retired/unavailable for
# this account, not something wrong with this config. Not worth chasing
# further: Vite's own build output is already minified, so there's
# nothing real being missed here.
resource "cloudflare_zone_settings_override" "this" {
  zone_id = cloudflare_zone.this.id
  settings {
    ssl                      = "strict" # this is Cloudflare's "Full (strict)" mode
    always_use_https         = "on"
    min_tls_version          = "1.2"
    automatic_https_rewrites = "on"

    security_header {
      enabled            = true
      max_age            = 31536000
      include_subdomains = true
      nosniff            = true
      preload            = false
    }
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
# these don't conflict with the apex-level SPF record (now Cloudflare's
# own auto-managed record, merged with Google's include -- see the note
# near cloudflare_email_routing_settings above).
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

# DMARC in monitoring mode (p=none) -- reports on SPF/DKIM alignment
# without rejecting or quarantining anything, so it can't break mail that
# passed before this existed. The domain now sends via 3 different
# mechanisms (Resend for transactional email, Google/Gmail for Send-As
# replies, Cloudflare Email Routing for inbound) so alignment is worth
# watching before tightening to p=quarantine or p=reject. rua= is the
# aggregate-report destination -- pointed at the same Gmail inbox
# everything else forwards to; revisit the policy once a few weeks of
# reports show no unexpected failures.
resource "cloudflare_record" "dmarc" {
  zone_id = cloudflare_zone.this.id
  name    = "_dmarc"
  type    = "TXT"
  content = "v=DMARC1; p=none; rua=mailto:${var.email_routing_destination}; fo=1"
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
