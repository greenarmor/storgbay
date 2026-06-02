# Data Breach Notification Procedure

**Storgbay Instance — GDPR Articles 33 & 34**

---

## 1. Definition

A personal data breach is a breach of security leading to the accidental or unlawful destruction, loss, alteration, unauthorised disclosure of, or access to, personal data (Art. 4(12)).

## 2. Detection

### Sources of breach detection

- **Audit logs** — Review the `AuditLog` table for anomalous patterns (e.g., mass downloads, unauthorized admin actions)
- **Infrastructure monitoring** — Server logs, MinIO access logs, database access logs
- **User reports** — Reports of unauthorized access or unexpected data changes
- **Security scanning** — Vulnerability disclosures, dependency alerts (Dependabot)

### Initial assessment (within 1 hour of detection)

Record the following in the breach register:

| Field | Description |
|---|---|
| Date/time discovered | When the breach was first detected |
| Date/time of breach | When the breach actually occurred (if different) |
| Nature of breach | Confidentiality / Integrity / Availability |
| Categories of data affected | User data, files, credentials, etc. |
| Approximate number of data subjects | Number of users affected |
| How detected | Audit log, user report, monitoring, etc. |

## 3. Severity Classification

| Severity | Criteria | Response time |
|---|---|---|
| **Critical** | Personal data exposed, credentials compromised, large-scale | Immediate |
| **High** | Limited personal data exposure, small number of users affected | Within 4 hours |
| **Medium** | No confirmed data exposure but risk exists | Within 24 hours |
| **Low** | Near-miss, no actual breach | Document and review |

## 4. Containment (immediate)

1. **Revoke compromised credentials** — Reset passwords for affected users
2. **Block attack vector** — Rate limit, IP block, or disable compromised endpoint
3. **Preserve evidence** — Export relevant audit logs, server logs, and database snapshots
4. **Assess scope** — Query audit logs for the affected time period and user IDs

## 5. Notification Requirements

### 5.1 Supervisory Authority (Art. 33)

**Timeline:** Within 72 hours of becoming aware of the breach.

Notify the relevant DPA when the breach is likely to result in a **risk to the rights and freedoms** of natural persons.

**Required information:**

- Nature of the breach including categories and approximate numbers of data subjects and records
- Name and contact details of the DPO / contact point
- Likely consequences of the breach
- Measures taken or proposed to address the breach and mitigate effects

**If notification is delayed beyond 72 hours**, include reasons for the delay.

### 5.2 Data Subjects (Art. 34)

**Timeline:** Without undue delay.

Communicate directly to affected data subjects when the breach is likely to result in a **high risk** to their rights and freedoms.

**Required information:**

- Clear, plain-language description of the breach
- Name and contact details of the DPO / contact point
- Likely consequences of the breach
- Measures taken or proposed, including measures to mitigate possible adverse effects
- Advice for data subjects to protect themselves (e.g., change passwords)

**Exceptions** (notification to data subjects not required when):

- Appropriate technical measures (e.g., encryption) rendered data unintelligible
- Subsequent measures ensure high risk no longer likely
- Disproportionate effort (use public communication instead)

## 6. Notification Template

### Authority notification template

```
Subject: Data Breach Notification — Storgbay Instance

1. Controller: [Instance operator name and contact]
2. DPO / Contact: [Email, phone]
3. Date/time of breach: [Date/time]
4. Date/time discovered: [Date/time]
5. Nature of breach: [Description]
6. Categories of data subjects: [e.g., registered users]
7. Categories of personal data: [e.g., email addresses, filenames]
8. Approximate number of data subjects: [Number]
9. Approximate number of records: [Number]
10. Likely consequences: [Description]
11. Measures taken: [Description]
```

### Data subject notification template

```
Subject: Important Security Notice — Action May Be Required

We are writing to inform you of a security incident affecting your account on [instance name].

What happened: [Plain-language description]
What data was affected: [e.g., "Your email address and uploaded file names"]
What we are doing: [Description of containment and remediation steps]
What you should do: [e.g., "We recommend changing your password"]

For questions, contact: [Email address]
```

## 7. Post-Incident Review

Within 2 weeks of resolution:

- [ ] Document root cause analysis
- [ ] Identify preventive measures
- [ ] Update security controls if needed
- [ ] Update this procedure if gaps were found
- [ ] Review audit log coverage for gaps
- [ ] Update ROPA if processing activities changed

## 8. Breach Register

All breaches (including near-misses) must be documented regardless of whether notification was required.

| Breach # | Date | Severity | Notification to authority? | Notification to data subjects? | Resolution date |
|---|---|---|---|---|---|
| [001] | [Date] | [Severity] | [Yes/No + date] | [Yes/No + date] | [Date] |

---

## 9. Responsible Persons

| Role | Name | Contact |
|---|---|---|
| Instance operator | [Name] | [Email] |
| Data Protection Officer | [Name or N/A] | [Email] |
| Technical lead | [Name] | [Email] |

*This procedure should be reviewed annually or after any incident.*
