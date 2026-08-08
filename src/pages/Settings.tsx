import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Loader2, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAccount } from "@/hooks/useAccount";
import { AvailabilityToggle } from "@/components/dashboard/AvailabilityToggle";
import { toast } from "@/hooks/use-toast";

export default function Settings() {
  const { user } = useAuth();
  const { type, record, loading, reload } = useAccount();
  const [form, setForm] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (record) setForm({ ...record });
  }, [record]);

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const detect = () => {
    if (!navigator.geolocation) {
      toast({ title: "Geolocation not supported", variant: "destructive" });
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        set("latitude", Number(pos.coords.latitude.toFixed(6)));
        set("longitude", Number(pos.coords.longitude.toFixed(6)));
        setLocating(false);
        toast({ title: "Location captured" });
      },
      (err) => {
        setLocating(false);
        toast({ title: "Location error", description: err.message, variant: "destructive" });
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const save = async () => {
    if (!user || !type) return;
    setSaving(true);
    const payload: Record<string, any> =
      type === "vendor"
        ? {
            business_name: form.business_name,
            owner_name: form.owner_name,
            phone: form.phone,
            address: form.address,
            latitude: form.latitude === "" ? null : Number(form.latitude),
            longitude: form.longitude === "" ? null : Number(form.longitude),
            products_sold: Array.isArray(form.products_sold)
              ? form.products_sold
              : String(form.products_sold || "")
                  .split(",")
                  .map((s: string) => s.trim())
                  .filter(Boolean),
            estimated_quantity: form.estimated_quantity,
            delivery_available: !!form.delivery_available,
          }
        : {
            station_name: form.station_name,
            owner_name: form.owner_name,
            phone: form.phone,
            address: form.address,
            latitude: form.latitude === "" ? null : Number(form.latitude),
            longitude: form.longitude === "" ? null : Number(form.longitude),
          };

    const { error } = await (supabase as any)
      .from(type === "vendor" ? "vendors" : "stations")
      .update(payload)
      .eq(type === "vendor" ? "user_id" : "id", user.id);

    setSaving(false);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Settings saved" });
    reload();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
          <p className="text-muted-foreground">
            Review and correct the details you provided at registration.
          </p>
        </div>

        <AvailabilityToggle />

        <Card>
          <CardHeader>
            <CardTitle>{type === "vendor" ? "Retail vendor details" : "Filling station details"}</CardTitle>
            <CardDescription>
              {type === "vendor"
                ? "Your shop information as customers see it in the mobile app."
                : "Your station information as customers see it in the mobile app."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading…
              </div>
            ) : !record ? (
              <p className="text-sm text-muted-foreground">No account record found yet.</p>
            ) : (
              <>
                {type === "vendor" ? (
                  <div className="space-y-2">
                    <Label>Business / vendor name</Label>
                    <Input value={form.business_name ?? ""} onChange={(e) => set("business_name", e.target.value)} />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>Station name</Label>
                    <Input value={form.station_name ?? ""} onChange={(e) => set("station_name", e.target.value)} />
                  </div>
                )}

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Owner's full name</Label>
                    <Input value={form.owner_name ?? ""} onChange={(e) => set("owner_name", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone number</Label>
                    <Input value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value)} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Address</Label>
                  <Input value={form.address ?? ""} onChange={(e) => set("address", e.target.value)} />
                </div>

                {type === "vendor" && (
                  <>
                    <div className="space-y-2">
                      <Label>Fuel / products sold (comma separated)</Label>
                      <Input
                        value={
                          Array.isArray(form.products_sold)
                            ? form.products_sold.join(", ")
                            : form.products_sold ?? ""
                        }
                        onChange={(e) => set("products_sold", e.target.value)}
                        placeholder="Petrol, Diesel, Cooking gas"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Estimated quantity available</Label>
                      <Input
                        value={form.estimated_quantity ?? ""}
                        onChange={(e) => set("estimated_quantity", e.target.value)}
                        placeholder="e.g. 200 litres / 5 cylinders"
                      />
                    </div>
                    <div className="flex items-center justify-between rounded-md border p-3">
                      <div>
                        <Label>Delivery available</Label>
                        <p className="text-sm text-muted-foreground">Can you deliver to customers nearby?</p>
                      </div>
                      <Switch
                        checked={!!form.delivery_available}
                        onCheckedChange={(v) => set("delivery_available", v)}
                      />
                    </div>
                  </>
                )}

                <div className="space-y-2 rounded-md border p-3">
                  <div className="flex items-center justify-between">
                    <Label>GPS location</Label>
                    <Button type="button" size="sm" variant="outline" onClick={detect} disabled={locating}>
                      <MapPin className="w-3 h-3 mr-1" />
                      {locating ? "Capturing…" : "Re-capture here"}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Only re-capture while you are physically at your shop/station. You can fine-tune the
                    coordinates manually below if needed.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Latitude"
                      value={form.latitude ?? ""}
                      onChange={(e) => set("latitude", e.target.value)}
                    />
                    <Input
                      placeholder="Longitude"
                      value={form.longitude ?? ""}
                      onChange={(e) => set("longitude", e.target.value)}
                    />
                  </div>
                </div>

                <Button onClick={save} disabled={saving}>
                  {saving ? "Saving…" : "Save changes"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
