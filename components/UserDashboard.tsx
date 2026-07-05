"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { Session } from "@supabase/supabase-js";
import { Award, Bell, Bookmark, Camera, Crown, MessageCircle, ShieldCheck, UserCircle } from "lucide-react";
import type { AccessPlan } from "@/components/AuthPanel";
import { getBrowserSupabaseClient } from "@/lib/supabase/browserClient";

const supabase = getBrowserSupabaseClient();

export default function UserDashboard({ session, accessPlan }: { session: Session | null; accessPlan: AccessPlan }) {
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [businessType, setBusinessType] = useState("Seller");
  const [country, setCountry] = useState("Malaysia");
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [saveMessage, setSaveMessage] = useState("");
  const [profileBusy, setProfileBusy] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const [communityPostCount, setCommunityPostCount] = useState(0);
  const [contributionPoints, setContributionPoints] = useState(0);
  const [contributionRank, setContributionRank] = useState("New Scout");
  const [contributionCount, setContributionCount] = useState(0);
  const [storageReady, setStorageReady] = useState<boolean | null>(null);

  useEffect(() => {
    if (!supabase || !session?.user) return;

    let isMounted = true;

    async function loadProfile() {
      const { data, error } = await supabase!
        .from("user_profiles")
        .select("display_name,business_type,country,avatar_url")
        .eq("id", session!.user.id)
        .maybeSingle();

      if (error) {
        setSaveMessage("Cloud profile sync is not ready yet. Your text changes will stay on this device until profile storage is enabled.");
        return;
      }

      if (!isMounted || !data) return;
      setDisplayName(data.display_name ?? "");
      setBusinessType(data.business_type ?? "Seller");
      setCountry(data.country ?? "Malaysia");
      setAvatarPreview(data.avatar_url ?? null);
    }

    async function loadSavedCount() {
      const { count } = await supabase!
        .from("user_watchlist")
        .select("id", { count: "exact", head: true })
        .eq("user_id", session!.user.id);

      if (isMounted) setSavedCount(count ?? 0);
    }

    async function loadCommunityStats() {
      const { count } = await supabase!
        .from("community_posts")
        .select("id", { count: "exact", head: true })
        .eq("user_id", session!.user.id);

      if (isMounted) setCommunityPostCount(count ?? 0);
    }

    async function loadContributionStats() {
      try {
        const response = await fetch("/api/community/contributor-profile", {
          cache: "no-store",
          headers: { Authorization: `Bearer ${session!.access_token}` },
        });
        const payload = await response.json();

        if (!isMounted || !response.ok || !payload.ok) {
          if (response.status >= 500) {
            console.warn("Contributor profile could not be loaded for dashboard.");
          }
          return;
        }

        setContributionPoints(Number(payload.profile?.total_points || 0));
        setContributionRank(String(payload.profile?.current_rank || "New Scout"));
        setContributionCount(Number(payload.profile?.submitted_count || 0));
      } catch (error) {
        console.warn("Contributor profile request failed:", error);
      }
    }

    async function checkAvatarStorage() {
      try {
        const { data, error } = await supabase!.storage.from("avatars").list("", { limit: 1 });
        if (!isMounted) return;
        setStorageReady(!error && Array.isArray(data));
      } catch {
        if (isMounted) setStorageReady(false);
      }
    }

    loadProfile();
    loadSavedCount();
    loadCommunityStats();
    loadContributionStats();
    checkAvatarStorage();

    return () => {
      isMounted = false;
    };
  }, [session]);

  async function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;
    if (!supabase || !session?.user) {
      setSaveMessage("Sign in to upload a profile photo.");
      return;
    }

    setAvatarBusy(true);
    setSaveMessage("");

    try {
      const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${session.user.id}/avatar-${Date.now()}.${extension}`;
      const upload = await supabase.storage.from("avatars").upload(path, file, {
        cacheControl: "3600",
        upsert: true,
      });

      if (upload.error) {
        throw upload.error;
      }

      const publicUrl = supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
      const { error } = await supabase.from("user_profiles").upsert({
        id: session.user.id,
        display_name: displayName.trim(),
        business_type: businessType,
        country: country.trim() || "Malaysia",
        avatar_url: publicUrl,
        plan: accessPlan,
        updated_at: new Date().toISOString(),
      });

      if (error) {
        throw error;
      }

      setAvatarPreview(publicUrl);
      setStorageReady(true);
      setSaveMessage("Profile photo saved to Supabase.");
    } catch (error) {
      console.warn("Avatar upload unavailable:", error);
      setStorageReady(false);
      setSaveMessage("Profile photo upload will be available once avatar storage is enabled.");
    } finally {
      setAvatarBusy(false);
    }
  }

  async function saveProfile() {
    setSaveMessage("");

    if (!supabase || !session?.user) {
      setSaveMessage("Login is required for cloud profile saving.");
      return;
    }

    setProfileBusy(true);

    const { error } = await supabase.from("user_profiles").upsert({
      id: session.user.id,
      display_name: displayName.trim(),
      business_type: businessType,
      country: country.trim() || "Malaysia",
      avatar_url: avatarPreview,
      plan: accessPlan,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.warn("Profile save failed:", error.message);
      setSaveMessage("Cloud profile sync is not ready yet. Your current details were not saved to Supabase.");
    } else {
      setSaveMessage("Profile saved to Supabase.");
    }
    setProfileBusy(false);
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-300">User dashboard</p>
        <h1 className="mt-2 text-3xl font-bold text-foreground">Account, settings, rewards, and contribution status</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          {session?.user.email
            ? `Signed in as ${session.user.email}. Text profile fields are saved to Supabase user_profiles.`
            : "Local developer Pro access is active. Supabase profile saving requires a real signed-in user."}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <a href="/?tab=research-hub" className="block transition hover:scale-105">
          <Stat icon={Bookmark} label="Saved products" value={String(savedCount)} />
        </a>
        <a href="/?tab=community" className="block transition hover:scale-105">
          <Stat icon={MessageCircle} label="Community posts" value={String(communityPostCount)} />
        </a>
        <a href="/?tab=community" className="block transition hover:scale-105">
          <Stat icon={Award} label="Reward points" value={String(contributionPoints)} />
        </a>
        <Stat icon={Crown} label="Rank" value={contributionRank || (accessPlan === "pro" ? "Pro" : "Registered")} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.8fr_1fr]">
        <section className="rounded-xl border border-border bg-card p-6">
          <div className="mb-6 flex items-center gap-4">
            <div className="relative h-20 w-20 overflow-hidden rounded-full border border-cyan-400/30 bg-muted">
              {avatarPreview ? (
                <Image src={avatarPreview} alt="Profile preview" fill unoptimized className="object-cover" />
              ) : (
                <UserCircle className="h-full w-full p-4 text-slate-500" />
              )}
            </div>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-white/5 px-4 py-3 text-sm font-bold text-foreground transition hover:border-cyan-400">
              <Camera className="h-4 w-4" />
              {avatarBusy ? "Uploading..." : storageReady === false ? "Add photo" : "Add photo"}
              <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" disabled={avatarBusy || !session?.user} />
            </label>
          </div>
          <p className="mb-4 rounded-lg border border-border bg-muted/50 p-3 text-xs leading-5 text-muted-foreground">
            {storageReady === false
              ? "Profile photo upload will appear here once the avatars storage bucket is enabled. Your text profile fields still save to Supabase."
              : "Display name, business type, country, plan, and avatar are stored in your Supabase profile when available."}
          </p>

          <div className="space-y-4">
            <Field label="Display name" value={displayName} onChange={setDisplayName} placeholder="Your public name" />
            <label className="grid gap-2 text-sm text-muted-foreground">
              Business type
              <select
                value={businessType}
                onChange={(event) => setBusinessType(event.target.value)}
                className="rounded-lg border border-border bg-muted px-4 py-3 text-foreground outline-none focus:border-cyan-400"
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
              disabled={profileBusy}
              className="rounded-lg bg-cyan-500 px-5 py-3 font-bold text-foreground transition hover:bg-cyan-300"
            >
              {profileBusy ? "Saving..." : "Save profile"}
            </button>
            {saveMessage && <p className="text-sm text-cyan-300">{saveMessage}</p>}
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-6">
          <div className="mb-5 flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-emerald-300" />
            <h2 className="text-xl font-bold text-foreground">Settings and rewards</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-border bg-muted/50 p-4">
              <div>
                <p className="font-bold text-foreground">Performance alerts</p>
                <p className="mt-1 text-sm text-slate-500">Notify me when saved products move.</p>
              </div>
              <button
                onClick={() => setAlertsEnabled((value) => !value)}
                className={`rounded-full px-4 py-2 text-xs font-bold ${
                  alertsEnabled ? "bg-cyan-500 text-foreground" : "bg-muted text-muted-foreground"
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
              <div key={item} className="flex items-center justify-between rounded-lg border border-border bg-muted/50 p-4">
                <span className="text-sm text-muted-foreground">{item}</span>
                <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-bold text-cyan-300">
                  +{(index + 1) * 25} pts
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-xl border border-border bg-card p-6">
        <div className="mb-5 flex items-center gap-3">
          <Bell className="h-5 w-5 text-cyan-300" />
          <h2 className="text-xl font-bold text-foreground">Account roadmap</h2>
        </div>
        <p className="text-sm leading-6 text-muted-foreground">
          {contributionCount > 0
            ? `Contribution rewards are tracked in Supabase: ${contributionCount} recommendations submitted and ${contributionPoints} points recorded.`
            : "No contributions yet. Share your first product recommendation to earn points."}
        </p>
      </section>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <Icon className="mb-4 h-6 w-6 text-cyan-300" />
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
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
    <label className="grid gap-2 text-sm text-muted-foreground">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="rounded-lg border border-border bg-muted px-4 py-3 text-foreground outline-none focus:border-cyan-400"
      />
    </label>
  );
}
