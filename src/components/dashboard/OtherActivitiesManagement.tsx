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
import {
  Store,
  Car,
  Scissors,
  Coffee,
  ShoppingCart,
  Plus,
  Trash2,
  Zap,
  Bath,
  Wrench,
  Lock,
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useServices } from "@/hooks/useServices";
import { useWallet } from "@/hooks/useWallet";

const CATEGORY_OPTIONS = [
  { value: "toilet", label: "Toilet Facility", free: true },
  { value: "carwash", label: "Car Wash", free: false },
  { value: "ev", label: "EV Charging", free: false },
  { value: "shop", label: "Mini Mart / Supermarket", free: false },
  { value: "salon", label: "Hair Salon", free: false },
  { value: "restaurant", label: "Restaurant / Cafe", free: false },
  { value: "mechanic", label: "Mechanic / Tyre Service", free: false },
  { value: "other", label: "Other", free: false },
];

const iconFor = (category: string) => {
  switch (category) {
    case "toilet":
      return Bath;
    case "carwash":
      return Car;
    case "ev":
      return Zap;
    case "shop":
      return ShoppingCart;
    case "salon":
      return Scissors;
    case "restaurant":
      return Coffee;
    case "mechanic":
      return Wrench;
    default:
      return Store;
  }
};

export function OtherActivitiesManagement({
  accountType = "station",
}: {
  accountType?: string;
}) {
  const { services, loading, addService, updateService, deleteService } =
    useServices(accountType);
  const { hasCredit } = useWallet();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("other");
  const [isFree, setIsFree] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleAdd = async () => {
    if (!name.trim()) {
      toast({ title: "Enter a service name", variant: "destructive" });
      return;
    }
    if (!isFree && !hasCredit) {
      toast({
        title: "Out of credit",
        description: "Top up your wallet to add paid services, or mark this one as free essential info.",
        variant: "destructive",
      });
      return;
    }
    setBusy(true);
    try {
      await addService({ name, category, is_free: isFree });
      setName("");
      setCategory("other");
      setIsFree(false);
      toast({ title: "Service added", description: "It is now visible on the mobile app profile." });
    } catch {
      toast({ title: "Could not add service", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const handleToggle = async (id: string, is_available: boolean, is_free: boolean) => {
    if (!is_free && !hasCredit) {
      toast({
        title: "Out of credit",
        description: "Paid services are locked until you top up your wallet.",
        variant: "destructive",
      });
      return;
    }
    try {
      await updateService(id, { is_available });
    } catch {
      toast({ title: "Update failed", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string, serviceName: string) => {
    try {
      await deleteService(id);
      toast({ title: "Removed", description: `${serviceName} has been deleted.` });
    } catch {
      toast({ title: "Delete failed", variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Store className="w-5 h-5 text-primary" />
          Other Services &amp; Facilities
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Everything listed here shows on your full profile in the mobile app. Free essential
          facilities (like a toilet) stay visible even when your credit runs out.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-4 border border-dashed border-border rounded-lg space-y-3">
          <h3 className="font-semibold">Add Service</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input
              placeholder="Service name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Select
              value={category}
              onValueChange={(v) => {
                setCategory(v);
                const opt = CATEGORY_OPTIONS.find((o) => o.value === v);
                if (opt) {
                  setIsFree(opt.free);
                  if (!name.trim()) setName(opt.label);
                }
              }}
            >
              <SelectTrigger aria-label="Category">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Switch id="new-free" checked={isFree} onCheckedChange={setIsFree} />
              <Label htmlFor="new-free" className="text-sm">
                Free public service
              </Label>
            </div>
          </div>
          <Button onClick={handleAdd} disabled={busy} size="sm">
            <Plus className="w-4 h-4 mr-1" />
            Add Service
          </Button>
        </div>

        {loading && <p className="text-sm text-muted-foreground">Loading services…</p>}
        {!loading && services.length === 0 && (
          <p className="text-sm text-muted-foreground">No services yet. Add your first one above.</p>
        )}

        <div className="space-y-3">
          {services.map((service) => {
            const Icon = iconFor(service.category);
            const locked = !service.is_free && !hasCredit;
            return (
              <div
                key={service.id}
                className="flex flex-wrap items-center justify-between gap-3 p-4 border border-border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium">{service.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {service.is_available ? "Available now" : "Currently unavailable"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={service.is_free ? "secondary" : "outline"}>
                    {service.is_free ? "Free listing" : "Paid listing"}
                  </Badge>
                  {locked && (
                    <span className="flex items-center gap-1 text-xs text-destructive">
                      <Lock className="w-3 h-3" /> Locked
                    </span>
                  )}
                  <Switch
                    checked={service.is_available}
                    disabled={locked}
                    onCheckedChange={(checked) =>
                      handleToggle(service.id, checked, service.is_free)
                    }
                    aria-label={`Toggle ${service.name}`}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(service.id, service.name)}
                    aria-label={`Delete ${service.name}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
