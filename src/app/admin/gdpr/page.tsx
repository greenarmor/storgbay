import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function GDPRPage() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div style={{ maxWidth: 960, margin: "0 auto" }}>
      <header style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <Link href="/admin" style={{ color: "#666", fontSize: 14, textDecoration: "none" }}>
            ← Admin Console
          </Link>
        </div>
        <h1 style={{ margin: 0 }}>GDPR Compliance Dashboard</h1>
        <p style={{ margin: "4px 0 0", color: "#666" }}>
          Monitor data protection compliance, consent records, and user rights management.
        </p>
      </header>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 32 }}>
        <div id="gdpr-stat-users" style={{ padding: 16, border: "1px solid #e0e0e0", borderRadius: 8 }}>
          <div style={{ fontSize: 12, color: "#888", textTransform: "uppercase", letterSpacing: 0.5 }}>Total Users</div>
          <div style={{ fontSize: 28, fontWeight: 700, marginTop: 4 }} id="stat-total-users">—</div>
        </div>
        <div id="gdpr-stat-files" style={{ padding: 16, border: "1px solid #e0e0e0", borderRadius: 8 }}>
          <div style={{ fontSize: 12, color: "#888", textTransform: "uppercase", letterSpacing: 0.5 }}>Stored Files</div>
          <div style={{ fontSize: 28, fontWeight: 700, marginTop: 4 }} id="stat-total-files">—</div>
        </div>
        <div id="gdpr-stat-consents" style={{ padding: 16, border: "1px solid #e0e0e0", borderRadius: 8 }}>
          <div style={{ fontSize: 12, color: "#888", textTransform: "uppercase", letterSpacing: 0.5 }}>Consent Records</div>
          <div style={{ fontSize: 28, fontWeight: 700, marginTop: 4 }} id="stat-total-consents">—</div>
        </div>
        <div id="gdpr-stat-without-consent" style={{ padding: 16, border: "1px solid #e0e0e0", borderRadius: 8 }}>
          <div style={{ fontSize: 12, color: "#888", textTransform: "uppercase", letterSpacing: 0.5 }}>Missing Consent</div>
          <div style={{ fontSize: 28, fontWeight: 700, marginTop: 4, color: "var(--color-danger, #dc3545)" }} id="stat-without-consent">—</div>
        </div>
      </section>

      <section style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h2 style={{ margin: 0 }}>Compliance Checklist</h2>
        </div>
        <div id="gdpr-checklist" style={{ border: "1px solid #e0e0e0", borderRadius: 8, overflow: "hidden" }}>
          <div className="gdpr-checklist-item" style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderBottom: "1px solid #e0e0e0" }}>
            <span id="check-privacy-policy" style={{ color: "#22c55e", fontSize: 18 }}>✓</span>
            <div>
              <div style={{ fontWeight: 500 }}>Privacy Policy Published</div>
              <div style={{ fontSize: 13, color: "#888" }}>Art. 13/14 — Available at /privacy</div>
            </div>
          </div>
          <div className="gdpr-checklist-item" style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderBottom: "1px solid #e0e0e0" }}>
            <span id="check-consent-tracking" style={{ color: "#22c55e", fontSize: 18 }}>✓</span>
            <div>
              <div style={{ fontWeight: 500 }}>Consent Tracking Active</div>
              <div style={{ fontSize: 13, color: "#888" }}>Art. 7 — Versioned consent records with audit trail</div>
            </div>
          </div>
          <div className="gdpr-checklist-item" style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderBottom: "1px solid #e0e0e0" }}>
            <span id="check-data-export" style={{ color: "#22c55e", fontSize: 18 }}>✓</span>
            <div>
              <div style={{ fontWeight: 500 }}>Data Export (Right to Access)</div>
              <div style={{ fontSize: 13, color: "#888" }}>Art. 15/20 — JSON export in account settings</div>
            </div>
          </div>
          <div className="gdpr-checklist-item" style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderBottom: "1px solid #e0e0e0" }}>
            <span id="check-account-deletion" style={{ color: "#22c55e", fontSize: 18 }}>✓</span>
            <div>
              <div style={{ fontWeight: 500 }}>Account Deletion (Right to Erasure)</div>
              <div style={{ fontSize: 13, color: "#888" }}>Art. 17 — Self-service with password confirmation</div>
            </div>
          </div>
          <div className="gdpr-checklist-item" style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderBottom: "1px solid #e0e0e0" }}>
            <span id="check-audit-logging" style={{ color: "#22c55e", fontSize: 18 }}>✓</span>
            <div>
              <div style={{ fontWeight: 500 }}>Audit Logging</div>
              <div style={{ fontSize: 13, color: "#888" }}>Art. 5(2) — Accountability with 12-month retention</div>
            </div>
          </div>
          <div className="gdpr-checklist-item" style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderBottom: "1px solid #e0e0e0" }}>
            <span id="check-cookie-consent" style={{ color: "#22c55e", fontSize: 18 }}>✓</span>
            <div>
              <div style={{ fontWeight: 500 }}>Cookie Consent Banner</div>
              <div style={{ fontSize: 13, color: "#888" }}>Art. 6(1)(a) / ePrivacy — Essential-only, versioned consent</div>
            </div>
          </div>
          <div className="gdpr-checklist-item" style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderBottom: "1px solid #e0e0e0" }}>
            <span id="check-data-retention" style={{ color: "#22c55e", fontSize: 18 }}>✓</span>
            <div>
              <div style={{ fontWeight: 500 }}>Data Retention &amp; Cleanup</div>
              <div style={{ fontSize: 13, color: "#888" }}>Art. 5(1)(e) — Automated cron cleanup of audit logs and expired shares</div>
            </div>
          </div>
          <div className="gdpr-checklist-item" style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderBottom: "1px solid #e0e0e0" }}>
            <span id="check-breach-procedure" style={{ color: "#22c55e", fontSize: 18 }}>✓</span>
            <div>
              <div style={{ fontWeight: 500 }}>Breach Notification Procedure</div>
              <div style={{ fontSize: 13, color: "#888" }}>Art. 33/34 — Documented at /docs/breach-notification-procedure.md</div>
            </div>
          </div>
          <div className="gdpr-checklist-item" style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderBottom: "1px solid #e0e0e0" }}>
            <span id="check-ropa" style={{ color: "#22c55e", fontSize: 18 }}>✓</span>
            <div>
              <div style={{ fontWeight: 500 }}>Record of Processing Activities (ROPA)</div>
              <div style={{ fontSize: 13, color: "#888" }}>Art. 30 — Documented at /docs/ropa.md</div>
            </div>
          </div>
          <div className="gdpr-checklist-item" style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px" }}>
            <span id="check-security-headers" style={{ color: "#22c55e", fontSize: 18 }}>✓</span>
            <div>
              <div style={{ fontWeight: 500 }}>Security Headers &amp; Encryption</div>
              <div style={{ fontSize: 13, color: "#888" }}>Art. 32 — HSTS, CSP, bcrypt, HTTPS-only cookies, rate limiting</div>
            </div>
          </div>
        </div>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ marginBottom: 12 }}>Users Without Consent</h2>
        <div id="gdpr-users-without-consent" style={{ border: "1px solid #e0e0e0", borderRadius: 8, overflow: "hidden" }}>
          <div style={{ padding: 16, textAlign: "center", color: "#888" }}>Loading...</div>
        </div>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ marginBottom: 12 }}>Recent Consent Activity</h2>
        <div id="gdpr-recent-consents" style={{ border: "1px solid #e0e0e0", borderRadius: 8, overflow: "hidden" }}>
          <div style={{ padding: 16, textAlign: "center", color: "#888" }}>Loading...</div>
        </div>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ marginBottom: 12 }}>GDPR Documents</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 12 }}>
          <a href="/privacy" style={{ padding: 16, border: "1px solid #e0e0e0", borderRadius: 8, textDecoration: "none", color: "inherit" }}>
            <div style={{ fontWeight: 500 }}>Privacy Policy</div>
            <div style={{ fontSize: 13, color: "#888" }}>Art. 13/14 — Public-facing policy</div>
          </a>
          <a href="https://github.com/greenarmor/storgbay/blob/main/docs/ropa.md" target="_blank" rel="noopener noreferrer" style={{ padding: 16, border: "1px solid #e0e0e0", borderRadius: 8, textDecoration: "none", color: "inherit" }}>
            <div style={{ fontWeight: 500 }}>Record of Processing Activities</div>
            <div style={{ fontSize: 13, color: "#888" }}>Art. 30 — ROPA document</div>
          </a>
          <a href="https://github.com/greenarmor/storgbay/blob/main/docs/breach-notification-procedure.md" target="_blank" rel="noopener noreferrer" style={{ padding: 16, border: "1px solid #e0e0e0", borderRadius: 8, textDecoration: "none", color: "inherit" }}>
            <div style={{ fontWeight: 500 }}>Breach Notification Procedure</div>
            <div style={{ fontSize: 13, color: "#888" }}>Art. 33/34 — Incident response</div>
          </a>
        </div>
      </section>

      <script
        dangerouslySetInnerHTML={{
          __html: `
(async function() {
  try {
    const res = await fetch('/api/admin/gdpr');
    if (!res.ok) return;
    const data = await res.json();

    document.getElementById('stat-total-users').textContent = data.summary.totalUsers;
    document.getElementById('stat-total-files').textContent = data.summary.totalFiles;
    document.getElementById('stat-total-consents').textContent = data.summary.totalConsentRecords;
    document.getElementById('stat-without-consent').textContent = data.summary.usersWithoutConsentCount;

    if (data.summary.usersWithoutConsentCount > 0) {
      document.getElementById('stat-without-consent').style.color = '#dc3545';
    }

    var usersEl = document.getElementById('gdpr-users-without-consent');
    if (data.usersWithoutConsent.length === 0) {
      usersEl.innerHTML = '<div style="padding:16px;text-align:center;color:#22c55e">All users have consent records ✓</div>';
    } else {
      var rows = data.usersWithoutConsent.map(function(u) {
        return '<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 16px;border-bottom:1px solid #e0e0e0">' +
          '<div><strong>' + (u.name || 'No name') + '</strong> <span style="color:#888">' + (u.email || '') + '</span></div>' +
          '<div style="font-size:13px;color:#888">Created: ' + new Date(u.createdAt).toLocaleDateString() + '</div>' +
        '</div>';
      }).join('');
      usersEl.innerHTML = rows;
    }

    var consentsEl = document.getElementById('gdpr-recent-consents');
    if (data.recentConsents.length === 0) {
      consentsEl.innerHTML = '<div style="padding:16px;text-align:center;color:#888">No consent records yet</div>';
    } else {
      var cRows = data.recentConsents.slice(0, 20).map(function(c) {
        return '<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 16px;border-bottom:1px solid #e0e0e0">' +
          '<div><strong>' + (c.user?.name || c.user?.email || c.userId) + '</strong> <span style="color:#888">' + c.type + ' v' + c.version + '</span></div>' +
          '<div style="font-size:13px;color:#888">' + new Date(c.createdAt).toLocaleString() + '</div>' +
        '</div>';
      }).join('');
      consentsEl.innerHTML = cRows;
    }
  } catch(e) {
    console.error('Failed to load GDPR data', e);
  }
})();
          `,
        }}
      />
    </div>
  );
}
