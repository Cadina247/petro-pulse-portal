import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const db = supabase as any;

export interface StationService {
  id: string;
  owner_id: string;
  account_type: string;
  name: string;
  category: string;
  description: string | null;
  is_free: boolean;
  is_available: boolean;
  sort_order: number;
}

export function useServices(accountType: string = "station") {
  const { user } = useAuth();
  const [services, setServices] = useState<StationService[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await db
      .from("services")
      .select("*")
      .eq("owner_id", user.id)
      .order("sort_order", { ascending: true });
    setServices((data as StationService[]) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const addService = async (input: {
    name: string;
    category?: string;
    is_free?: boolean;
    description?: string;
  }) => {
    if (!user) throw new Error("Not signed in");
    const { error } = await db.from("services").insert({
      owner_id: user.id,
      account_type: accountType,
      name: input.name.trim(),
      category: input.category?.trim() || "other",
      description: input.description ?? null,
      is_free: input.is_free ?? false,
      is_available: true,
      sort_order: services.length + 1,
    });
    if (error) throw error;
    await load();
  };

  const updateService = async (id: string, patch: Partial<StationService>) => {
    const prev = services;
    setServices((s) => s.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    const { error } = await db.from("services").update(patch).eq("id", id);
    if (error) {
      setServices(prev);
      throw error;
    }
  };

  const deleteService = async (id: string) => {
    const prev = services;
    setServices((s) => s.filter((x) => x.id !== id));
    const { error } = await db.from("services").delete().eq("id", id);
    if (error) {
      setServices(prev);
      throw error;
    }
  };

  return { services, loading, addService, updateService, deleteService, reload: load };
}
