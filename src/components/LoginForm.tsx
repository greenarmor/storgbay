"use client";

import { FormEvent, useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

const ERROR_MESSAGES: Record<string, string> = {
  CredentialsSignin: "Invalid email or password. Double-check your details and try again.",
};

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams?.get("error");
    if (!code) {
      setError(null);
      return;
    }

    setError(ERROR_MESSAGES[code] ?? "We couldn't sign you in with those credentials. Please try again.");
  }, [searchParams]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "").trim();

    if (!email || !password) {
      setError("Enter both your email and password to continue.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const callbackUrl = searchParams?.get("callbackUrl") ?? "/dashboard";

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
        callbackUrl,
      });

      if (result?.error) {
        setError(ERROR_MESSAGES[result.error] ?? "Invalid email or password. Please try again.");
        setSubmitting(false);
        return;
      }

      const targetUrl = (() => {
        if (result?.url) {
          try {
            const parsed = new URL(result.url, window.location.origin);
            if (parsed.origin === window.location.origin) {
              return `${parsed.pathname}${parsed.search}${parsed.hash}` || "/dashboard";
            }
          } catch (error) {
            console.warn("Failed to parse sign-in redirect URL", error);
          }
          return result.url;
        }
        return callbackUrl;
      })();

      router.replace(targetUrl ?? "/dashboard");
      router.refresh();
    } catch (err) {
      console.error(err);
      setError("Something went wrong while signing you in. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      <div className="auth-field">
        <label htmlFor="email">Email address</label>
        <input id="email" name="email" type="email" autoComplete="email" placeholder="you@studio.com" required />
      </div>
      <div className="auth-field">
        <div className="auth-field-label">
          <label htmlFor="password">Password</label>
          <a href="mailto:support@storgbay.online">Need help?</a>
        </div>
        <input id="password" name="password" type="password" autoComplete="current-password" required />
      </div>
      {error ? (
        <p role="alert" className="auth-error">
          {error}
        </p>
      ) : null}
      <button type="submit" className="auth-submit" disabled={submitting}>
        {submitting ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}

