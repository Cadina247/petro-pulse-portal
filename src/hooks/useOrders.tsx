import { useCallback, useEffect, useId, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface Order {
  id: string;
  station_id: string;
  customer_name: string;
  customer_phone: string | null;
  product_name: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total_amount: number;
  delivery_address: string | null;
  notes: string | null;
  status: string;
  created_at: string;
}

const db = supabase as any;

export function useOrders() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [missingTable, setMissingTable] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const { data, error } = await db
      .from("orders")
      .select("*")
      .eq("station_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) setMissingTable(true);
    else setOrders((data ?? []) as Order[]);
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
    const channel = supabase.channel(`orders:${user.id}:${instanceId}`);

    channel.on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "orders", filter: `station_id=eq.${user.id}` },
      (payload: any) => {
        const o = payload.new as Order;
        toast({
          title: "New incoming order",
          description: `${o.customer_name} ordered ${o.quantity}${o.unit} of ${o.product_name}.`,
        });
        loadRef.current();
      },
    );

    channel.on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "orders", filter: `station_id=eq.${user.id}` },
      () => loadRef.current(),
    );

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, instanceId]);

  const updateStatus = async (id: string, status: string) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    const { error } = await db.from("orders").update({ status }).eq("id", id);
    if (error) {
      await load();
      throw error;
    }
  };

  const pendingCount = orders.filter((o) => o.status === "pending").length;

  return { orders, loading, missingTable, pendingCount, updateStatus, reload: load };
}
