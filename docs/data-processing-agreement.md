# Data Processing Agreement (DPA)

**Storgbay Instance — GDPR Article 28**

*This agreement applies when the instance operator (Controller) uses any third-party processors (e.g., cloud hosting, CDN, managed database) to process personal data on their behalf. If all infrastructure is self-hosted with no third-party access, this DPA applies between the instance operator and their own organisation as documentation of processing safeguards.*

---

## 1. Parties

| Role | Details |
|---|---|
| **Data Controller** | [Instance operator name and address] |
| **Data Processor** | [Processor name and address, or "Self-hosted — N/A"] |
| **DPO / Contact** | [Email address] |

## 2. Subject Matter and Duration

- **Subject matter:** Processing of personal data for the operation of the Storgbay photo gallery and file storage application.
- **Duration:** This agreement remains in effect for the duration of the processing relationship and until all personal data has been deleted or returned.
- **Nature of processing:** Storage, organisation, display, and sharing of user-uploaded files and associated metadata.
- **Purpose:** Providing the Storgbay file storage and gallery management service.
- **Categories of data subjects:** Registered users (including administrators and uploaders).
- **Categories of personal data:** Name, email address, hashed password, uploaded file content and metadata, gallery configurations, audit log entries, session tokens.
- **Special categories of data:** None processed by design. Users should not upload special category data.

## 3. Processor Obligations (Art. 28(3))

The Processor shall:

1. **Process only on instructions** — Process personal data only on documented instructions from the Controller, including transfers to third countries, unless required by EU or Member State law.
2. **Confidentiality** — Ensure that persons authorised to process the personal data have committed themselves to confidentiality or are under an appropriate statutory obligation of confidentiality.
3. **Security measures** — Implement the technical and organisational security measures specified in Section 4.
4. **Sub-processing** — Not engage another processor without prior specific or general written authorisation of the Controller. In the case of general written authorisation, the Processor shall inform the Controller of any intended changes concerning the addition or replacement of other processors.
5. **Data subject rights** — Taking into account the nature of the processing, assist the Controller by appropriate technical and organisational measures for the fulfilment of the Controller's obligation to respond to requests for exercising data subject rights.
6. **Assistance** — Assist the Controller in ensuring compliance with obligations under Articles 32 to 36 (security, breach notification, DPIA).
7. **Deletion or return** — At the choice of the Controller, delete or return all personal data to the Controller after the end of the provision of services, and delete existing copies unless EU or Member State law requires storage.
8. **Audit** — Make available to the Controller all information necessary to demonstrate compliance and allow for and contribute to audits, including inspections, conducted by the Controller or an auditor mandated by the Controller.
9. **Immediate notification** — Inform the Controller immediately if, in the Processor's opinion, an instruction infringes applicable data protection law.

## 4. Technical and Organisational Security Measures (Art. 32)

| Measure | Implementation |
|---|---|
| **Encryption in transit** | TLS 1.2+ enforced for all connections (HTTPS) |
| **Encryption at rest** | Optional S3 server-side encryption (SSE-S3/AES256) for file storage; database encryption at rest via infrastructure provider |
| **Access control** | Role-based access (USER, UPLOADER, ADMIN); bcrypt password hashing (cost factor 12) |
| **Authentication** | JWT-based sessions with HTTP-only, Secure, SameSite=Lax cookies; 12-hour session expiry |
| **Audit logging** | All security-relevant actions logged with user ID, action, resource, IP address, and timestamp |
| **Data minimisation** | Only essential data collected; IP addresses not permanently stored in user records |
| **Pseudonymisation** | Files stored with generated keys, not user-facing filenames; presigned URLs with 5-minute expiry |
| **Rate limiting** | Applied to authentication and account management endpoints |
| **Security headers** | HSTS, CSP, X-Frame-Options (DENY), X-Content-Type-Options (nosniff), Referrer-Policy |
| **Data retention** | Automated cron cleanup: audit logs retained 12 months, expired share links removed after 30 days |
| **Vulnerability management** | Dependabot automated dependency scanning; npm audit |
| **Session management** | Force logout on password change; session tokens invalidated on account deletion |

## 5. Data Breach Notification (Art. 33)

The Processor shall notify the Controller without undue delay after becoming aware of a personal data breach, providing:

- Nature of the breach including categories and approximate numbers of data subjects and records
- Name and contact details of the contact point
- Likely consequences of the breach
- Measures taken or proposed to address the breach

**Target notification timeline:** Within 24 hours of discovery.

## 6. Data Subject Rights Assistance

The Processor shall assist the Controller in fulfilling the following data subject rights:

| Right | Art. | Mechanism |
|---|---|---|
| Access | 15 | Data export API (`/api/account/export`) returns all user data in JSON |
| Rectification | 16 | User profile editable at any time |
| Erasure | 17 | Self-service account deletion with file cleanup (`/api/account/delete`) |
| Restriction | 18 | Account suspension available to admins |
| Portability | 20 | Structured JSON export with all personal data |
| Object | 21 | Contact administrator; audit logs purged on account deletion |

## 7. Sub-Processors

| Sub-Processor | Purpose | Location |
|---|---|---|
| [Cloud hosting provider] | Server infrastructure | [Country] |
| [Database provider] | Managed database (if applicable) | [Country] |
| [Object storage provider] | File storage (MinIO, S3) | [Country] |

*The Controller authorises the use of the sub-processors listed above. The Processor shall notify the Controller of any intended changes to this list, giving the Controller the opportunity to object.*

## 8. International Transfers

If personal data is transferred outside the EEA:

- [ ] Standard contractual clauses (SCCs) are in place
- [ ] Adequacy decision exists for the destination country
- [ ] No international transfers (self-hosted within EEA)

## 9. Termination

Upon termination of this agreement:

1. The Processor shall, at the choice of the Controller, return or delete all personal data.
2. Deletion must be completed within **30 days** of termination.
3. The Processor shall certify deletion in writing upon request.
4. Retention beyond termination is only permitted where required by EU or Member State law.

## 10. Governing Law

This DPA is governed by the law of the EU Member State in which the Controller is established, in accordance with Article 28(3)(h).

---

## Review History

| Date | Reviewer | Changes |
|---|---|---|
| [Date] | [Name] | Initial DPA created |

*This document should be reviewed annually or whenever processing arrangements change.*
