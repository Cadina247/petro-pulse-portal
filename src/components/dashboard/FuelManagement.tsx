import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Droplets, Fuel, Flame, AlertTriangle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFuelProducts } from "@/hooks/useFuelProducts";

const iconFor = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes("gas")) return Flame;
  if (n.includes("petrol")) return Fuel;
  return Droplets;
};

export function FuelManagement() {
  const { products, loading, saving, patchLocal, updateProduct, saveAll } = useFuelProducts();
  const { toast } = useToast();

  const handleAvailabilityChange = async (id: string, is_available: boolean) => {
    try {
      await updateProduct(id, { is_available });
      toast({
        title: is_available ? "Marked available" : "Marked unavailable",
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
        title: "Changes Saved",
        description: "Fuel availability and stock levels have been updated successfully.",
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
          Fuel Management
        </CardTitle>
        <Button onClick={handleSaveChanges} disabled={saving || loading} className="bg-success hover:bg-success/90">
          {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Save Changes
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading && (
          <p className="text-sm text-muted-foreground">Loading fuel products…</p>
        )}
        {!loading && products.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No fuel products yet for this station.
          </p>
        )}
        {products.map((fuel) => {
          const Icon = iconFor(fuel.product_name);
          const stockStatus = getStockStatus(fuel.quantity_available, fuel.capacity);

          return (
            <div key={fuel.id} className="p-4 border border-border rounded-lg space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Icon className="w-6 h-6 text-primary" />
                  <div>
                    <h3 className="font-semibold">{fuel.product_name}</h3>
                    <p className="text-sm text-muted-foreground">
                      ₦{Number(fuel.price).toLocaleString()}/{fuel.unit}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant={stockStatus.variant}>{stockStatus.label}</Badge>
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`${fuel.id}-availability`} className="text-sm">
                      Available
                    </Label>
                    <Switch
                      id={`${fuel.id}-availability`}
                      checked={fuel.is_available}
                      onCheckedChange={(checked) => handleAvailabilityChange(fuel.id, checked)}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`${fuel.id}-stock`}>Current Stock ({fuel.unit})</Label>
                  <Input
                    id={`${fuel.id}-stock`}
                    type="number"
                    value={fuel.quantity_available}
                    onChange={(e) =>
                      patchLocal(fuel.id, { quantity_available: Number(e.target.value) })
                    }
                    disabled={!fuel.is_available}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Capacity ({fuel.unit})</Label>
                  <Input value={fuel.capacity} disabled className="bg-muted" />
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
                      {Math.round(
                        fuel.capacity > 0 ? (fuel.quantity_available / fuel.capacity) * 100 : 0,
                      )}
                      %
                    </span>
                  </div>
                </div>
              </div>

              {!fuel.is_available && (
                <div className="flex items-center gap-2 p-3 bg-warning/10 border border-warning/20 rounded-md">
                  <AlertTriangle className="w-4 h-4 text-warning" />
                  <span className="text-sm text-warning">
                    This fuel type is currently marked as unavailable
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
