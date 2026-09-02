"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  Shield,
  Eye,
  EyeOff,
  BarChart3,
  Megaphone,
  Database,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  XCircle,
  Zap,
  RefreshCw,
  Plus,
  Loader2,
} from "lucide-react";

interface ClinicRow {
  id: string;
  clinic_slug: string;
  plan_tier: string;
  expires_at: string;
  total_rx_count: number | null;
  last_active_at: string | null;
  is_beta_tester: boolean;
}

function PasscodeScreen({ onUnlock }: { onUnlock: () => void }) {
  const [value, setValue] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const secret = process.env.NEXT_PUBLIC_FOUNDER_SECRET ?? "";
    if (value === secret) {
      onUnlock();
    } else {
      setError(true);
      setShake(true);
      setTimeout(() => setShake(false), 600);
      setTimeout(() => setError(false), 2500);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[600px] w-[600px] rounded-full bg-emerald-500/[0.08] blur-[120px]" />
      <div aria-hidden="true" className="pointer-events-none absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-cyan-500/[0.06] blur-[100px]" />
      <div
        className="relative z-10 w-full max-w-sm"
        style={shake ? { animation: "shake 0.4s ease" } : {}}
      >
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="h-20 w-20 rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/20 to-cyan-500/10 flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.15)]">
              <Shield className="h-9 w-9 text-emerald-400" strokeWidth={1.5} />
            </div>
            <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,1)] animate-pulse" />
          </div>
        </div>
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Founder Access</h1>
          <p className="text-sm text-slate-500 mt-1.5">Enter your passcode to access the control center</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              id="founder-passcode-input"
              type={showPass ? "text" : "password"}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="••••••••••••"
              autoFocus
              autoComplete="off"
              spellCheck={false}
              className={`w-full rounded-xl border px-4 py-3.5 pr-12 text-sm font-mono bg-slate-900/80 text-slate-100 placeholder:text-slate-700 outline-none transition-all duration-200 focus:ring-2 ${error ? "border-red-500/60 focus:ring-red-500/30" : "border-slate-800 focus:border-emerald-500/40 focus:ring-emerald-500/20"}`}
            />
            <button type="button" onClick={() => setShowPass((p) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors" aria-label={showPass ? "Hide" : "Show"}>
              {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {error && <p className="text-xs text-red-400 text-center">Invalid passcode. Try again.</p>}
          <button id="founder-unlock-btn" type="submit" className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3.5 text-sm font-semibold text-white shadow-[0_4px_20px_rgba(16,185,129,0.35)] hover:shadow-[0_4px_28px_rgba(16,185,129,0.5)] hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">
            Unlock Dashboard
          </button>
        </form>
        <p className="text-center text-xs text-slate-700 mt-6">Opedox · Founder Control Center</p>
      </div>
      <style>{`@keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px)} 40%{transform:translateX(8px)} 60%{transform:translateX(-6px)} 80%{transform:translateX(6px)} }`}</style>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, sub }: { label: string; value: number | string; icon: React.ElementType; color: "emerald" | "sky" | "rose"; sub?: string }) {
  const colorMap = {
    emerald: { bg: "from-emerald-500/10 to-teal-500/5", border: "border-emerald-500/20", icon: "bg-emerald-500/15 text-emerald-400", text: "text-emerald-400" },
    sky: { bg: "from-sky-500/10 to-cyan-500/5", border: "border-sky-500/20", icon: "bg-sky-500/15 text-sky-400", text: "text-sky-400" },
    rose: { bg: "from-rose-500/10 to-red-500/5", border: "border-rose-500/20", icon: "bg-rose-500/15 text-rose-400", text: "text-rose-400" },
  };
  const c = colorMap[color];
  return (
    <div className={`rounded-2xl border ${c.border} bg-gradient-to-br ${c.bg} p-5 flex items-center gap-4`}>
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${c.icon}`}>
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-slate-500">{label}</p>
        <p className={`text-3xl font-bold tracking-tight ${c.text}`}>{value}</p>
        {sub && <p className="text-xs text-slate-600 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function Toggle({ checked, onChange, id, disabled }: { checked: boolean; onChange: (v: boolean) => void; id: string; disabled?: boolean }) {
  return (
    <button id={id} role="switch" aria-checked={checked} disabled={disabled} onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${checked ? "bg-emerald-500 border-emerald-400/50" : "bg-slate-700 border-slate-600"} ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}>
      <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform duration-200 ${checked ? "translate-x-[18px]" : "translate-x-0.5"}`} />
    </button>
  );
}

function FounderDashboard() {
  const supabase = createClient();
  const [clinics, setClinics] = useState<ClinicRow[]>([]);
  const [loadingClinics, setLoadingClinics] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [newSlug, setNewSlug] = useState("");
  const [provisioning, setProvisioning] = useState(false);
  const [provisionMsg, setProvisionMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [broadcastActive, setBroadcastActive] = useState(false);
  const [savingBroadcast, setSavingBroadcast] = useState(false);
  const [broadcastSaved, setBroadcastSaved] = useState(false);
  const [actionLoading, setActionLoading] = useState<Record<string, string>>({});

  const fetchClinics = useCallback(async () => {
    setLoadingClinics(true);
    setFetchError(null);
    const { data, error } = await supabase.from("clinic_subscriptions").select("id, clinic_slug, plan_tier, expires_at, total_rx_count, last_active_at, is_beta_tester").order("clinic_slug");
    if (error) {
      console.error("[fetchClinics] Supabase error:", error);
      setFetchError(error.message);
    } else if (data) {
      setClinics(data as ClinicRow[]);
    }
    setLoadingClinics(false);
  }, [supabase]);

  const fetchBroadcast = useCallback(async () => {
    const { data } = await supabase.from("global_broadcasts").select("message, is_active").eq("id", 1).maybeSingle();
    if (data) { setBroadcastMsg(data.message ?? ""); setBroadcastActive(data.is_active ?? false); }
  }, [supabase]);

  useEffect(() => { fetchClinics(); fetchBroadcast(); }, [fetchClinics, fetchBroadcast]);

  const now = new Date();
  const total = clinics.length;
  const activePro = clinics.filter(c => c.plan_tier === "pro" && new Date(c.expires_at) > now).length;
  const expired = clinics.filter(c => c.plan_tier !== "pro" || new Date(c.expires_at) <= now).length;

  async function handleProvision(e: React.FormEvent) {
    e.preventDefault();
    const slug = newSlug.trim().toLowerCase().replace(/\s+/g, "-");
    if (!slug) return;
    setProvisioning(true); setProvisionMsg(null);
    const expiresAt = new Date(); expiresAt.setDate(expiresAt.getDate() + 7);
    const { error } = await supabase.from("clinic_subscriptions").insert({ clinic_slug: slug, plan_tier: "free", expires_at: expiresAt.toISOString(), is_beta_tester: false });
    if (error) {
      console.error("[handleProvision] Supabase error:", error);
      setProvisionMsg({ type: "err", text: error.message });
    } else {
      setProvisionMsg({ type: "ok", text: `Provisioned "${slug}"` });
      setNewSlug("");
      await fetchClinics();
    }
    setProvisioning(false);
  }

  async function handleSaveBroadcast() {
    setSavingBroadcast(true);
    await supabase.from("global_broadcasts").update({ message: broadcastMsg, is_active: broadcastActive }).eq("id", 1);
    setSavingBroadcast(false); setBroadcastSaved(true); setTimeout(() => setBroadcastSaved(false), 2000);
  }

  async function handleGrantPro(clinic: ClinicRow) {
    setActionLoading(p => ({ ...p, [clinic.id]: "pro" }));
    const expiry = new Date(); expiry.setDate(expiry.getDate() + 30);
    // Optimistic update
    setClinics(prev => prev.map(c => c.id === clinic.id ? { ...c, plan_tier: "pro", expires_at: expiry.toISOString() } : c));
    const { error } = await supabase.from("clinic_subscriptions").update({ plan_tier: "pro", expires_at: expiry.toISOString() }).eq("id", clinic.id);
    if (error) {
      console.error("[handleGrantPro] Supabase error:", error);
      // Roll back optimistic update
      setClinics(prev => prev.map(c => c.id === clinic.id ? { ...clinic } : c));
      alert(`Failed to grant Pro: ${error.message}`);
    }
    setActionLoading(p => { const n = { ...p }; delete n[clinic.id]; return n; });
  }

  async function handleRevoke(clinic: ClinicRow) {
    setActionLoading(p => ({ ...p, [clinic.id]: "revoke" }));
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    // Optimistic update
    setClinics(prev => prev.map(c => c.id === clinic.id ? { ...c, plan_tier: "free", expires_at: yesterday.toISOString() } : c));
    const { error } = await supabase.from("clinic_subscriptions").update({ plan_tier: "free", expires_at: yesterday.toISOString() }).eq("id", clinic.id);
    if (error) {
      console.error("[handleRevoke] Supabase error:", error);
      // Roll back optimistic update
      setClinics(prev => prev.map(c => c.id === clinic.id ? { ...clinic } : c));
      alert(`Failed to revoke access: ${error.message}`);
    }
    setActionLoading(p => { const n = { ...p }; delete n[clinic.id]; return n; });
  }

  async function handleBetaToggle(clinic: ClinicRow, val: boolean) {
    setActionLoading(p => ({ ...p, [clinic.id]: "beta" }));
    setClinics(prev => prev.map(c => c.id === clinic.id ? { ...c, is_beta_tester: val } : c));
    await supabase.from("clinic_subscriptions").update({ is_beta_tester: val }).eq("id", clinic.id);
    setActionLoading(p => { const n = { ...p }; delete n[clinic.id]; return n; });
  }

  function isActive(clinic: ClinicRow) { return clinic.plan_tier === "pro" && new Date(clinic.expires_at) > now; }
  function fmtDate(d: string | null) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" });
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-5 sm:p-8 relative overflow-x-hidden">
      <div aria-hidden="true" className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-emerald-500/[0.06] blur-[120px]" />
      <div aria-hidden="true" className="pointer-events-none fixed bottom-0 right-0 h-[400px] w-[500px] rounded-full bg-cyan-500/[0.05] blur-[100px]" />
      <div className="relative z-10 max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/20 to-cyan-500/10 flex items-center justify-center">
              <Shield className="h-5 w-5 text-emerald-400" strokeWidth={1.75} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-100 tracking-tight">Founder Control Center</h1>
              <p className="text-xs text-slate-600">Opedox · God Mode · Internal Only</p>
            </div>
          </div>
          <button id="founder-refresh-btn" onClick={fetchClinics} disabled={loadingClinics} className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-2 text-sm text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-all duration-200 disabled:opacity-50">
            <RefreshCw className={`h-3.5 w-3.5 ${loadingClinics ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>

        {/* Metrics + Provision */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard label="Total Clinics" value={total} icon={Database} color="sky" />
          <StatCard label="Active Pro" value={activePro} icon={TrendingUp} color="emerald" sub="Live subscribers" />
          <StatCard label="Expired / Free" value={expired} icon={TrendingDown} color="rose" sub="Churn candidates" />
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/15 text-violet-400"><Plus className="h-4 w-4" strokeWidth={1.75} /></div>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Provision Clinic</p>
            </div>
            <form id="founder-provision-form" onSubmit={handleProvision} className="flex gap-2">
              <input id="founder-provision-slug-input" type="text" value={newSlug} onChange={e => setNewSlug(e.target.value)} placeholder="clinic-slug"
                className="flex-1 min-w-0 rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-xs text-slate-200 placeholder:text-slate-700 focus:outline-none focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/20 transition-all" />
              <button id="founder-provision-btn" type="submit" disabled={provisioning || !newSlug.trim()} className="shrink-0 rounded-lg bg-violet-600 hover:bg-violet-500 px-3 py-2 text-xs font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                {provisioning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Add"}
              </button>
            </form>
            {provisionMsg && <p className={`text-xs mt-2 ${provisionMsg.type === "ok" ? "text-emerald-400" : "text-red-400"}`}>{provisionMsg.text}</p>}
          </div>
        </div>

        {/* Broadcast Card */}
        <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/[0.08] to-orange-500/[0.05] p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400"><Megaphone className="h-4 w-4" strokeWidth={1.75} /></div>
            <div>
              <h2 className="text-sm font-semibold text-slate-200">Global Broadcast Banner</h2>
              <p className="text-xs text-slate-600">Shown to all clinic users when active</p>
            </div>
          </div>
          <div className="space-y-4">
            <textarea id="founder-broadcast-message-input" value={broadcastMsg} onChange={e => setBroadcastMsg(e.target.value)}
              placeholder="e.g. We are performing maintenance on Sunday 3 AM – 5 AM PKT. Expect brief disruptions." rows={3}
              className="w-full rounded-xl border border-slate-800/80 bg-slate-900/60 px-4 py-3 text-sm text-slate-200 placeholder:text-slate-700 focus:outline-none focus:border-amber-500/40 focus:ring-1 focus:ring-amber-500/20 resize-none transition-all" />
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <Toggle id="founder-broadcast-active-toggle" checked={broadcastActive} onChange={setBroadcastActive} />
                <span className="text-sm text-slate-400">
                  {broadcastActive ? <span className="text-emerald-400 font-medium">Active — visible to all users</span> : "Inactive — banner is hidden"}
                </span>
              </div>
              <button id="founder-broadcast-save-btn" onClick={handleSaveBroadcast} disabled={savingBroadcast}
                className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-200 disabled:opacity-50 ${broadcastSaved ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30" : "bg-amber-600 hover:bg-amber-500 text-white shadow-[0_4px_14px_rgba(245,158,11,0.3)]"}`}>
                {savingBroadcast ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : broadcastSaved ? <><CheckCircle2 className="h-3.5 w-3.5" />Saved!</> : <><Zap className="h-3.5 w-3.5" />Update Banner</>}
              </button>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/30 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800/60">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800/80 text-slate-400"><BarChart3 className="h-4 w-4" strokeWidth={1.75} /></div>
              <div>
                <h2 className="text-sm font-semibold text-slate-200">Clinic Subscriptions</h2>
                <p className="text-xs text-slate-600">{total} clinic{total !== 1 ? "s" : ""} · live data</p>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            {loadingClinics ? (
              <div className="flex items-center justify-center py-16 text-slate-600"><Loader2 className="h-6 w-6 animate-spin mr-3" /><span className="text-sm">Loading clinics…</span></div>
            ) : fetchError ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <XCircle className="h-8 w-8 text-red-500/60" />
                <p className="text-sm font-medium text-red-400">Failed to load clinics</p>
                <p className="text-xs text-red-500/70 font-mono max-w-sm text-center break-all">{fetchError}</p>
                <button onClick={fetchClinics} className="mt-1 rounded-lg border border-slate-700 bg-slate-800/60 px-4 py-1.5 text-xs text-slate-300 hover:text-white transition-colors">Retry</button>
              </div>
            ) : clinics.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-600 gap-2"><Database className="h-8 w-8 opacity-30" /><p className="text-sm">No clinics found</p></div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800/60 text-left">
                    {["Clinic Slug","Status","Plan Tier","Expires At","Total Rx","Last Active","Beta","Actions"].map(h => (
                      <th key={h} className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-slate-600 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {clinics.map((clinic, i) => {
                    const active = isActive(clinic);
                    const loading = actionLoading[clinic.id];
                    return (
                      <tr key={clinic.id} className={`border-b border-slate-800/40 transition-colors hover:bg-slate-800/20 ${i % 2 === 0 ? "" : "bg-slate-900/20"}`}>
                        <td className="px-5 py-4 font-mono text-xs text-slate-300 whitespace-nowrap">{clinic.clinic_slug}</td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          {active
                            ? <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-400 border border-emerald-500/20"><CheckCircle2 className="h-3 w-3" />Active</span>
                            : <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-2.5 py-1 text-[11px] font-semibold text-rose-400 border border-rose-500/20"><XCircle className="h-3 w-3" />Expired</span>}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className={`text-xs font-semibold uppercase tracking-wide ${clinic.plan_tier === "pro" ? "text-emerald-400" : "text-slate-500"}`}>{clinic.plan_tier}</span>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className="flex items-center gap-1.5 text-xs text-slate-400"><Clock className="h-3 w-3 text-slate-600" />{fmtDate(clinic.expires_at)}</span>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                           <span className={`text-sm font-semibold ${(clinic.total_rx_count ?? 0) > 100 ? "text-emerald-400" : (clinic.total_rx_count ?? 0) > 20 ? "text-amber-400" : "text-slate-500"}`}>{clinic.total_rx_count ?? 0}</span>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-xs text-slate-500">{fmtDate(clinic.last_active_at)}</td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <Toggle id={`beta-toggle-${clinic.id}`} checked={clinic.is_beta_tester} onChange={v => handleBetaToggle(clinic, v)} disabled={loading === "beta"} />
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <button id={`grant-pro-btn-${clinic.id}`} onClick={() => handleGrantPro(clinic)} disabled={!!loading}
                              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-[11px] font-semibold text-white transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_2px_8px_rgba(16,185,129,0.25)]">
                              {loading === "pro" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}
                              Grant Pro (30d)
                            </button>
                            <button id={`revoke-btn-${clinic.id}`} onClick={() => handleRevoke(clinic)} disabled={!!loading}
                              className="flex items-center gap-1.5 rounded-lg border border-rose-500/40 bg-rose-500/[0.08] hover:bg-rose-500/15 hover:border-rose-500/60 px-3 py-1.5 text-[11px] font-semibold text-rose-400 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed">
                              {loading === "revoke" ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3" />}
                              Revoke Access
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-slate-800 pb-4">Opedox Founder Dashboard · Internal Use Only</p>
      </div>
    </div>
  );
}

export default function FounderPage() {
  const [unlocked, setUnlocked] = useState(false);
  return unlocked ? <FounderDashboard /> : <PasscodeScreen onUnlock={() => setUnlocked(true)} />;
}