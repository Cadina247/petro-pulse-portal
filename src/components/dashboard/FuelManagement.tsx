import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Droplets, Fuel, Flame, AlertTriangle, Loader2, Plus, Trash2, Lock } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useFuelProducts } from "@/hooks/useFuelProducts";
import { useWallet } from "@/hooks/useWallet";


const DEFAULT_PRODUCTS = [
  { name: "Petrol", unit: "L" },
  { name: "Diesel", unit: "L" },
  { name: "Cooking Gas", unit: "KG" },
  { name: "Kerosene", unit: "L" },
];

const iconFor = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes("gas")) return Flame;
  if (n.includes("petrol")) return Fuel;
  return Droplets;
};

export function FuelManagement() {
  const { products, loading, saving, patchLocal, updateProduct, addProduct, deleteProduct, saveAll } =
    useFuelProducts();
  const { hasCredit } = useWallet();
  const { toast } = useToast();

  const [newName, setNewName] = useState("");
  const [newUnit, setNewUnit] = useState("L");
  const [newPrice, setNewPrice] = useState("");
  const [newQuantity, setNewQuantity] = useState("");
  const [newCapacity, setNewCapacity] = useState("");
  const [adding, setAdding] = useState(false);

  const existing = products.map((p) => p.product_name.toLowerCase());

  const handleAdd = async () => {
    if (!newName.trim()) {
      toast({ title: "Enter or pick a product name", variant: "destructive" });
      return;
    }
    setAdding(true);
    try {
      await addProduct({
        product_name: newName,
        unit: newUnit,
        price: Number(newPrice) || 0,
        quantity_available: Number(newQuantity) || 0,
        capacity: Number(newCapacity) || 0,
      });
      setNewName("");
      setNewUnit("L");
      setNewPrice("");
      setNewQuantity("");
      setNewCapacity("");
      toast({ title: "Product added", description: "Price and availability are now live for the mobile app." });
    } catch {
      toast({ title: "Could not add product", variant: "destructive" });
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    try {
      await deleteProduct(id);
      toast({ title: "Product removed", description: `${name} has been deleted.` });
    } catch {
      toast({ title: "Delete failed", variant: "destructive" });
    }
  };

  const handleAvailabilityChange = async (id: string, is_available: boolean) => {
    try {
      await updateProduct(id, { is_available });
      toast({
        title: is_available ? "In stock" : "Out of stock",
        description: "Live availability updated for the mobile app.",
      });
    } catch {
      toast({ title: "Update failed", variant: "destructive" });
    }
  };

  const handleSaveChanges = async () => {
    try {
      await saveAll();
      toast({
        title: "Changes saved",
        description: "Prices, units and stock levels have been updated.",
      });
    } catch {
      toast({ title: "Save failed", description: "Please try again.", variant: "destructive" });
    }
  };

  const getStockStatus = (current: number, capacity: number) => {
    const percentage = capacity > 0 ? (current / capacity) * 100 : 0;
    if (percentage < 20) return { label: "Critical", variant: "destructive" as const };
    if (percentage < 50) return { label: "Low", variant: "secondary" as const };
    return { label: "Good", variant: "default" as const };
  };

  const lastUpdated = products.reduce<string | null>(
    (acc, p) => (!acc || p.last_updated_at > acc ? p.last_updated_at : acc),
    null,
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Fuel className="w-5 h-5 text-primary" />
          Fuel &amp; Price Management
        </CardTitle>
        <Button onClick={handleSaveChanges} disabled={saving || loading || !hasCredit} className="bg-success hover:bg-success/90">
          {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Save Changes
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {!hasCredit && (
          <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <Lock className="w-4 h-4 text-destructive mt-0.5" />
            <span className="text-sm text-destructive">
              Fuel and gas listings are paid listings. Your wallet is out of credit, so prices and
              stock are locked and your station is hidden from the mobile app's Nearby list. Top up
              in Wallet &amp; Credit above to go live again.
            </span>
          </div>
        )}
        <div className="p-4 border border-dashed border-border rounded-lg space-y-3">

          <h3 className="font-semibold">Add Product</h3>
          <div className="flex flex-wrap gap-2">
            {DEFAULT_PRODUCTS.map((p) => (
              <Button
                key={p.name}
                type="button"
                size="sm"
                variant={newName === p.name ? "default" : "outline"}
                disabled={existing.includes(p.name.toLowerCase())}
                onClick={() => {
                  setNewName(p.name);
                  setNewUnit(p.unit);
                }}
              >
                {p.name}
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <Input
              placeholder="Product name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <Select value={newUnit} onValueChange={setNewUnit}>
              <SelectTrigger aria-label="Unit">
                <SelectValue placeholder="Unit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="L">Litre (L)</SelectItem>
                <SelectItem value="KG">Kilogram (KG)</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="number"
              placeholder={`Price (₦ per ${newUnit})`}
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
            />
            <Input
              type="number"
              placeholder="Quantity in stock"
              value={newQuantity}
              onChange={(e) => setNewQuantity(e.target.value)}
            />
            <Input
              type="number"
              placeholder="Capacity"
              value={newCapacity}
              onChange={(e) => setNewCapacity(e.target.value)}
            />
          </div>
          <Button onClick={handleAdd} disabled={adding || !hasCredit} size="sm">
            {adding ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Plus className="w-4 h-4 mr-1" />}
            Add Product
          </Button>

        </div>

        {loading && <p className="text-sm text-muted-foreground">Loading products…</p>}
        {!loading && products.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No products yet for this station. Pick one of the four major products above to get started.
          </p>
        )}

        {products.map((fuel) => {
          const Icon = iconFor(fuel.product_name);
          const stockStatus = getStockStatus(fuel.quantity_available, fuel.capacity);

          return (
            <div key={fuel.id} className="p-4 border border-border rounded-lg space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Icon className="w-6 h-6 text-primary" />
                  <div>
                    <h3 className="font-semibold">{fuel.product_name}</h3>
                    <p className="text-sm text-muted-foreground">
                      ₦{Number(fuel.price).toLocaleString()} per {fuel.unit} •{" "}
                      {fuel.is_available ? "Available in stock" : "Out of stock"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant={stockStatus.variant}>{stockStatus.label}</Badge>
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`${fuel.id}-availability`} className="text-sm">
                      In stock
                    </Label>
                    <Switch
                      id={`${fuel.id}-availability`}
                      checked={fuel.is_available}
                      onCheckedChange={(checked) => handleAvailabilityChange(fuel.id, checked)}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(fuel.id, fuel.product_name)}
                    className="text-destructive hover:text-destructive"
                    aria-label={`Delete ${fuel.product_name}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`${fuel.id}-price`}>Price (₦ per {fuel.unit})</Label>
                  <Input
                    id={`${fuel.id}-price`}
                    type="number"
                    value={fuel.price}
                    onChange={(e) => patchLocal(fuel.id, { price: Number(e.target.value) })}
                    className="font-semibold"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`${fuel.id}-unit`}>Sold in</Label>
                  <Select
                    value={fuel.unit}
                    onValueChange={(unit) => patchLocal(fuel.id, { unit })}
                  >
                    <SelectTrigger id={`${fuel.id}-unit`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="L">Litre (L)</SelectItem>
                      <SelectItem value="KG">Kilogram (KG)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`${fuel.id}-stock`}>Current Stock ({fuel.unit})</Label>
                  <Input
                    id={`${fuel.id}-stock`}
                    type="number"
                    value={fuel.quantity_available}
                    onChange={(e) => patchLocal(fuel.id, { quantity_available: Number(e.target.value) })}
                    disabled={!fuel.is_available}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Stock Percentage</Label>
                  <div className="flex items-center gap-2 h-10">
                    <div className="flex-1 bg-muted rounded-md h-2">
                      <div
                        className={`h-full rounded-md transition-all ${
                          stockStatus.variant === "destructive"
                            ? "bg-destructive"
                            : stockStatus.variant === "secondary"
                              ? "bg-warning"
                              : "bg-success"
                        }`}
                        style={{
                          width: `${Math.min(
                            fuel.capacity > 0 ? (fuel.quantity_available / fuel.capacity) * 100 : 0,
                            100,
                          )}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium min-w-[3rem]">
                      {Math.round(fuel.capacity > 0 ? (fuel.quantity_available / fuel.capacity) * 100 : 0)}%
                    </span>
                  </div>
                </div>
              </div>

              {!fuel.is_available && (
                <div className="flex items-center gap-2 p-3 bg-warning/10 border border-warning/20 rounded-md">
                  <AlertTriangle className="w-4 h-4 text-warning" />
                  <span className="text-sm text-warning">
                    This product is currently marked as out of stock
                  </span>
                </div>
              )}
            </div>
          );
        })}

        {lastUpdated && (
          <div className="text-xs text-muted-foreground">
            Last updated: {new Date(lastUpdated).toLocaleString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
