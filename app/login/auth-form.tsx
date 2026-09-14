"use client";
import { useState } from "react";
import { ArrowRight, LockKeyhole } from "lucide-react";
export default function AuthForm({
  signup,
  returnTo,
}: {
  signup: boolean;
  returnTo?: string;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function submit(f: FormData) {
    setBusy(true);
    setError("");
    const r = await fetch(`/api/auth/${signup ? "signup" : "login"}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(Object.fromEntries(f)),
    });
    const data = (await r.json()) as { error?: string };
    if (!r.ok) {
      setBusy(false);
      setError(data.error || "Please try again.");
      return;
    }
    location.href = signup
      ? "/onboarding"
      : returnTo?.startsWith("/")
        ? returnTo
        : "/dashboard";
  }
  return (
    <div className="login-card">
      <span className="login-lock">
        <LockKeyhole />
      </span>
      <h2>{signup ? "Create your account" : "Log in to CloseKey"}</h2>
      <p>
        {signup
          ? "Start your free trial—no credit card required."
          : "Enter your account details."}
      </p>
      <form action={submit} className="auth-form">
        <label>
          Email
          <input name="email" type="email" autoComplete="email" required />
        </label>
        <label>
          Password
          <input
            name="password"
            type="password"
            minLength={10}
            autoComplete={signup ? "new-password" : "current-password"}
            required
          />
        </label>
        {signup && <small>Use at least 10 characters.</small>}
        {error && <p className="form-error">{error}</p>}
        <button disabled={busy}>
          {busy ? "Please wait…" : signup ? "Create account" : "Log in"}
          <ArrowRight size={18} />
        </button>
      </form>
      <hr />
      <p className="login-switch">
        {signup ? "Already have an account?" : "New to CloseKey?"}{" "}
        <a href={signup ? "/login" : "/login?mode=signup"}>
          {signup ? "Log in" : "Start free trial"}
        </a>
      </p>
    </div>
  );
}
