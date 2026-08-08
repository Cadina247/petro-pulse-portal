import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type AccountType = "station" | "vendor";

export interface AccountRecord {
  [key: string]: any;
}

export function useAccount() {
  const { user } = useAuth();
  const [type, setType] = useState<AccountType | null>(null);
  const [record, setRecord] = useState<AccountRecord | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setRecord(null);
      setType(null);
      setLoading(false);
      return;
    }
    setLoading(true);

    const metaType = (user.user_metadata as any)?.account_type as AccountType | undefined;

    const { data: vendor } = await (supabase as any)
      .from("vendors")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (vendor) {
      setType("vendor");
      setRecord(vendor);
      setLoading(false);
      return;
    }

    const { data: station } = await (supabase as any)
      .from("stations")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (station) {
      setType("station");
      setRecord(station);
    } else {
      setType(metaType ?? "station");
      setRecord(null);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const setAvailability = useCallback(
    async (value: boolean) => {
      if (!user || !type) return { error: new Error("Not ready") } as any;
      const table = type === "vendor" ? "vendors" : "stations";
      const column = type === "vendor" ? "user_id" : "id";
      const { error } = await (supabase as any)
        .from(table)
        .update({ is_available: value })
        .eq(column, user.id);
      if (!error) setRecord((r) => (r ? { ...r, is_available: value } : r));
      return { error };
    },
    [user, type]
  );

  return { type, record, loading, reload: load, setAvailability };
}
