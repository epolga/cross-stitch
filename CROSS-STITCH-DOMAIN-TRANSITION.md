# Cross‑stitch.com Transition Runbook (Website + Email) — Step by step

**Goal:** transition from `cross-stitch-pattern.net` to `cross-stitch.com` with minimal risk and clear rollback points.  
**Strategy:** do it in phases; keep both domains working in parallel; change one thing at a time.

> ✅ This plan assumes you use **Amazon SES for sending** and you want **Gmail as your inbox** (you currently have no mailbox).

---

## 0) Before you start (10 minutes)

### 0.1 Make a quick “rollback note”
Create a small text note locally with:
- Current Route 53 records for both domains (screenshots are fine)
- Current ALB DNS name
- Current SES identities (domains + sender emails)
- Current “From” email used by the app

### 0.2 Lower DNS TTL (optional but recommended)
If you manage DNS in Route 53, set TTL for the records you will change (A/ALIAS, CNAME, MX, TXT) to **300 seconds** temporarily (5 min).  
Later you can restore to 3600.

---

## Phase 1 — Make `cross-stitch.com` fully working for the website (low risk)

### 1.1 Confirm DNS points to the correct ALB
In DNS for `cross-stitch.com`:

- `cross-stitch.com` → **A (ALIAS)** → `<YOUR-ALB-DNS>`
- `www.cross-stitch.com` → **CNAME** → `<YOUR-ALB-DNS>`

### 1.2 Confirm ACM certificate covers all names
In **ACM (us-east-1)**, confirm the certificate includes:
- `cross-stitch.com`
- `www.cross-stitch.com`
- `cross-stitch-pattern.net`
- `www.cross-stitch-pattern.net`

### 1.3 Confirm ALB HTTPS policy
On the ALB **HTTPS : 443** listener:
- Security policy: `ELBSecurityPolicy-TLS13-1-2-2021-06`

### 1.4 Confirm HTTP → HTTPS redirect
On ALB **HTTP : 80** listener:
- Action: redirect to HTTPS (301)

### 1.5 Confirm the site responds on the new domain
Open in Chrome:
- `https://cross-stitch.com`
- `https://www.cross-stitch.com`

Check:
- Page loads
- No certificate warnings
- Login pages load
- Design pages load

**Rollback:** if something breaks, revert DNS ALIAS/CNAME back to the previous target.

---

## Phase 2 — SEO-safe domain transition (recommended)

### 2.1 Add canonical tags (if not already)
On pages served from `cross-stitch.com`, canonical should point to `cross-stitch.com` versions.

### 2.2 Add 301 redirects (old → new)
Recommended behavior:
- `cross-stitch-pattern.net/*` → `cross-stitch.com/*` (301)
- `www.cross-stitch-pattern.net/*` → `cross-stitch.com/*` (301)
- `www.cross-stitch.com/*` → `cross-stitch.com/*` (301)

Where to implement:
- ALB rules (host-based redirect), or
- Next.js middleware (host redirect logic), or
- Nginx (if you use it)

**Verification:**
- Visit `https://cross-stitch-pattern.net/some-page` → ends at `https://cross-stitch.com/some-page`

**Rollback:** disable redirect rule / revert code deployment.

---

## Phase 3 — Create a Gmail inbox (no DNS risk)

### 3.1 Create a dedicated Gmail account
Example:
- `crossstitch.contact@gmail.com`

Enable:
- 2FA (Google Authenticator)
- Recovery email/phone

---

## Phase 4 — Receiving email for `@cross-stitch.com`

Choose ONE option.

### Option A (cleanest): Google Workspace (paid)
Use this if you want a real mailbox on your domain (best reliability).

High level:
1. Sign up for Google Workspace.
2. Add your domain `cross-stitch.com`.
3. Verify domain (Google gives a TXT record).
4. Set MX records to Google.
5. Create users like `support@cross-stitch.com`.
6. Read mail in Gmail interface (Workspace).

Verify: send a test email to `support@cross-stitch.com`.

### Option B (free): Email forwarding service → Gmail
Use this if you want free aliases like `support@cross-stitch.com` that forward to your Gmail.

High level:
1. In your registrar/DNS provider, enable Email Forwarding.
2. Create aliases:
   - `support@cross-stitch.com` → `crossstitch.contact@gmail.com`
   - `info@cross-stitch.com` → `crossstitch.contact@gmail.com`
3. Add any MX/TXT records the provider requires.

Verify: send a test email to `support@cross-stitch.com` and confirm it arrives in Gmail.

> If you tell me your registrar (Dynadot/other), I can add a click-by-click section specific to it.

---

## Phase 5 — Sending email from `@cross-stitch.com` using Amazon SES (controlled)

Do this only after Phase 4 receiving works.

### 5.1 Verify the domain in SES (us-east-1)
In SES:
1. Add identity: Domain → `cross-stitch.com`
2. SES gives DNS records (DKIM CNAMEs, sometimes TXT).
3. Add them to DNS for `cross-stitch.com`.

### 5.2 Add SPF (TXT)
Add/merge SPF for `cross-stitch.com`:
```
v=spf1 include:amazonses.com -all
```
Important: only ONE SPF TXT record per domain.

### 5.3 Add DMARC (recommended, start in monitoring)
Create `_dmarc.cross-stitch.com` TXT:
```
v=DMARC1; p=none; rua=mailto:dmarc@cross-stitch.com; adkim=s; aspf=s; pct=100
```

### 5.4 Update your application sender
In EB env vars/config:
- `SES_FROM_EMAIL=no-reply@cross-stitch.com` (example)

Deploy.

### 5.5 Test sending
Send test emails to Gmail/Outlook/Yahoo and verify DKIM/SPF pass (Gmail: “Show original”).

Rollback: switch sender back to old domain if needed.

---

## Phase 6 — Keep the old domain alive during transition (recommended)

- Keep receiving on `@cross-stitch-pattern.net` and forward to the same Gmail inbox.
- Keep website redirects and old links working for weeks/months.
- Only remove old email/DNS after you are fully confident.

---

## Final verification checklist

### Website
- [ ] `https://cross-stitch.com` loads
- [ ] `https://www.cross-stitch.com` loads
- [ ] HTTP redirects to HTTPS
- [ ] Old domain redirects to new domain (if enabled)
- [ ] SSL Labs grade A (or A+)

### Email receiving
- [ ] `support@cross-stitch.com` forwards/arrives in Gmail
- [ ] `info@cross-stitch.com` forwards/arrives in Gmail

### Email sending (SES)
- [ ] SES domain verified
- [ ] DKIM passing
- [ ] SPF present (single record)
- [ ] DMARC present (at least p=none)
- [ ] App sends from `@cross-stitch.com`
- [ ] Test emails delivered

---

## Placeholders to fill
- Registrar/DNS provider for `cross-stitch.com`: `<fill>`
- ALB DNS name: `<fill>`
- Primary public contact: `<fill>` (e.g., support@cross-stitch.com)
