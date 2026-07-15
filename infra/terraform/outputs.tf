output "cloudflare_nameservers" {
  description = "Set these at your domain registrar to complete the Cloudflare cutover."
  value       = cloudflare_zone.this.name_servers
}

output "zone_status" {
  description = "Will show \"pending\" until the registrar nameservers above are updated and propagate."
  value       = cloudflare_zone.this.status
}

output "resend_domain_id" {
  description = "Resend domain id for pacificalpaca.com (registered via API on 2026-07-15) — once the zone is active, trigger verification with: curl -X POST https://api.resend.com/domains/21f73e4f-57e2-46a7-810f-96716c766d50/verify -H \"Authorization: Bearer $RESEND_API_KEY\", or click Verify DNS Records at resend.com/domains."
  value       = "21f73e4f-57e2-46a7-810f-96716c766d50"
}
