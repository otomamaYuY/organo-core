# Cloudflare Security Guide — organo-core

## Architecture Overview
- Pure static SPA (Single Page Application) deployed on Cloudflare Pages
- No server-side code, no API routes, no database, no external API calls
- All data is stored client-side in localStorage
- Built with Vite, served as static HTML/CSS/JS files

## DoS/DDoS Risk Assessment
- **Risk level: Minimal**
- Cloudflare Pages serves static assets from its global CDN. There is no origin server to overwhelm.
- Bandwidth is unlimited on the Cloudflare Pages free tier.
- Cloudflare's built-in DDoS protection is enabled automatically on all plans — no configuration needed.

## Cloudflare Dashboard Recommended Settings

### DDoS Protection (Enabled by Default)
- Navigate to: Security > DDoS
- Layer 7 DDoS protection is automatically enabled
- No custom rules needed for static sites

### WAF (Web Application Firewall)
- Navigate to: Security > WAF
- For static sites, WAF rules are generally not needed
- If API endpoints are added later (e.g., via Cloudflare Workers), enable OWASP managed rules

### Rate Limiting
- Not applicable for pure static site hosting
- If Workers/Functions are added later:
  1. Navigate to: Security > WAF > Rate limiting rules
  2. Create a rule: "If URI Path contains /api/, then Rate Limit with threshold 100 requests per 10 seconds"
  3. Action: Block for 60 seconds

### Billing Alerts
1. Navigate to: Manage Account > Billing
2. Click "Set up alerts"
3. Create alert for:
   - Pages: usage approaching plan limits
   - Workers (if used later): request count threshold
4. Set notification email to your admin address
5. Recommended thresholds:
   - Workers: Alert at 80% of free tier (80,000 requests/day)

## Content Security Policy (CSP)

Create `public/_headers` file to add security headers:

```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
```

Note: A full CSP header with script-src is complex for Vite apps due to dynamically generated chunk names. The above headers provide baseline security without breaking the app.

## localStorage Security Notes
- All chart data is stored in the browser's localStorage
- localStorage is accessible to any JavaScript running on the same origin
- Data is NOT encrypted at rest
- Since the app loads no third-party scripts and has no user-generated content that could execute JS, this is acceptable for the current use case
- If sensitive organizational data is stored, consider:
  - Adding client-side encryption (e.g., Web Crypto API)
  - Warning users not to store confidential information

## Future Considerations
- If Cloudflare Workers or Functions are added:
  - Implement rate limiting (see above)
  - Add API authentication
  - Monitor usage via Workers Analytics
- If user authentication is added:
  - Use Cloudflare Access or a third-party auth provider
  - Never store auth tokens in localStorage (use httpOnly cookies)
- For production enterprise deployment:
  - Consider Cloudflare Pro plan for advanced WAF rules
  - Enable Bot Management
  - Set up Cloudflare Tunnel if connecting to internal services
