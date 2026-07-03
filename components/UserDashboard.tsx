"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";
import { Award, Bell, Bookmark, Camera, Crown, MessageCircle, ShieldCheck, UserCircle } from "lucide-react";
import type { AccessPlan } from "@/components/AuthPanel";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;
const LOCAL_PROFILE_KEY = "profitpilot-local-profile";

export default function UserDashboard({ session, accessPlan }: { session: Session | null; accessPlan: AccessPlan }) {
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [businessType, setBusinessType] = useState("Seller");
  const [country, setCountry] = useState("Malaysia");
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    const localProfile = loadLocalProfile();
    if (localProfile) {
      setDisplayName(localProfile.displayName ?? "");
      setBusinessType(localProfile.businessType ?? "Seller");
      setCountry(localProfile.country ?? "Malaysia");
      setAvatarPreview(localProfile.avatarPreview ?? null);
    }

    if (!supabase || !session?.user) return;

    let isMounted = true;

    async function loadProfile() {
      const { data, error } = await supabase!
        .from("user_profiles")
        .select("display_name,business_type,country")
        .eq("id", session!.user.id)
        .maybeSingle();

      if (error) {
        setSaveMessage("Loaded local profile. Run SUPABASE_ACCESS_SETUP.sql to enable cloud profile saving.");
        return;
      }

      if (!isMounted || !data) return;
      setDisplayName(data.display_name ?? "");
      setBusinessType(data.business_type ?? "Seller");
      setCountry(data.country ?? "Malaysia");
    }

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [session]);

  function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setAvatarPreview(typeof reader.result === "string" ? reader.result : null);
    };
    reader.readAsDataURL(file);
  }

  async function saveProfile() {
    setSaveMessage("");
    saveLocalProfile({ displayName, businessType, country, avatarPreview });

    if (!supabase || !session?.user) {
      setSaveMessage("Profile saved locally. Login is required for cloud saving.");
      return;
    }

    const { error } = await supabase.from("user_profiles").upsert({
      id: session.user.id,
      display_name: displayName.trim(),
      business_type: businessType,
      country: country.trim() || "Malaysia",
      plan: accessPlan,
      updated_at: new Date().toISOString(),
    });

    setSaveMessage(
      error
        ? error.message.includes("schema cache") || error.message.includes("user_profiles")
        ? "Profile table is missing. Run SUPABASE_ACCESS_SETUP.sql in Supabase SQL Editor, then refresh this page."
          : error.message
        : "Profile saved to Supabase.",
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-300">User dashboard</p>
        <h1 className="mt-2 text-3xl font-bold text-white">Account, settings, rewards, and contribution status</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
          {session?.user.email
            ? `Signed in as ${session.user.email}. Your account data is stored with Supabase Auth and user_profiles.`
            : "Local developer Pro access is active. Supabase profile saving still requires a real signed-in user."}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Stat icon={Bookmark} label="Saved products" value="0" />
        <Stat icon={MessageCircle} label="Community posts" value="0" />
        <Stat icon={Award} label="Reward points" value="120" />
        <Stat icon={Crown} label="Plan" value={accessPlan === "pro" ? "Pro" : "Registered"} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.8fr_1fr]">
        <section className="rounded-xl border border-slate-800 bg-[#0d1322] p-6">
          <div className="mb-6 flex items-center gap-4">
            <div className="relative h-20 w-20 overflow-hidden rounded-full border border-cyan-400/30 bg-black/30">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Profile preview" className="h-full w-full object-cover" />
              ) : (
                <UserCircle className="h-full w-full p-4 text-slate-500" />
              )}
            </div>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-700 bg-white/5 px-4 py-3 text-sm font-bold text-white transition hover:border-cyan-400">
              <Camera className="h-4 w-4" />
              Add photo
              <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
            </label>
          </div>

          <div className="space-y-4">
            <Field label="Display name" value={displayName} onChange={setDisplayName} placeholder="Your public name" />
            <label className="grid gap-2 text-sm text-slate-300">
              Business type
              <select
                value={businessType}
                onChange={(event) => setBusinessType(event.target.value)}
                className="rounded-lg border border-slate-700 bg-black/30 px-4 py-3 text-white outline-none focus:border-cyan-400"
              >
                <option>Seller</option>
                <option>Dropshipper</option>
                <option>Brand owner</option>
                <option>Agency</option>
                <option>Researcher</option>
              </select>
            </label>
            <Field label="Country" value={country} onChange={setCountry} placeholder="Malaysia" />
            <button
              onClick={saveProfile}
              className="rounded-lg bg-cyan-500 px-5 py-3 font-bold text-slate-950 transition hover:bg-cyan-300"
            >
              Save profile
            </button>
            {saveMessage && <p className="text-sm text-cyan-300">{saveMessage}</p>}
          </div>
        </section>

        <section className="rounded-xl border border-slate-800 bg-[#0d1322] p-6">
          <div className="mb-5 flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-emerald-300" />
            <h2 className="text-xl font-bold text-white">Settings and rewards</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-black/20 p-4">
              <div>
                <p className="font-bold text-white">Performance alerts</p>
                <p className="mt-1 text-sm text-slate-500">Notify me when saved products move.</p>
              </div>
              <button
                onClick={() => setAlertsEnabled((value) => !value)}
                className={`rounded-full px-4 py-2 text-xs font-bold ${
                  alertsEnabled ? "bg-cyan-500 text-slate-950" : "bg-slate-800 text-slate-400"
                }`}
              >
                {alertsEnabled ? "On" : "Off"}
              </button>
            </div>

            {[
              "Submit useful product insight",
              "Share supplier feedback",
              "Report marketplace policy change",
              "Help validate trending product data",
            ].map((item, index) => (
              <div key={item} className="flex items-center justify-between rounded-lg border border-slate-800 bg-black/20 p-4">
                <span className="text-sm text-slate-300">{item}</span>
                <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-bold text-cyan-300">
                  +{(index + 1) * 25} pts
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-xl border border-slate-800 bg-[#0d1322] p-6">
        <div className="mb-5 flex items-center gap-3">
          <Bell className="h-5 w-5 text-cyan-300" />
          <h2 className="text-xl font-bold text-white">Account roadmap</h2>
        </div>
        <p className="text-sm leading-6 text-slate-400">
          Next account step: add Supabase Storage uploads for profile photos and sync reward points from community actions.
        </p>
      </section>
    </div>
  );
}

function loadLocalProfile() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LOCAL_PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveLocalProfile(profile: {
  displayName: string;
  businessType: string;
  country: string;
  avatarPreview: string | null;
}) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(profile));
}

function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-[#0d1322] p-5">
      <Icon className="mb-4 h-6 w-6 text-cyan-300" />
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="grid gap-2 text-sm text-slate-300">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="rounded-lg border border-slate-700 bg-black/30 px-4 py-3 text-white outline-none focus:border-cyan-400"
      />
    </label>
  );
}
