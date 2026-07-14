# Cloudflare + Vercel infrastructure

Puts Cloudflare in front of the existing Vercel deployment for
`pacificalpacas.com` — WAF, bot protection, and DNS management as code.
Vercel and Supabase stay exactly as they are; this only adds a proxy layer.

## Before you touch this

**Does `pacificalpacas.com` currently send/receive email, or have any other
DNS records (MX, TXT/SPF, DKIM, existing subdomains)?** Moving the domain's
nameservers to Cloudflare replaces the entire zone — anything not
recreated in Cloudflare will silently break (email stops arriving, SPF/DKIM
fails, etc). Before step 2 below, export the current DNS records at your
registrar and we add matching ones here first. If you're not sure, stop and
check before changing nameservers — this is the one genuinely hard-to-reverse
step in this whole setup.

## One-time setup (you — these need account access I don't have)

1. **Cloudflare account**: sign up at cloudflare.com if you don't have one.
   Grab your Account ID from the dashboard sidebar.
2. **API tokens**:
   - Cloudflare: My Profile → API Tokens → Create Token → scope to
     `Zone:DNS:Edit`, `Zone:Zone Settings:Edit`, `Zone:Firewall Services:Edit`,
     restricted to the `pacificalpacas.com` zone (create the zone first via
     step 4 below, or scope to "All zones" temporarily and narrow it after).
   - Vercel: Account Settings → Tokens → Create Token.
3. Copy `terraform.tfvars.example` → `terraform.tfvars`, fill in both tokens
   and your Cloudflare account ID. This file is gitignored — never commit it.

## Apply

```bash
cd infra/terraform
terraform init
terraform plan    # read this before applying anything
terraform apply
```

This creates the Cloudflare zone, the proxied DNS records pointing at
Vercel, WAF + rate-limit rules, and attaches the domain to the Vercel
project. `terraform apply` will print `cloudflare_nameservers` in the
output.

## Finish the cutover (you — registrar access I don't have)

4. Take the two nameservers from the `cloudflare_nameservers` output and
   set them at wherever `pacificalpacas.com` is registered (GoDaddy,
   Namecheap, etc. — replaces whatever nameservers are there now).
5. Wait for propagation (usually under an hour, can take up to 24h). Check
   with `terraform apply` again, or `dig NS pacificalpacas.com` — the zone's
   `status` output flips from `pending` to `active`.
6. Once active, visit `https://pacificalpacas.com` and confirm it loads
   the site with a valid cert (padlock, not a warning). Check
   `https://www.pacificalpacas.com` redirects to the apex.

## After this is live

- Don't hand-edit DNS/WAF/SSL settings in the Cloudflare dashboard —
  `terraform plan` will detect the drift and try to revert it. Change things
  here, in a PR, so the config stays the source of truth.
- State is local only (`terraform.tfstate`, gitignored) — it lives on
  whoever's machine ran `apply`. If anyone else needs to touch this,
  move to a remote backend (Terraform Cloud's free tier, or an R2/S3
  bucket) before they do, or you'll get conflicting state.
- The WAF managed-ruleset ID and rate-limit numbers in `cloudflare.tf` are
  reasonable starting points, not measured against real traffic — revisit
  the rate limit once you know real admin-panel usage patterns.
