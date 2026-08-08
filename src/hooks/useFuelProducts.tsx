import { useCallback, useEffect, useId, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface FuelProduct {
  id: string;
  station_id: string;
  product_name: string;
  price: number;
  quantity_available: number;
  capacity: number;
  is_available: boolean;
  unit: string;
  currency: string;
  sort_order: number;
  last_updated_at: string;
}

// The generated types file is pinned to the old project, so we go untyped here.
const db = supabase as any;

export function useFuelProducts() {
  const { user } = useAuth();
  const [products, setProducts] = useState<FuelProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const { data, error } = await db
      .from("fuel_products")
      .select("*")
      .eq("station_id", user.id)
      .order("sort_order", { ascending: true });
    if (!error && data) setProducts(data as FuelProduct[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  // Keep a stable ref to the latest loader so the realtime effect
  // never re-runs just because `load` was re-created.
  const loadRef = useRef(load);
  useEffect(() => {
    loadRef.current = load;
  }, [load]);

  // Unique per hook instance so multiple components don't collide on one channel.
  const instanceId = useId();

  // Live updates from the same table the mobile app reads.
  useEffect(() => {
    if (!user) return;

    // Fresh channel every run: create -> attach listeners -> subscribe.
    const channel = supabase.channel(`fuel_products:${user.id}:${instanceId}`);

    channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "fuel_products",
        filter: `station_id=eq.${user.id}`,
      },
      () => loadRef.current(),
    );

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, instanceId]);

  // Optimistic local edit (no network).
  const patchLocal = (id: string, patch: Partial<FuelProduct>) =>
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  // Persist a single field change immediately.
  const updateProduct = async (id: string, patch: Partial<FuelProduct>) => {
    patchLocal(id, patch);
    const { error } = await db.from("fuel_products").update(patch).eq("id", id);
    if (error) {
      await load();
      throw error;
    }
  };

  // Persist every row currently held in state.
  const saveAll = async () => {
    setSaving(true);
    try {
      for (const p of products) {
        const { error } = await db
          .from("fuel_products")
          .update({
            price: p.price,
            quantity_available: p.quantity_available,
            is_available: p.is_available,
            unit: p.unit,
          })
          .eq("id", p.id);
        if (error) throw error;
      }
    } finally {
      setSaving(false);
    }
  };

  return { products, loading, saving, patchLocal, updateProduct, saveAll, reload: load };
}
