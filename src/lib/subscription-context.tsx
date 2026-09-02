"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

const CLINIC_SLUG = "demo-clinic";

interface SubscriptionContextValue {
  isProActive: boolean;
  isBetaTester: boolean;
  isLoading: boolean;
  broadcastMessage: string;
  broadcastActive: boolean;
}

export const SubscriptionContext = createContext<SubscriptionContextValue>({
  isProActive: false,
  isBetaTester: false,
  isLoading: true,
  broadcastMessage: "",
  broadcastActive: false,
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

  useEffect(() => {
    let cancelled = false;

    async function fetchSubscription() {
      const supabase = createClient();

      const [subResult, broadcastResult] = await Promise.all([
        supabase
          .from("clinic_subscriptions")
          .select("plan_tier, expires_at, is_beta_tester")
          .eq("clinic_slug", CLINIC_SLUG)
          .maybeSingle(),
        supabase
          .from("global_broadcasts")
          .select("message, is_active")
          .eq("id", 1)
          .maybeSingle(),
      ]);

      if (cancelled) return;

      // Clean Developer Logs (Press F12 in browser to view)
      console.log("=== SUBSCRIPTION CHECK ===");
      console.log("Slug:", CLINIC_SLUG);
      console.log("Data:", subResult.data);
      if (subResult.error) console.error("DB Error:", subResult.error);

      if (subResult.error || !subResult.data) {
        setIsProActive(false);
        setIsBetaTester(false);
      } else {
        const active =
          subResult.data.plan_tier === "pro" &&
          new Date(subResult.data.expires_at) > new Date();
        setIsProActive(active);
        setIsBetaTester(subResult.data.is_beta_tester || false);
      }

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
  }, []);

  return (
    <SubscriptionContext.Provider value={{ isProActive, isBetaTester, isLoading, broadcastMessage, broadcastActive }}>
      {children}
    </SubscriptionContext.Provider>
  );
}