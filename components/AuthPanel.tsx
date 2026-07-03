"use client";

import { useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";
import { Loader2, X } from "lucide-react";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

const OWNER_EMAIL = "ahmedawn7@gmail.com";
const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

export type AccessPlan = "guest" | "registered" | "pro";

export function getAccessPlan(session: Session | null, profilePlan?: string | null): AccessPlan {
  const email = session?.user?.email?.toLowerCase();
  if (email === OWNER_EMAIL) return "pro";
  if (profilePlan === "pro") return "pro";
  if (session?.user) return "registered";
  return "guest";
}

function getEmailRedirectUrl() {
  if (configuredSiteUrl) return configuredSiteUrl;
  if (typeof window === "undefined") return undefined;
  return window.location.origin;
}

export default function AuthPanel({
  isOpen,
  onClose,
  onSessionChange,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSessionChange: (session: Session | null, profilePlan?: string | null) => void;
}) {
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [businessType, setBusinessType] = useState("Seller");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

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

    if (!supabase) {
      setStatus("error");
      setMessage("Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
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
      setMessage(result.error.message);
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
    setMessage("Check your email to confirm your account, then sign in.");
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl border border-slate-800 bg-[#0d1322] p-6 shadow-2xl shadow-black/40">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-300">Secure access</p>
            <h2 className="mt-2 text-2xl font-bold text-white">Login or create account</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Supabase Auth stores user registration safely. Owner email receives Pro access after verified sign-in.
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg bg-black/30 p-2 text-slate-400 transition hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-5 grid grid-cols-2 rounded-lg border border-slate-800 bg-black/20 p-1">
          {[
            ["signup", "Register"],
            ["signin", "Sign in"],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setMode(id as "signin" | "signup")}
              className={`rounded-md px-3 py-2 text-sm font-bold transition ${
                mode === id ? "bg-cyan-500 text-slate-950" : "text-slate-400 hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Display name" value={displayName} onChange={setDisplayName} placeholder="Your name" />
              <label className="grid gap-2 text-sm text-slate-300">
                Business type
                <select
                  value={businessType}
                  onChange={(event) => setBusinessType(event.target.value)}
                  className="rounded-lg border border-slate-700 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
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
          <Field label="Password" value={password} onChange={setPassword} placeholder="Minimum 6 characters" type="password" required />

          {status === "error" && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{message}</div>
          )}
          {status === "success" && (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">{message}</div>
          )}

          <button
            type="submit"
            disabled={status === "loading"}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-500 px-5 py-3 font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status === "loading" && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === "signup" ? "Create account" : "Sign in"}
          </button>

          <p className="rounded-lg border border-slate-800 bg-black/20 p-3 text-xs leading-5 text-slate-400">
            Passwordless email links are temporarily disabled during setup to avoid Supabase email rate limits.
            Use email and password registration for now.
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
      </div>
    </div>
  );
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
    <label className="grid gap-2 text-sm text-slate-300">
      {label}
      <input
        type={type}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="rounded-lg border border-slate-700 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
      />
    </label>
  );
}
