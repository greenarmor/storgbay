export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6 py-8 px-4">
      <h1 className="text-3xl font-bold">Privacy Policy</h1>
      <p className="text-sm text-gray-500">Last updated: {new Date().toLocaleDateString()}</p>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">1. Data Controller</h2>
        <p>
          The data controller responsible for your personal data is the operator of this Storgbay instance.
          Contact details are provided by the instance administrator.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">2. What Data We Collect</h2>
        <ul className="list-disc list-inside space-y-1">
          <li><strong>Account data:</strong> name, email address, hashed password</li>
          <li><strong>Uploaded files:</strong> file content, filename, size, and MIME type stored in object storage</li>
          <li><strong>Usage data:</strong> audit log entries recording actions you perform (uploads, deletions, gallery changes)</li>
          <li><strong>Session data:</strong> authentication tokens stored as HTTP-only cookies</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">3. Legal Basis (GDPR Art. 6)</h2>
        <p>We process your data on the following legal bases:</p>
        <ul className="list-disc list-inside space-y-1">
          <li><strong>Contract performance:</strong> providing the file storage and gallery service you signed up for</li>
          <li><strong>Legitimate interest:</strong> security logging, fraud prevention, and service improvement</li>
          <li><strong>Consent:</strong> where explicitly requested (e.g., optional analytics cookies)</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">4. How Long We Keep Your Data</h2>
        <ul className="list-disc list-inside space-y-1">
          <li><strong>Account data:</strong> retained until you delete your account or request erasure</li>
          <li><strong>Uploaded files:</strong> retained until you delete them or delete your account</li>
          <li><strong>Audit logs:</strong> retained for 12 months for security purposes</li>
          <li><strong>Session cookies:</strong> expire after 12 hours of inactivity</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">5. Your Rights (GDPR Art. 15-22)</h2>
        <p>You have the right to:</p>
        <ul className="list-disc list-inside space-y-1">
          <li><strong>Access</strong> your personal data — use the data export feature in your account settings</li>
          <li><strong>Rectification</strong> of inaccurate data — update your profile at any time</li>
          <li><strong>Erasure</strong> (&ldquo;right to be forgotten&rdquo;) — delete your account and all associated data</li>
          <li><strong>Restriction</strong> of processing</li>
          <li><strong>Data portability</strong> — export your data in structured JSON format</li>
          <li><strong>Object</strong> to processing based on legitimate interest</li>
          <li><strong>Withdraw consent</strong> at any time without affecting the lawfulness of prior processing</li>
        </ul>
        <p>
          To exercise these rights, use the account settings page or contact the instance administrator.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">6. Cookies</h2>
        <p>This application uses only essential cookies:</p>
        <ul className="list-disc list-inside space-y-1">
          <li><strong>Session token:</strong> an HTTP-only, Secure, SameSite=Lax cookie required for authentication</li>
          <li><strong>CSRF token:</strong> a cookie used to prevent cross-site request forgery</li>
        </ul>
        <p>No tracking, analytics, or advertising cookies are used.</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">7. Data Security</h2>
        <ul className="list-disc list-inside space-y-1">
          <li>Passwords are hashed using bcrypt (cost factor 12)</li>
          <li>All data in transit is encrypted via HTTPS</li>
          <li>Security headers (HSTS, CSP, X-Frame-Options) are enforced</li>
          <li>Session tokens are stored in HTTP-only cookies with Secure and SameSite attributes</li>
          <li>Rate limiting is applied to authentication endpoints</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">8. Data Breaches</h2>
        <p>
          In the event of a personal data breach, we will notify the relevant supervisory authority within 72 hours
          and inform affected data subjects without undue delay where the breach is likely to result in a high risk
          to their rights and freedoms.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">9. Third-Party Services</h2>
        <p>
          Your data is stored on infrastructure controlled by the instance operator. No data is shared with
          third-party analytics providers, advertising networks, or external AI services.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">10. Changes to This Policy</h2>
        <p>
          We may update this policy from time to time. Significant changes will be communicated through the
          application. Continued use of the service after changes constitutes acceptance of the updated policy.
        </p>
      </section>
    </div>
  );
}
