import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, Loader2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useFuelProducts } from "@/hooks/useFuelProducts";

const iconFor = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes("gas")) return "🔥";
  if (n.includes("diesel")) return "🚛";
  if (n.includes("kerosene")) return "🪔";
  return "⛽";
};

export function PricingManagement() {
  const { products, loading, saving, patchLocal, addProduct, deleteProduct, saveAll } = useFuelProducts();
  const { toast } = useToast();
  const [newName, setNewName] = useState("");
  const [newUnit, setNewUnit] = useState("L");
  const [newPrice, setNewPrice] = useState("");
  const [adding, setAdding] = useState(false);

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

  const handleAdd = async () => {
    if (!newName.trim()) {
      toast({ title: "Enter a product name", variant: "destructive" });
      return;
    }
    setAdding(true);
    try {
      await addProduct({ product_name: newName, unit: newUnit, price: Number(newPrice) || 0 });
      setNewName("");
      setNewUnit("L");
      setNewPrice("");
      toast({ title: "Price added", description: `${newName} is now listed.` });
    } catch {
      toast({ title: "Could not add product", variant: "destructive" });
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    try {
      await deleteProduct(id);
      toast({ title: "Removed", description: `${name} has been deleted.` });
    } catch {
      toast({ title: "Delete failed", variant: "destructive" });
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
        <div className="p-4 border border-dashed border-border rounded-lg space-y-3">
          <h3 className="font-semibold">Add New Product Price</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input
              placeholder="Product name (e.g. AGO, LPG)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <Input placeholder="Unit (L, KG)" value={newUnit} onChange={(e) => setNewUnit(e.target.value)} />
            <Input
              type="number"
              placeholder="Price (₦)"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
            />
          </div>
          <Button onClick={handleAdd} disabled={adding} size="sm">
            {adding ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Plus className="w-4 h-4 mr-1" />}
            Add Product
          </Button>
        </div>

        {loading && <p className="text-sm text-muted-foreground">Loading prices…</p>}
        {!loading && products.length === 0 && (
          <p className="text-sm text-muted-foreground">No products priced yet. Add one above.</p>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {products.map((item) => (
            <div key={item.id} className="space-y-3 p-4 rounded-lg border bg-card">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{iconFor(item.product_name)}</span>
                  <div>
                    <h3 className="font-medium">{item.product_name}</h3>
                    <p className="text-sm text-muted-foreground">per {item.unit.toLowerCase()}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(item.id, item.product_name)}
                  className="text-destructive hover:text-destructive"
                  aria-label={`Delete ${item.product_name}`}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
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
