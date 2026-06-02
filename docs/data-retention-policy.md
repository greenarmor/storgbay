# Data Retention Policy

**Storgbay Instance — GDPR Article 5(1)(e)**

---

## 1. Purpose

This policy defines how long personal data is retained and the mechanisms for automated deletion, ensuring compliance with GDPR's storage limitation principle.

## 2. Retention Periods

| Data Category | Retention Period | Justification (Legal Basis) | Deletion Mechanism |
|---|---|---|---|
| **User account data** (name, email, role) | Until account deletion + 30 days | Art. 6(1)(b) — Contract performance | User-initiated account deletion or admin removal. Orphaned records purged by cron. |
| **Password hashes** | Until account deletion | Art. 6(1)(b) — Contract performance | Deleted with user record (cascade) |
| **Uploaded files** | Until user deletes file or account | Art. 6(1)(b) — Contract performance | User-initiated deletion or cascade on account deletion. S3 objects deleted. |
| **File metadata** (filename, size, mime, checksum) | Until file deletion | Art. 6(1)(b) — Contract performance | Cascade on file or account deletion |
| **Gallery data** (title, description, visibility) | Until gallery deletion or account deletion | Art. 6(1)(b) — Contract performance | User-initiated or cascade on account deletion |
| **Gallery memberships** (GalleryManager) | Until removal or account deletion | Art. 6(1)(b) — Contract performance | Cascade on user or gallery deletion |
| **Audit logs** | 12 months from creation | Art. 6(1)(f) — Legitimate interest (security) | Automated cron job (`/api/cron/retention`) deletes logs older than 365 days |
| **Share links** | Until expiry + 30 days | Art. 6(1)(b) — Contract performance | Automated cron job deletes expired shares after 30 days |
| **Session tokens** | 12 hours from creation | Art. 6(1)(b) — Contract performance | Session maxAge expiry |
| **Consent records** | Until account deletion | Art. 7(1) — Consent documentation | Cascade on account deletion |
| **IP addresses** (audit logs only) | 12 months (with audit log) | Art. 6(1)(f) — Security | Purged with associated audit log entry |

## 3. Automated Deletion

The `/api/cron/retention` endpoint (secured with `CRON_SECRET`) performs the following cleanup:

- **Audit logs:** Deletes all entries older than 365 days
- **Expired share links:** Deletes share links that expired more than 30 days ago

This endpoint should be called via a scheduled job (cron) at least once per day.

### Example cron configuration

```bash
0 3 * * * curl -X POST -H "Authorization: Bearer $CRON_SECRET" https://your-instance.com/api/cron/retention
```

## 4. User-Initiated Deletion

### Right to Erasure (Art. 17)

Users can delete their account via Account Settings → Delete Account, which:

1. Requires password confirmation
2. Deletes all files from S3 object storage
3. Deletes the user record (cascade deletes all related data)
4. Records an audit entry before deletion

### Data Export Before Deletion (Art. 20)

Users are encouraged to export their data before deletion via Account Settings → Download my data.

## 5. Exceptions

Data may be retained beyond the standard period if:

- Required by EU or Member State law (e.g., financial records, legal hold)
- Necessary for the establishment, exercise, or defence of legal claims
- The data subject has consented to extended retention

All exceptions must be documented with justification.

## 6. Review

This policy should be reviewed:

- Quarterly
- After any change in processing activities
- After any data breach incident
- When new legal requirements are introduced

---

## Review History

| Date | Reviewer | Changes |
|---|---|---|
| [Date] | [Name] | Initial policy created |

*Next review due: [Date + 3 months]*
