"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";
import { Loader2, X } from "lucide-react";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

const OWNER_EMAIL = "ahmedawn7@gmail.com";
const configuredSiteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL ||
  process.env.NEXT_PUBLIC_VERCEL_URL;
const fallbackProductionUrl = "https://seamarket-hb9cwh0jk-ahmedawn7-clouds-projects.vercel.app";

export type AccessPlan = "guest" | "registered" | "pro";

export function getAccessPlan(session: Session | null, profilePlan?: string | null): AccessPlan {
  const email = session?.user?.email?.toLowerCase();
  if (email === OWNER_EMAIL) return "pro";
  if (profilePlan === "pro") return "pro";
  if (session?.user) return "registered";
  return "guest";
}

function getEmailRedirectUrl() {
  if (configuredSiteUrl) {
    return normalizeSiteUrl(configuredSiteUrl);
  }
  if (typeof window === "undefined") return undefined;

  if (["localhost", "127.0.0.1"].includes(window.location.hostname)) {
    return fallbackProductionUrl;
  }

  return window.location.origin;
}

function normalizeSiteUrl(url: string) {
  const trimmed = url.trim().replace(/\/$/, "");
  return trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
}

export default function AuthPanel({
  isOpen,
  onClose,
  onSessionChange,
  onDevUnlock,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSessionChange: (session: Session | null, profilePlan?: string | null) => void;
  onDevUnlock?: () => void;
}) {
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [businessType, setBusinessType] = useState("Seller");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [showDevUnlock, setShowDevUnlock] = useState(false);
  const [devUnlockOpen, setDevUnlockOpen] = useState(false);
  const [devPassword, setDevPassword] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    setShowDevUnlock(["localhost", "127.0.0.1"].includes(window.location.hostname));
  }, []);

  if (!isOpen) return null;

  async function saveProfile(userId: string, userEmail: string) {
    if (!supabase) return null;

    const plan = userEmail.toLowerCase() === OWNER_EMAIL ? "pro" : "registered";
    const { error } = await supabase.from("user_profiles").upsert({
      id: userId,
      display_name: displayName.trim() || userEmail.split("@")[0],
      business_type: businessType,
      country: "Malaysia",
      plan,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.warn("Profile save failed:", error.message);
    }

    return plan;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");
    setNeedsConfirmation(false);

    if (!supabase) {
      setStatus("error");
      setMessage("Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (mode === "signin" && !password.trim()) {
      setStatus("error");
      setMessage("Enter your password, or use the passwordless login link button below.");
      return;
    }

    const result =
      mode === "signup"
        ? await supabase.auth.signUp({
            email: normalizedEmail,
            password,
            options: {
              emailRedirectTo: getEmailRedirectUrl(),
              data: {
                display_name: displayName.trim(),
                business_type: businessType,
              },
            },
          })
        : await supabase.auth.signInWithPassword({ email: normalizedEmail, password });

    if (result.error) {
      setStatus("error");
      setMessage(formatAuthError(result.error.message));
      setNeedsConfirmation(result.error.message.toLowerCase().includes("confirm"));
      return;
    }

    const session = result.data.session;
    if (session?.user) {
      const profilePlan = await saveProfile(session.user.id, normalizedEmail);
      onSessionChange(session, profilePlan);
      setStatus("success");
      setMessage("You are signed in.");
      onClose();
      return;
    }

    setStatus("success");
    setNeedsConfirmation(true);
    setMessage("Account created. Check your inbox, spam, and promotions folders to confirm your email, then sign in.");
  }

  async function resendConfirmation() {
    setStatus("loading");
    setMessage("");

    if (!supabase) {
      setStatus("error");
      setMessage("Supabase is not configured.");
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: normalizedEmail,
      options: {
        emailRedirectTo: getEmailRedirectUrl(),
      },
    });

    if (error) {
      setStatus("error");
      setNeedsConfirmation(true);
      setMessage(formatAuthError(error.message));
      return;
    }

    setStatus("success");
    setNeedsConfirmation(true);
    setMessage("Confirmation email resent. Check inbox, spam, and promotions.");
  }

  async function sendPasswordlessLink() {
    setStatus("loading");
    setMessage("");
    setNeedsConfirmation(false);

    if (!supabase) {
      setStatus("error");
      setMessage("Supabase is not configured.");
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const { error } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: getEmailRedirectUrl(),
        data: {
          display_name: displayName.trim(),
          business_type: businessType,
        },
      },
    });

    if (error) {
      setStatus("error");
      setMessage(formatAuthError(error.message));
      return;
    }

    setStatus("success");
    setMessage("Passwordless login link sent. Check inbox, spam, and promotions.");
  }

  async function signInWithGoogle() {
    setStatus("loading");
    setMessage("");
    setNeedsConfirmation(false);

    if (!supabase) {
      setStatus("error");
      setMessage("Supabase is not configured.");
      return;
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: getEmailRedirectUrl(),
        queryParams: {
          access_type: "offline",
          prompt: "select_account",
        },
      },
    });

    if (error) {
      setStatus("error");
      setMessage(formatAuthError(error.message));
    }
  }

  function unlockLocalAdmin() {
    if (devPassword !== "1227") {
      setStatus("error");
      setMessage("Incorrect local developer password.");
      return;
    }

    localStorage.setItem("profitpilot-dev-admin", "true");
    onDevUnlock?.();
    setStatus("success");
    setMessage("Local developer Pro access unlocked.");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl shadow-black/40">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-300">Secure access</p>
            <h2 className="mt-2 text-2xl font-bold text-foreground">Login or create account</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Supabase Auth stores user registration safely. Owner email receives Pro access after verified sign-in.
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg bg-muted p-2 text-muted-foreground transition hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-5 grid grid-cols-2 rounded-lg border border-border bg-muted/50 p-1">
          {[
            ["signup", "Register"],
            ["signin", "Sign in"],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setMode(id as "signin" | "signup")}
              className={`rounded-md px-3 py-2 text-sm font-bold transition ${
                mode === id ? "bg-cyan-500 text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={signInWithGoogle}
          disabled={status === "loading"}
          className="mb-5 inline-flex w-full items-center justify-center gap-3 rounded-lg border border-border bg-white px-5 py-3 font-bold text-foreground transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-sm font-black text-foreground">
            G
          </span>
          Continue with Google
        </button>

        <div className="mb-5 flex items-center gap-3 text-xs uppercase tracking-[0.18em] text-slate-600">
          <div className="h-px flex-1 bg-muted" />
          or use email
          <div className="h-px flex-1 bg-muted" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Display name" value={displayName} onChange={setDisplayName} placeholder="Your name" />
              <label className="grid gap-2 text-sm text-muted-foreground">
                Business type
                <select
                  value={businessType}
                  onChange={(event) => setBusinessType(event.target.value)}
                  className="rounded-lg border border-border bg-muted px-4 py-3 text-foreground outline-none transition focus:border-cyan-400"
                >
                  <option>Seller</option>
                  <option>Dropshipper</option>
                  <option>Brand owner</option>
                  <option>Agency</option>
                  <option>Researcher</option>
                </select>
              </label>
            </div>
          )}

          <Field label="Email" value={email} onChange={setEmail} placeholder="you@example.com" type="email" required />
          <Field
            label={mode === "signup" ? "Password" : "Password"}
            value={password}
            onChange={setPassword}
            placeholder={mode === "signup" ? "Minimum 6 characters" : "Password, or use email link below"}
            type="password"
            required={mode === "signup"}
          />

          {status === "error" && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{message}</div>
          )}
          {status === "success" && (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">{message}</div>
          )}

          <button
            type="submit"
            disabled={status === "loading"}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-500 px-5 py-3 font-bold text-foreground transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status === "loading" && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === "signup" ? "Create account" : "Sign in"}
          </button>

          {needsConfirmation && (
            <button
              type="button"
              onClick={resendConfirmation}
              disabled={status === "loading" || !email.trim()}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-white/5 px-5 py-3 font-bold text-foreground transition hover:border-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Resend confirmation email
            </button>
          )}

          <button
            type="button"
            onClick={sendPasswordlessLink}
            disabled={status === "loading" || !email.trim()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-white/5 px-5 py-3 font-bold text-foreground transition hover:border-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Send passwordless login link
          </button>

          <p className="rounded-lg border border-border bg-muted/50 p-3 text-xs leading-5 text-muted-foreground">
            If Supabase says rate limit exceeded, wait before requesting again or connect SMTP in Supabase. If no email
            arrives, check Authentication &gt; Users to confirm the account exists.
          </p>
        </form>

        <p className="mt-5 text-xs leading-5 text-slate-500">
          By registering, you agree to the{" "}
          <a href="/terms" className="text-cyan-300 hover:text-cyan-200">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="/privacy" className="text-cyan-300 hover:text-cyan-200">
            Privacy Policy
          </a>
          .
        </p>

        {showDevUnlock && (
          <div className="mt-5 border-t border-border pt-4">
            {!devUnlockOpen ? (
              <button
                type="button"
                onClick={() => setDevUnlockOpen(true)}
                className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-600 transition hover:text-cyan-300"
              >
                Dev admin
              </button>
            ) : (
              <div className="grid gap-3">
                <p className="text-xs text-slate-500">Localhost-only developer access. Hidden on Vercel.</p>
                <input
                  type="password"
                  value={devPassword}
                  onChange={(event) => setDevPassword(event.target.value)}
                  placeholder="Developer password"
                  className="rounded-lg border border-border bg-muted px-4 py-3 text-sm text-foreground outline-none transition focus:border-cyan-400"
                />
                <button
                  type="button"
                  onClick={unlockLocalAdmin}
                  className="rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-4 py-3 text-sm font-bold text-cyan-200 transition hover:bg-cyan-400/20"
                >
                  Unlock local Pro access
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function formatAuthError(message: string) {
  const lower = message.toLowerCase();
  if (lower.includes("rate")) {
    return "Supabase email rate limit exceeded. This limit is controlled by Supabase email delivery. Wait before trying again, or connect a custom SMTP provider in Supabase Authentication settings.";
  }
  if (lower.includes("confirm")) {
    return "This account exists but the email is not confirmed yet. Check spam/promotions or resend confirmation below.";
  }
  if (lower.includes("invalid login")) {
    return "Invalid email or password. If you have not confirmed your email yet, use resend confirmation or passwordless login.";
  }
  return message;
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-2 text-sm text-muted-foreground">
      {label}
      <input
        type={type}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="rounded-lg border border-border bg-muted px-4 py-3 text-foreground outline-none transition focus:border-cyan-400"
      />
    </label>
  );
}
