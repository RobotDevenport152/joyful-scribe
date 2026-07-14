output "cloudflare_nameservers" {
  description = "Set these at your domain registrar to complete the Cloudflare cutover."
  value       = cloudflare_zone.this.name_servers
}

output "zone_status" {
  description = "Will show \"pending\" until the registrar nameservers above are updated and propagate."
  value       = cloudflare_zone.this.status
}
