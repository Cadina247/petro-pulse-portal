import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, Loader2 } from "lucide-react";
import { useFuelProducts } from "@/hooks/useFuelProducts";

const iconFor = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes("gas")) return "🔥";
  if (n.includes("diesel")) return "🚛";
  if (n.includes("kerosene")) return "🪔";
  return "⛽";
};

export function PricingManagement() {
  const { products, loading, saving, patchLocal, saveAll } = useFuelProducts();
  const { toast } = useToast();

  const handleSaveChanges = async () => {
    try {
      await saveAll();
      toast({
        title: "Prices Updated",
        description: "All fuel prices have been successfully updated.",
      });
    } catch {
      toast({ title: "Update failed", description: "Please try again.", variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Pricing Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading && <p className="text-sm text-muted-foreground">Loading prices…</p>}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {products.map((item) => (
            <div key={item.id} className="space-y-3 p-4 rounded-lg border bg-card">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{iconFor(item.product_name)}</span>
                <div>
                  <h3 className="font-medium">{item.product_name}</h3>
                  <p className="text-sm text-muted-foreground">per {item.unit.toLowerCase()}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`price-${item.id}`}>Price (₦)</Label>
                <Input
                  id={`price-${item.id}`}
                  type="number"
                  value={item.price}
                  onChange={(e) => patchLocal(item.id, { price: Number(e.target.value) })}
                  className="text-lg font-semibold"
                />
              </div>

              <div className="text-sm text-muted-foreground">
                Current: ₦{Number(item.price).toLocaleString()} per {item.unit.toLowerCase()}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSaveChanges} disabled={saving || loading} className="min-w-32">
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
