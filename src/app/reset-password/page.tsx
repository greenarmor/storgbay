import Link from "next/link";
import { ResetPasswordForm } from "@/components/ResetPasswordForm";

export const metadata = {
  title: "Set a new password | Storgbay",
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card-header">
          <span className="auth-badge">Account recovery</span>
          <h1 className="auth-title">Set a new password</h1>
          <p className="auth-subtitle">Choose a new password for your Storgbay account.</p>
        </div>
        {token ? (
          <ResetPasswordForm token={token} />
        ) : (
          <div className="auth-form">
            <p role="alert" className="auth-error">
              This reset link is missing its token. Request a new one.
            </p>
          </div>
        )}
        <div className="auth-footer">
          <p>
            Need a new link? <Link href="/forgot-password">Request another</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
