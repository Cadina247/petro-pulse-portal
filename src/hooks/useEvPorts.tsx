import { useCallback, useEffect, useId, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const db = supabase as any;

export interface EvPort {
  id: string;
  owner_id: string;
  port_code: string;
  charging_type: string;
  power_kw: number;
  connector_type: string;
  price_per_kwh: number;
  currency: string;
  operating_hours: string | null;
  is_available: boolean;
  maintenance_status: string;
  sort_order: number;
}

export function useEvPorts() {
  const { user } = useAuth();
  const [ports, setPorts] = useState<EvPort[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await db
      .from("ev_ports")
      .select("*")
      .eq("owner_id", user.id)
      .order("sort_order", { ascending: true });
    setPorts((data as EvPort[]) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const loadRef = useRef(load);
  useEffect(() => {
    loadRef.current = load;
  }, [load]);

  const instanceId = useId();

  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel(`ev_ports:${user.id}:${instanceId}`);
    channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table: "ev_ports", filter: `owner_id=eq.${user.id}` },
      () => loadRef.current(),
    );
    channel.subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, instanceId]);

  const addPort = async (input: Partial<EvPort>) => {
    if (!user) throw new Error("Not signed in");
    const { error } = await db.from("ev_ports").insert({
      owner_id: user.id,
      port_code: (input.port_code || `EV ${ports.length + 1}`).trim(),
      charging_type: input.charging_type ?? "Level 2",
      power_kw: input.power_kw ?? 0,
      connector_type: input.connector_type ?? "Type 2",
      price_per_kwh: input.price_per_kwh ?? 0,
      operating_hours: input.operating_hours ?? null,
      sort_order: ports.length + 1,
    });
    if (error) throw error;
    await load();
  };

  const updatePort = async (id: string, patch: Partial<EvPort>) => {
    const prev = ports;
    setPorts((p) => p.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    const { error } = await db.from("ev_ports").update(patch).eq("id", id);
    if (error) {
      setPorts(prev);
      throw error;
    }
  };

  const deletePort = async (id: string) => {
    const prev = ports;
    setPorts((p) => p.filter((x) => x.id !== id));
    const { error } = await db.from("ev_ports").delete().eq("id", id);
    if (error) {
      setPorts(prev);
      throw error;
    }
  };

  return { ports, loading, addPort, updatePort, deletePort, reload: load };
}
