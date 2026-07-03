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
  const [businessType, setBusinessType] = useState("Seller");
  const [monthlyRevenue, setMonthlyRevenue] = useState("Pre-revenue");
  const [marketplace, setMarketplace] = useState("TikTok Shop");
  const [country, setCountry] = useState("Malaysia");
  const [businessStage, setBusinessStage] = useState("Researching products");
  const [mainPainPoint, setMainPainPoint] = useState("");
  const [expectedFeatures, setExpectedFeatures] = useState("");
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

    const intelligenceProfile = [
      `Business type: ${businessType}`,
      `Monthly revenue: ${monthlyRevenue}`,
      `Marketplace: ${marketplace}`,
      `Country: ${country}`,
      `Business stage: ${businessStage}`,
      `Main pain point: ${mainPainPoint.trim() || "Not provided"}`,
      `Expected features: ${expectedFeatures.trim() || "Not provided"}`,
    ].join("\n");

    const { error } = await supabase.from("waitlist").insert({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role: businessType,
      goal: intelligenceProfile,
      source: "homepage-market-intelligence",
    });

    if (error) {
      setStatus("error");
      setMessage(error.code === "23505" ? "This email is already on the waitlist." : error.message);
      return;
    }

    setStatus("success");
    setName("");
    setEmail("");
    setBusinessType("Seller");
    setMonthlyRevenue("Pre-revenue");
    setMarketplace("TikTok Shop");
    setCountry("Malaysia");
    setBusinessStage("Researching products");
    setMainPainPoint("");
    setExpectedFeatures("");
    setMessage("You are on the list. We will contact you when access opens.");
  }

  return (
    <div className="mx-auto max-w-6xl rounded-xl border border-border bg-card p-6 shadow-2xl shadow-black/30">
      <div className="mb-8 grid gap-4 md:grid-cols-[0.9fr_1.1fr] md:items-end">
        <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-cyan-300">Early access</p>
        <h2 className="text-2xl font-bold text-foreground md:text-3xl">Join the Profit Pilot AI waitlist</h2>
        </div>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
          Tell us how your business operates so we can prioritize the market intelligence workflows that matter most to you.
        </p>
      </div>

      {status === "success" ? (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-center text-emerald-300">
          <CheckCircle2 className="mx-auto mb-3 h-8 w-8" />
          <p className="font-semibold">{message}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="grid gap-5">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Name" value={name} onChange={setName} placeholder="Your name" />
            <Field label="Email" value={email} onChange={setEmail} placeholder="you@example.com" type="email" required />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <SelectField
              label="Business type"
              value={businessType}
              onChange={setBusinessType}
              options={["Seller", "Dropshipper", "Brand owner", "Agency", "Researcher", "Supplier"]}
            />
            <SelectField
              label="Monthly revenue"
              value={monthlyRevenue}
              onChange={setMonthlyRevenue}
              options={["Pre-revenue", "Below RM 5k", "RM 5k - RM 25k", "RM 25k - RM 100k", "RM 100k+"]}
            />
            <SelectField
              label="Marketplace"
              value={marketplace}
              onChange={setMarketplace}
              options={["TikTok Shop", "Shopee", "Lazada", "Multiple marketplaces", "Own website", "Not selling yet"]}
            />
            <SelectField
              label="Country"
              value={country}
              onChange={setCountry}
              options={["Malaysia", "Singapore", "Indonesia", "Thailand", "Philippines", "Vietnam", "Other"]}
            />
            <SelectField
              label="Business stage"
              value={businessStage}
              onChange={setBusinessStage}
              options={["Researching products", "Testing first product", "Scaling winners", "Managing multiple stores", "Agency operations"]}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm text-muted-foreground">
              Main pain point
            <textarea
                value={mainPainPoint}
                onChange={(event) => setMainPainPoint(event.target.value)}
                rows={4}
                placeholder="Example: I cannot tell which products are worth launching before spending on ads."
              className="resize-none rounded-lg border border-border bg-muted px-4 py-3 text-foreground outline-none transition focus:border-cyan-400"
            />
          </label>
            <label className="grid gap-2 text-sm text-muted-foreground">
              Expected features
              <textarea
                value={expectedFeatures}
                onChange={(event) => setExpectedFeatures(event.target.value)}
                rows={4}
                placeholder="Example: AI product analysis, supplier comparison, ROI alerts, weekly trend reports."
                className="resize-none rounded-lg border border-border bg-muted px-4 py-3 text-foreground outline-none transition focus:border-cyan-400"
              />
            </label>
          </div>

          {status === "error" && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={status === "loading"}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-500 px-5 py-3 font-bold text-foreground transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60 md:w-fit"
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

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <label className="grid gap-2 text-sm text-muted-foreground">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-lg border border-border bg-muted px-4 py-3 text-foreground outline-none transition focus:border-cyan-400"
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}
