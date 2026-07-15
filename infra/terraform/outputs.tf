output "cloudflare_nameservers" {
  description = "Set these at your domain registrar to complete the Cloudflare cutover."
  value       = cloudflare_zone.this.name_servers
}

output "zone_status" {
  description = "Will show \"pending\" until the registrar nameservers above are updated and propagate."
  value       = cloudflare_zone.this.status
}

output "resend_domain_id" {
  description = "Resend domain id (already registered via API on 2026-07-15) — once the zone is active, trigger verification with: curl -X POST https://api.resend.com/domains/039f091b-841c-49a5-8447-ae07f72372c7/verify -H \"Authorization: Bearer $RESEND_API_KEY\", or click Verify DNS Records at resend.com/domains."
  value       = "039f091b-841c-49a5-8447-ae07f72372c7"
}
