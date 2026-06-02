# Data Protection Risk Assessment

**Storgbay Instance — GDPR Article 35**

---

## 1. Assessment Overview

| Field | Value |
|---|---|
| Application | Storgbay — Photo gallery and file storage |
| Assessor | [Name] |
| Assessment date | [Date] |
| Review date | [Date + 12 months] |
| DPIA required? | See Section 4 |

## 2. Risk Register

### 2.1 Data Breach — Unauthorized Access

| Field | Value |
|---|---|
| **Risk ID** | R-001 |
| **Category** | Confidentiality |
| **Likelihood** | Medium |
| **Impact** | Critical |
| **Risk level** | High |
| **Description** | Unauthorized party gains access to user accounts, files, or personal data through credential compromise, session hijacking, or application vulnerability. |
| **Existing controls** | bcrypt hashing (cost 12), HTTP-only Secure cookies, rate limiting, CSRF protection, security headers (HSTS, CSP, X-Frame-Options), JWT session expiry (12h) |
| **Residual risk** | Medium |
| **Further mitigation** | Consider adding 2FA/TOTP for admin accounts; implement account lockout after repeated failed logins |

### 2.2 Data Breach — File Exposure

| Field | Value |
|---|---|
| **Risk ID** | R-002 |
| **Category** | Confidentiality |
| **Likelihood** | Low |
| **Impact** | Critical |
| **Risk level** | Medium |
| **Description** | User-uploaded files (which may contain personal data in images) are exposed to unauthorized users through misconfigured gallery visibility, guessed share links, or S3 misconfiguration. |
| **Existing controls** | Role-based gallery access, presigned URLs with 5-minute expiry, filename sanitization, S3 bucket policies, private default visibility |
| **Residual risk** | Low |
| **Further mitigation** | Rate-limit presigned URL generation; add watermarking for shared content |

### 2.3 Insider Threat — Admin Abuse

| Field | Value |
|---|---|
| **Risk ID** | R-003 |
| **Category** | Confidentiality / Integrity |
| **Likelihood** | Low |
| **Impact** | High |
| **Risk level** | Medium |
| **Description** | Administrator abuses elevated privileges to access or modify user data without authorisation. |
| **Existing controls** | Admin actions logged in audit trail, role separation (USER/UPLOADER/ADMIN), bootstrap admin via environment variable |
| **Residual risk** | Low |
| **Further mitigation** | Implement admin action approval workflow; separate audit log access from admin role |

### 2.4 Data Loss

| Field | Value |
|---|---|
| **Risk ID** | R-004 |
| **Category** | Availability |
| **Likelihood** | Low |
| **Impact** | Critical |
| **Risk level** | Medium |
| **Description** | User data lost due to infrastructure failure, accidental deletion, or ransomware. |
| **Existing controls** | S3 object storage with redundancy, database backups (infrastructure responsibility), cascade deletions require authentication |
| **Residual risk** | Medium |
| **Further mitigation** | Implement automated database backup verification; add S3 versioning; document disaster recovery procedures |

### 2.5 Non-Compliance — Consent Management

| Field | Value |
|---|---|
| **Risk ID** | R-005 |
| **Category** | Compliance |
| **Likelihood** | Medium |
| **Impact** | High |
| **Risk level** | Medium |
| **Description** | Failure to properly obtain, record, or honour user consent for data processing activities. |
| **Existing controls** | Versioned consent records in database, cookie consent banner, privacy policy page, data export/deletion APIs |
| **Residual risk** | Low |
| **Further mitigation** | Add consent re-confirmation on policy version changes; automated compliance reporting |

### 2.6 Data Minimisation Failure

| Field | Value |
|---|---|
| **Risk ID** | R-006 |
| **Category** | Compliance |
| **Likelihood** | Low |
| **Impact** | Medium |
| **Risk level** | Low |
| **Description** | Application collects or retains more personal data than necessary for the stated purposes. |
| **Existing controls** | Minimal data model (no phone, address, DOB), audit log IP addresses purged after 12 months, no analytics/tracking |
| **Residual risk** | Low |
| **Further mitigation** | Periodic review of data fields; consider anonymising audit log IPs after 30 days |

## 3. Threat Matrix Summary

| Threat | Likelihood | Impact | Risk | Status |
|---|---|---|---|---|
| Unauthorized access | Medium | Critical | High | Mitigated to Medium |
| File exposure | Low | Critical | Medium | Mitigated to Low |
| Admin abuse | Low | High | Medium | Mitigated to Low |
| Data loss | Low | Critical | Medium | Needs backup plan |
| Consent non-compliance | Medium | High | Medium | Mitigated to Low |
| Data minimisation | Low | Medium | Low | Acceptable |

## 4. DPIA Determination

A Data Protection Impact Assessment (DPIA) under Article 35 is required when processing is likely to result in **high risk** to the rights and freedoms of natural persons. Criteria:

- [x] Systematic evaluation of personal aspects (audit logging, user management) — **but minimal and security-focused**
- [ ] Large-scale processing of special categories of data — **not applicable**
- [ ] Systematic monitoring of publicly accessible areas — **not applicable**
- [x] Preventing data subjects from exercising rights — **self-service export and deletion mitigate this**

**Assessment:** A full DPIA is recommended but not mandatory, given the self-hosted nature and limited scope. This risk assessment document serves as a lighter-weight alternative.

## 5. Action Items

| Priority | Action | Owner | Due date |
|---|---|---|---|
| High | Document database backup and disaster recovery procedure | [Name] | [Date] |
| Medium | Add 2FA/TOTP option for admin accounts | [Name] | [Date] |
| Medium | Implement account lockout after repeated failed logins | [Name] | [Date] |
| Low | Add automated compliance reporting for consent records | [Name] | [Date] |

---

*This risk assessment should be reviewed annually or after any significant change to processing activities.*
