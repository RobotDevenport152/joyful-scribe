# Security Policy

Pacific Alpacas processes customer payments (via Stripe) and personal data (orders, accounts, grower records). If you've found a vulnerability, please report it privately rather than opening a public issue.

## Reporting a Vulnerability

Email **jjun712@aucklanduni.ac.nz** with:

- A description of the vulnerability and its potential impact
- Steps to reproduce (proof-of-concept code or requests are welcome)
- Any affected URLs, endpoints, or files

We aim to acknowledge reports within 5 business days. Please give us a reasonable window to investigate and ship a fix before any public disclosure.

## Scope

In scope: the production storefront at pacificalpaca.com, its Supabase backend (database access control, Edge Functions), and the Vercel-hosted frontend.

Out of scope: third-party services we integrate with (Stripe, Supabase, Vercel, Resend, Twilio) — please report those directly to the provider.

## Supported Versions

This is a continuously-deployed application, not a versioned library — the version running at pacificalpaca.com is always the one in scope.
