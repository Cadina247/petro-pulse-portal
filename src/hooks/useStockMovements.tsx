import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const db = supabase as any;

export interface StockMovement {
  id: string;
  station_id: string;
  product_id: string | null;
  product_name: string;
  kind: string;
  quantity: number;
  unit: string;
  note: string | null;
  created_at: string;
}

export function useStockMovements() {
  const { user } = useAuth();
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await db
      .from("fuel_stock_movements")
      .select("*")
      .eq("station_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    setMovements((data as StockMovement[]) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const addMovement = async (input: {
    product_id: string;
    product_name: string;
    kind: string;
    quantity: number;
    unit: string;
    note?: string;
  }) => {
    if (!user) throw new Error("Not signed in");
    const { error } = await db.from("fuel_stock_movements").insert({
      station_id: user.id,
      product_id: input.product_id,
      product_name: input.product_name,
      kind: input.kind,
      quantity: input.quantity,
      unit: input.unit,
      note: input.note ?? null,
    });
    if (error) throw error;
    await load();
  };

  return { movements, loading, addMovement, reload: load };
}
