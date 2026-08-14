import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertTriangle, Loader2, PackagePlus } from "lucide-react";
import { useFuelProducts } from "@/hooks/useFuelProducts";
import { useStockMovements } from "@/hooks/useStockMovements";
import { useToast } from "@/hooks/use-toast";

const LOW_STOCK_RATIO = 0.2;

export function FuelStock() {
  const { products, loading, updateProduct } = useFuelProducts();
  const { movements, addMovement } = useStockMovements();
  const { toast } = useToast();

  const [productId, setProductId] = useState("");
  const [kind, setKind] = useState("received");
  const [quantity, setQuantity] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const record = async () => {
    const product = products.find((p) => p.id === productId);
    const qty = Number(quantity);
    if (!product || !qty || qty <= 0) {
      toast({ title: "Pick a product and enter a quantity", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      await addMovement({
        product_id: product.id,
        product_name: product.product_name,
        kind,
        quantity: qty,
        unit: product.unit,
        note: note.trim() || undefined,
      });

      const delta = kind === "received" ? qty : kind === "dispensed" ? -qty : 0;
      const next =
        kind === "adjustment" ? qty : Math.max(Number(product.quantity_available) + delta, 0);
      await updateProduct(product.id, { quantity_available: next });

      setQuantity("");
      setNote("");
      toast({ title: "Stock movement recorded", description: `${product.product_name} updated.` });
    } catch {
      toast({ title: "Could not record stock movement", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Current stock levels</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading && (
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading stock…
            </p>
          )}
          {!loading && products.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Add fuel products first to track their stock.
            </p>
          )}
          {products.map((p) => {
            const capacity = Number(p.capacity) || 0;
            const qty = Number(p.quantity_available) || 0;
            const pct = capacity > 0 ? Math.min((qty / capacity) * 100, 100) : 0;
            const low = capacity > 0 && qty / capacity < LOW_STOCK_RATIO;
            return (
              <div key={p.id} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{p.product_name}</span>
                  <span className="text-muted-foreground">
                    {qty.toLocaleString()}
                    {p.unit}
                    {capacity > 0 && ` / ${capacity.toLocaleString()}${p.unit}`}
                  </span>
                </div>
                <Progress value={pct} />
                <div className="flex items-center gap-2">
                  {low && (
                    <Badge variant="destructive" className="gap-1">
                      <AlertTriangle className="w-3 h-3" /> Low stock
                    </Badge>
                  )}
                  <Badge variant={p.is_available ? "default" : "outline"}>
                    {p.is_available ? "Selling" : "Paused"}
                  </Badge>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PackagePlus className="w-5 h-5 text-primary" /> Record stock movement
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <Label>Product</Label>
              <Select value={productId} onValueChange={setProductId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.product_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Movement</Label>
              <Select value={kind} onValueChange={setKind}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="received">Stock received</SelectItem>
                  <SelectItem value="dispensed">Stock dispensed / sold</SelectItem>
                  <SelectItem value="adjustment">Closing stock adjustment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Quantity</Label>
              <Input
                type="number"
                inputMode="decimal"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Note (optional)</Label>
              <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Truck #12" />
            </div>
          </div>
          <Button onClick={record} disabled={busy}>
            {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Record movement
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent stock movements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {movements.length === 0 && (
            <p className="text-sm text-muted-foreground">No stock movements recorded yet.</p>
          )}
          {movements.map((m) => (
            <div
              key={m.id}
              className="flex flex-wrap items-center justify-between gap-2 border rounded-md p-3 text-sm"
            >
              <div>
                <span className="font-medium">{m.product_name}</span>{" "}
                <Badge variant="outline" className="ml-1">
                  {m.kind}
                </Badge>
                {m.note && <span className="text-muted-foreground"> · {m.note}</span>}
              </div>
              <div className="text-muted-foreground">
                {Number(m.quantity).toLocaleString()}
                {m.unit} · {new Date(m.created_at).toLocaleString()}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
