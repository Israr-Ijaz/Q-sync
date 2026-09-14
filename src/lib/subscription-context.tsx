"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";

interface SubscriptionContextValue {
  isProActive: boolean;
  isBetaTester: boolean;
  isLoading: boolean;
  broadcastMessage: string;
  broadcastActive: boolean;
  /** Exposed for debugging — null means not yet resolved */
  clinicSlug: string | null;
}

export const SubscriptionContext = createContext<SubscriptionContextValue>({
  isProActive: false,
  isBetaTester: false,
  isLoading: true,
  broadcastMessage: "",
  broadcastActive: false,
  clinicSlug: null,
});

export function useSubscription(): SubscriptionContextValue {
  return useContext(SubscriptionContext);
}

export function SubscriptionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isProActive, setIsProActive] = useState(false);
  const [isBetaTester, setIsBetaTester] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastActive, setBroadcastActive] = useState(false);
  const [clinicSlug, setClinicSlug] = useState<string | null>(null);

  // ── Shared Supabase client (stable across renders) ────────────────────────
  const supabase = createClient();

  // ── Apply a raw subscription row to React state ───────────────────────────
  const applySubRow = useCallback(
    (row: { plan_tier: string; expires_at: string; is_beta_tester: boolean } | null) => {
      if (!row) {
        // Row is null — this is an explicit problem, not a graceful miss.
        // Log clearly so it shows up in DevTools, then default to false.
        console.error(
          "[SubscriptionProvider] ❌ clinic_subscriptions row is NULL for this clinic. " +
          "Check: (1) RLS policy allows authenticated users to SELECT their clinic row, " +
          "(2) a row exists in clinic_subscriptions with the correct clinic_slug."
        );
        setIsProActive(false);
        setIsBetaTester(false);
        return;
      }
      const active =
        row.plan_tier === "pro" && new Date(row.expires_at) > new Date();

      console.log(
        `[SubscriptionProvider] ✅ plan_tier="${row.plan_tier}", expires_at="${row.expires_at}", active=${active}`
      );

      setIsProActive(active);
      setIsBetaTester(row.is_beta_tester || false);
    },
    []
  );

  // ── Initial fetch — resolves user → clinic → subscription ─────────────────
  useEffect(() => {
    let cancelled = false;

    async function fetchSubscription() {
      // 1. Get the currently authenticated user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (cancelled) return;

      if (userError || !user) {
        console.error("[SubscriptionProvider] ❌ No authenticated user:", userError?.message);
        setIsLoading(false);
        return;
      }

      console.log("[SubscriptionProvider] Auth user id:", user.id);

      // 2. Look up the user's profile to get their clinic_id and the clinic slug
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("clinic_id, clinics(slug)")
        .eq("id", user.id)
        .maybeSingle();

      if (cancelled) return;

      if (profileError) {
        console.error("[SubscriptionProvider] ❌ profiles query error:", profileError.message);
        setIsLoading(false);
        return;
      }

      if (!profile?.clinic_id) {
        console.error(
          "[SubscriptionProvider] ❌ Profile has no clinic_id for user", user.id,
          "— profile row:", profile
        );
        setIsLoading(false);
        return;
      }

      // Supabase returns joined rows as objects or arrays depending on relation type
      const rawSlug = (profile as { clinics?: { slug?: string } | { slug?: string }[] }).clinics;
      const resolvedSlug = Array.isArray(rawSlug)
        ? rawSlug[0]?.slug ?? null
        : (rawSlug as { slug?: string } | undefined)?.slug ?? null;

      if (!resolvedSlug) {
        console.error(
          "[SubscriptionProvider] ❌ Could not resolve clinic slug from clinics join. " +
          "Verify the `clinics` foreign key on profiles.clinic_id exists and has RLS SELECT enabled."
        );
        setIsLoading(false);
        return;
      }

      console.log("[SubscriptionProvider] Resolved clinic_slug:", resolvedSlug);
      setClinicSlug(resolvedSlug);

      // 3. Fetch subscription + broadcast in parallel, both keyed by the real slug
      const [subResult, broadcastResult] = await Promise.all([
        supabase
          .from("clinic_subscriptions")
          .select("plan_tier, expires_at, is_beta_tester")
          .eq("clinic_slug", resolvedSlug)
          .maybeSingle(),
        supabase
          .from("global_broadcasts")
          .select("message, is_active")
          .eq("id", 1)
          .maybeSingle(),
      ]);

      if (cancelled) return;

      // Log the raw Supabase response so errors are never silently swallowed
      console.log("=== SUBSCRIPTION CHECK ===");
      console.log("Slug:", resolvedSlug);
      console.log("Data:", subResult.data);
      if (subResult.error) {
        console.error(
          "[SubscriptionProvider] ❌ clinic_subscriptions SELECT error — likely an RLS block:",
          subResult.error
        );
      }

      applySubRow(subResult.data ?? null);

      if (broadcastResult.data) {
        setBroadcastMessage(broadcastResult.data.message ?? "");
        setBroadcastActive(broadcastResult.data.is_active ?? false);
      }

      setIsLoading(false);
    }

    fetchSubscription();
    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Realtime listener — reacts instantly when Founder grants/revokes Pro ──
  useEffect(() => {
    if (!clinicSlug) return; // Don't subscribe until slug is resolved

    const channel = supabase
      .channel(`subscription-live:${clinicSlug}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "clinic_subscriptions",
          filter: `clinic_slug=eq.${clinicSlug}`,
        },
        (payload) => {
          console.log("[SubscriptionProvider] Realtime UPDATE received:", payload.new);
          applySubRow(
            payload.new as {
              plan_tier: string;
              expires_at: string;
              is_beta_tester: boolean;
            }
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clinicSlug]); // Re-subscribe if slug changes

  return (
    <SubscriptionContext.Provider
      value={{ isProActive, isBetaTester, isLoading, broadcastMessage, broadcastActive, clinicSlug }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}