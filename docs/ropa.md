# Record of Processing Activities (ROPA)

**Article 30 GDPR — Storgbay Instance**

*Complete this document for your specific deployment. Fields marked [ ] require operator input.*

---

## Controller Details

| Field | Value |
|---|---|
| Name of controller | [Instance operator name] |
| Address | [Instance operator address] |
| Contact details | [DPO or contact email] |
| Representative (if applicable) | [N/A unless outside EU] |

---

## Processing Activities

### 1. User Account Management

| Field | Value |
|---|---|
| Purpose | User registration, authentication, and profile management |
| Categories of data subjects | Registered users, administrators |
| Categories of personal data | Name, email address, hashed password, role |
| Legal basis | Art. 6(1)(b) — contract performance |
| Recipients | System administrators (admin panel) |
| International transfers | None (self-hosted) |
| Retention period | Until account deletion + 30 days |
| Technical measures | bcrypt hashing (cost 12), HTTP-only Secure cookies, rate limiting, TLS |

### 2. File Storage and Management

| Field | Value |
|---|---|
| Purpose | Storing, organizing, and sharing user-uploaded files |
| Categories of data subjects | Registered users with UPLOADER or ADMIN role |
| Categories of personal data | File content, filename, MIME type, file size, checksum |
| Legal basis | Art. 6(1)(b) — contract performance |
| Recipients | Gallery managers (for shared galleries), system administrators |
| International transfers | None (self-hosted) |
| Retention period | Until user deletes file or account |
| Technical measures | S3 object storage, optional SSE, presigned URLs (5-minute expiry), filename sanitization |

### 3. Gallery Management

| Field | Value |
|---|---|
| Purpose | Organizing files into galleries and sharing with other users |
| Categories of data subjects | Registered users |
| Categories of personal data | Gallery title, description, visibility settings, manager assignments |
| Legal basis | Art. 6(1)(b) — contract performance |
| Recipients | Gallery managers, system administrators |
| International transfers | None (self-hosted) |
| Retention period | Until gallery deletion or account deletion |
| Technical measures | Role-based access control (owner, manager, viewer), visibility controls |

### 4. Security Audit Logging

| Field | Value |
|---|---|
| Purpose | Security monitoring, incident investigation, compliance |
| Categories of data subjects | All registered users |
| Categories of personal data | User ID, action performed, resource identifier, IP address, timestamp |
| Legal basis | Art. 6(1)(f) — legitimate interest (security) |
| Recipients | System administrators |
| International transfers | None (self-hosted) |
| Retention period | 12 months (automated cleanup via cron endpoint) |
| Technical measures | Database storage, access restricted to admins |

### 5. Session Management

| Field | Value |
|---|---|
| Purpose | Maintaining authenticated user sessions |
| Categories of data subjects | Authenticated users |
| Categories of personal data | JWT session token (contains user ID, role) |
| Legal basis | Art. 6(1)(b) — contract performance |
| Recipients | None (client-side cookie) |
| International transfers | None (self-hosted) |
| Retention period | 12 hours (session maxAge) |
| Technical measures | HTTP-only, Secure, SameSite=Lax cookies, JWT strategy |

---

## Processors

| Processor | Purpose | Location | Contract in place |
|---|---|---|---|
| [Cloud provider, if any] | [Hosting infrastructure] | [Country] | [Yes/No] |
| [CDN provider, if any] | [Content delivery] | [Country] | [Yes/No] |

---

## Review History

| Date | Reviewer | Changes |
|---|---|---|
| [Date] | [Name] | Initial ROPA created |

*This document should be reviewed quarterly and updated whenever processing activities change.*
