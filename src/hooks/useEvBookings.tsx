import { useCallback, useEffect, useId, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const db = supabase as any;

export interface EvBooking {
  id: string;
  owner_id: string;
  port_id: string | null;
  customer_name: string;
  customer_phone: string | null;
  booking_date: string;
  start_time: string;
  duration_minutes: number;
  status: string;
  payment_status: string;
  amount: number;
  notes: string | null;
  created_at: string;
}

export function useEvBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<EvBooking[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await db
      .from("ev_bookings")
      .select("*")
      .eq("owner_id", user.id)
      .order("booking_date", { ascending: false })
      .limit(100);
    setBookings((data as EvBooking[]) ?? []);
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
    const channel = supabase.channel(`ev_bookings:${user.id}:${instanceId}`);
    channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table: "ev_bookings", filter: `owner_id=eq.${user.id}` },
      () => loadRef.current(),
    );
    channel.subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, instanceId]);

  const updateBooking = async (id: string, patch: Partial<EvBooking>) => {
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
    const { error } = await db.from("ev_bookings").update(patch).eq("id", id);
    if (error) {
      await load();
      throw error;
    }
  };

  return { bookings, loading, updateBooking, reload: load };
}
