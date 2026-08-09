import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const db = supabase as any;

export interface Wallet {
  id: string;
  owner_id: string;
  account_type: string;
  balance_cents: number;
  currency: string;
}

export interface CreditTransaction {
  id: string;
  amount_cents: number;
  kind: string;
  description: string | null;
  created_at: string;
}

export function useWallet() {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setWallet(null);
      setLoading(false);
      return;
    }
    const { data } = await db
      .from("wallets")
      .select("*")
      .eq("owner_id", user.id)
      .maybeSingle();
    setWallet((data as Wallet) ?? null);

    const { data: tx } = await db
      .from("credit_transactions")
      .select("id, amount_cents, kind, description, created_at")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);
    setTransactions((tx as CreditTransaction[]) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const topUp = useCallback(
    async (naira: number, description = "Wallet top-up") => {
      if (!user) throw new Error("Not signed in");
      let walletId = wallet?.id;
      if (!walletId) {
        const { data, error } = await db
          .from("wallets")
          .insert({ owner_id: user.id })
          .select("id")
          .single();
        if (error) throw error;
        walletId = data.id;
      }
      const { error } = await db.from("credit_transactions").insert({
        wallet_id: walletId,
        owner_id: user.id,
        amount_cents: Math.round(naira * 100),
        kind: "topup",
        description,
      });
      if (error) throw error;
      await load();
    },
    [user, wallet, load],
  );

  const balance = (wallet?.balance_cents ?? 0) / 100;

  return {
    wallet,
    transactions,
    loading,
    balance,
    hasCredit: balance > 0,
    topUp,
    reload: load,
  };
}
