import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Wallet as WalletIcon, Loader2, AlertTriangle, Plus } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/hooks/useWallet";

const QUICK_AMOUNTS = [1000, 2500, 5000, 10000];

export function WalletCredit() {
  const { balance, hasCredit, transactions, loading, topUp } = useWallet();
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);

  const handleTopUp = async (value: number) => {
    if (!value || value <= 0) {
      toast({ title: "Enter a valid amount", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      await topUp(value);
      setAmount("");
      toast({
        title: "Credit added",
        description: `₦${value.toLocaleString()} added to your wallet. Your listings are live again.`,
      });
    } catch {
      toast({ title: "Top-up failed", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <WalletIcon className="w-5 h-5 text-primary" />
          Wallet &amp; Credit
        </CardTitle>
        <Badge variant={hasCredit ? "default" : "destructive"}>
          {hasCredit ? "Listings active" : "Out of credit"}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground">Available credit</p>
          <p className="text-3xl font-bold">
            {loading ? "—" : `₦${balance.toLocaleString()}`}
          </p>
        </div>

        {!hasCredit && !loading && (
          <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <AlertTriangle className="w-4 h-4 text-destructive mt-0.5" />
            <span className="text-sm text-destructive">
              You are out of credit. Paid listings (fuel, gas, car wash, EV charging) are locked
              and you are hidden from the mobile app's Nearby list. Free essential info such as
              toilet facility stays visible. Top up to go live again.
            </span>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {QUICK_AMOUNTS.map((v) => (
            <Button
              key={v}
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => handleTopUp(v)}
            >
              +₦{v.toLocaleString()}
            </Button>
          ))}
        </div>

        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="Custom amount (₦)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <Button onClick={() => handleTopUp(Number(amount))} disabled={busy}>
            {busy ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Plus className="w-4 h-4 mr-1" />}
            Top up
          </Button>
        </div>

        {transactions.length > 0 && (
          <div className="space-y-1 pt-2 border-t border-border">
            <p className="text-sm font-medium">Recent activity</p>
            {transactions.map((t) => (
              <div key={t.id} className="flex justify-between text-sm text-muted-foreground">
                <span>{t.description ?? t.kind}</span>
                <span className={t.amount_cents >= 0 ? "text-success" : "text-destructive"}>
                  {t.amount_cents >= 0 ? "+" : "-"}₦
                  {Math.abs(t.amount_cents / 100).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
