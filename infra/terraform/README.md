# Cloudflare + Vercel infrastructure

Puts Cloudflare in front of the Vercel deployment for `pacificalpaca.com`
(singular — **not** `pacificalpacas.com`, a separate legacy domain still
running the old WordPress site with its own real email; brand confirmed
`pacificalpaca.com`, registered at Alibaba Cloud/万网, is the real one).
Vercel and Supabase stay exactly as they are; this only adds a proxy layer.

## Status as of 2026-07-15: applied, waiting on the nameserver cutover

Everything in this module has already been run against the real Cloudflare
and Vercel accounts — the zone, DNS records (including `pacificalpaca.com`'s
real NetEase/163 email, preserved so it doesn't break), Resend verification
records, bot protection, and rate limiting all exist in Cloudflare right
now. The one remaining step is nameservers, and it needs registrar access
this environment doesn't have — see "Finish the cutover" below.

If you're re-running this from scratch (new machine, lost `terraform.tfstate`),
the account-access steps below still apply.

## Before you touch this

**Does the domain you're pointing here currently send/receive email, or
have any other DNS records (MX, TXT/SPF, DKIM, existing subdomains)?**
Moving a domain's nameservers to Cloudflare replaces the entire zone —
anything not recreated in Cloudflare will silently break (email stops
arriving, SPF/DKIM fails, etc). `cloudflare.tf` already recreates
`pacificalpaca.com`'s known email records (163.com MX + SPF) — if you're
adapting this for a different domain, check its existing records first
(`dig MX/TXT <domain>` or query `https://cloudflare-dns.com/dns-query`)
and add matching resources before applying. This is the one genuinely
hard-to-reverse step in this whole setup — a near-miss happened on the
first attempt (pacificalpacas.com's WordPress DNS was briefly replaced
before being fully reverted).

## One-time setup (you — these need account access I don't have)

1. **Cloudflare account**: sign up at cloudflare.com if you don't have one.
   Grab your Account ID from the dashboard sidebar.
2. **API tokens**:
   - Cloudflare: My Profile → API Tokens → Create Token → Custom Token →
     add permissions `Account`/`Zone`/`Edit` (needed to create the zone
     itself), `Zone`/`DNS`/`Edit`, `Zone`/`Zone Settings`/`Edit`,
     `Zone`/`Firewall Services`/`Edit` — Zone Resources: "All zones from
     an account" (the zone doesn't exist yet, so you can't scope to it).
   - Vercel: Account Settings → Tokens → Create Token, scoped to the team
     that owns the `pacific-alpaca-website` project.
3. Copy `terraform.tfvars.example` → `terraform.tfvars`, fill in both tokens
   and your Cloudflare account ID. This file is gitignored — never commit it.

## Apply

```bash
cd infra/terraform
terraform init
terraform plan    # read this before applying anything
terraform apply
```

Cloudflare's Free plan rejects a few things that look reasonable in the
config but aren't available on Free — found only by actually running
apply, not from docs: Bot Fight Mode requires `enable_js = true` alongside
it; the Managed WAF ruleset needs a paid plan (not included here); rate
limit `period` and `mitigation_timeout` must both be exactly `10` (not
`60`/`600`). If you're on Pro or higher and want the stronger settings,
that's a deliberate downgrade to fit Free — revisit it.

## Finish the cutover (you — registrar access I don't have)

The real nameservers Cloudflare assigned this zone are:
```
aarav.ns.cloudflare.com
lorna.ns.cloudflare.com
```
(confirm with `terraform output cloudflare_nameservers` if state may have
changed since this was written).

1. Log into the Alibaba Cloud/万网 console (dc.godaddy.com or wherever the
   registrar for this exact domain is — **check**, don't assume; the
   pacificalpacas.com/pacificalpaca.com mixup this session happened
   because two similarly-named domains have different registrars).
2. Replace the current nameservers (`dns19.hichina.com` /
   `dns20.hichina.com` for pacificalpaca.com specifically) with the two
   above.
3. Wait for propagation (usually under an hour, can take up to 24h). Check
   with `dig NS pacificalpaca.com`, or `terraform apply` again — the
   zone's `status` output flips from `pending` to `active`.
4. Once active, visit `https://pacificalpaca.com` and confirm it loads
   the site with a valid cert (padlock, not a warning). Check
   `https://www.pacificalpaca.com` redirects to the apex.
5. Trigger Resend verification (it doesn't auto-poll): `curl -X POST
   https://api.resend.com/domains/21f73e4f-57e2-46a7-810f-96716c766d50/verify
   -H "Authorization: Bearer $RESEND_API_KEY"`, or click **Verify DNS
   Records** at resend.com/domains. Once it flips to `verified`, update
   `DEFAULT_FROM` in `supabase/functions/bright-task/index.ts` from
   `onboarding@resend.dev` to a `@pacificalpaca.com` address and redeploy
   — the shared test sender no longer applies.

## After this is live

- Don't hand-edit DNS/WAF/SSL settings in the Cloudflare dashboard —
  `terraform plan` will detect the drift and try to revert it. Change things
  here, in a PR, so the config stays the source of truth.
- State lives remotely in a Cloudflare R2 bucket (`pacific-alpaca-terraform-state`,
  S3-compatible backend, configured 2026-07-16). To work with this on a new
  machine: copy `backend.hcl.example` to `backend.hcl` (gitignored — put
  the R2 API token's Access Key ID / Secret Access Key in there, from
  R2 → Manage R2 API Tokens in the Cloudflare dashboard), then run
  `terraform init -backend-config=backend.hcl`. No local `terraform.tfstate`
  file is authoritative anymore; if one exists locally from before this
  migration, it's stale — don't `apply` against it.
- This backend has no state locking configured (R2 has no DynamoDB
  equivalent, and the Terraform version in use here predates the S3
  backend's native `use_lockfile` support, added in 1.10). Fine for a
  single operator; if a second person starts running `apply` against
  this, upgrade Terraform to 1.10+ and add `use_lockfile = true` to
  `backend.hcl` first, or applies can race and corrupt state.
- The rate-limit numbers in `cloudflare.tf` are a starting guess
  constrained by the Free plan, not measured against real traffic —
  revisit once you know real admin-panel usage patterns or upgrade to Pro.
