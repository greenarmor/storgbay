import { redirect } from "next/navigation";
import Link from "next/link";
import { LoginForm } from "@/components/LoginForm";
import { auth, AppSession } from "@/lib/auth";

export const metadata = {
  title: "Sign in | Storgbay",
};

export default async function LoginPage() {
  const session = (await auth()) as AppSession | null;

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card-header">
          <span className="auth-badge">Welcome back</span>
          <h1 className="auth-title">Sign in to Storgbay</h1>
          <p className="auth-subtitle">
            Access your creative workspace, manage galleries, and keep every asset in sync.
          </p>
        </div>
        <LoginForm />
        <div className="auth-footer">
          <p>
            Having trouble signing in? <Link href="mailto:support@storgbay.online">Contact support</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}

