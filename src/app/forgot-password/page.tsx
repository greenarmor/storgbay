import Link from "next/link";
import { ForgotPasswordForm } from "@/components/ForgotPasswordForm";

export const metadata = {
  title: "Forgot password | Storgbay",
};

export default function ForgotPasswordPage() {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card-header">
          <span className="auth-badge">Account recovery</span>
          <h1 className="auth-title">Reset your password</h1>
          <p className="auth-subtitle">
            Enter the email address for your account and we&apos;ll send a reset link.
          </p>
        </div>
        <ForgotPasswordForm />
        <div className="auth-footer">
          <p>
            Remembered it? <Link href="/login">Back to sign in</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
