"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { CheckCircle2, Loader2 } from "lucide-react";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

export default function WaitlistForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Seller");
  const [goal, setGoal] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    if (!supabase) {
      setStatus("error");
      setMessage("Supabase is not configured. Check your environment variables.");
      return;
    }

    const { error } = await supabase.from("waitlist").insert({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role,
      goal: goal.trim(),
      source: "homepage",
    });

    if (error) {
      setStatus("error");
      setMessage(error.code === "23505" ? "This email is already on the waitlist." : error.message);
      return;
    }

    setStatus("success");
    setName("");
    setEmail("");
    setGoal("");
    setMessage("You are on the list. We will contact you when access opens.");
  }

  return (
    <div className="mx-auto max-w-2xl rounded-xl border border-slate-800 bg-[#0d1322] p-6 shadow-2xl shadow-black/30">
      <div className="mb-6 text-center">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-cyan-300">Early access</p>
        <h2 className="text-2xl font-bold text-white md:text-3xl">Join the Profit Pilot AI waitlist</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-400">
          Tell us what you sell and we will prioritize your dashboard access as the platform opens.
        </p>
      </div>

      {status === "success" ? (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-center text-emerald-300">
          <CheckCircle2 className="mx-auto mb-3 h-8 w-8" />
          <p className="font-semibold">{message}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Name" value={name} onChange={setName} placeholder="Your name" />
            <Field label="Email" value={email} onChange={setEmail} placeholder="you@example.com" type="email" required />
          </div>

          <label className="grid gap-2 text-sm text-slate-300">
            I am mainly a
            <select
              value={role}
              onChange={(event) => setRole(event.target.value)}
              className="rounded-lg border border-slate-700 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
            >
              <option>Seller</option>
              <option>Dropshipper</option>
              <option>Brand owner</option>
              <option>Agency</option>
              <option>Researcher</option>
            </select>
          </label>

          <label className="grid gap-2 text-sm text-slate-300">
            What do you want Profit Pilot AI to help you find?
            <textarea
              value={goal}
              onChange={(event) => setGoal(event.target.value)}
              rows={3}
              placeholder="Example: TikTok products I can source cheaply and sell on Shopee Malaysia."
              className="resize-none rounded-lg border border-slate-700 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
            />
          </label>

          {status === "error" && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={status === "loading"}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-500 px-5 py-3 font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status === "loading" && <Loader2 className="h-4 w-4 animate-spin" />}
            {status === "loading" ? "Submitting..." : "Request access"}
          </button>
        </form>
      )}
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