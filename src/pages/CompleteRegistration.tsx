import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MapPin, CheckCircle2, Building2, Store } from "lucide-react";
import { CadinatechMark } from "@/components/branding/CadinatechLogo";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAccount } from "@/hooks/useAccount";
import { toast } from "@/hooks/use-toast";
import {
  VerificationFields,
  emptyVerification,
  type VerificationInput,
} from "@/components/verification/VerificationFields";
import { uploadVerificationDocs } from "@/lib/verification";

type AccountType = "station" | "vendor";

export default function CompleteRegistration() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { record, loading, reload } = useAccount();
  const [busy, setBusy] = useState(false);
  const [locating, setLocating] = useState(false);
  const [verif, setVerif] = useState<VerificationInput>(emptyVerification);
  const [accountType, setAccountType] = useState<AccountType>("station");
  const [form, setForm] = useState({
    station_name: "",
    business_name: "",
    owner_name: "",
    phone: "",
    address: "",
    products_sold: "",
    estimated_quantity: "",
    delivery_available: false,
    latitude: "",
    longitude: "",
  });

  // Prefill from Google profile metadata
  useEffect(() => {
    if (!user) return;
    const meta = (user.user_metadata as any) || {};
    setForm((f) => ({
      ...f,
      owner_name: f.owner_name || meta.full_name || meta.name || "",
      phone: f.phone || meta.phone || "",
    }));
  }, [user]);

  // Already onboarded → straight to the dashboard
  useEffect(() => {
    if (!loading && record) navigate("/", { replace: true });
  }, [loading, record, navigate]);

  const isVendor = accountType === "vendor";

  const detectLocation = () => {
    if (!navigator.geolocation) {
      toast({ title: "Geolocation not supported", variant: "destructive" });
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({
          ...f,
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6),
        }));
        setLocating(false);
        toast({ title: "Location captured", description: "Your exact coordinates were pinned." });
      },
      (err) => {
        setLocating(false);
        toast({ title: "Location error", description: err.message, variant: "destructive" });
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const primaryName = isVendor ? form.business_name : form.station_name;
    if (!primaryName) {
      toast({
        title: "Missing fields",
        description: `${isVendor ? "Business" : "Station"} name is required`,
        variant: "destructive",
      });
      return;
    }
    if (!form.latitude || !form.longitude) {
      toast({
        title: "Location required",
        description: "Tap “Capture my location” while standing at your shop/station.",
        variant: "destructive",
      });
      return;
    }
    setBusy(true);

    let error: any = null;
    if (isVendor) {
      const products = form.products_sold
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const res = await (supabase as any).from("vendors").insert({
        user_id: user.id,
        business_name: form.business_name,
        owner_name: form.owner_name || null,
        phone: form.phone || null,
        email: user.email,
        address: form.address || null,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        products_sold: products,
        estimated_quantity: form.estimated_quantity || null,
        delivery_available: form.delivery_available,
      });
      error = res.error;
    } else {
      const res = await (supabase as any).from("stations").insert({
        id: user.id,
        station_name: form.station_name,
        owner_name: form.owner_name || null,
        phone: form.phone || null,
        email: user.email,
        address: form.address || null,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
      });
      error = res.error;
    }

    setBusy(false);
    if (error) {
      toast({ title: "Could not save", description: error.message, variant: "destructive" });
      return;
    }
    await reload();
    toast({ title: "Registration complete", description: "Welcome to Cadinatech." });
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg">
        <div className="flex flex-col items-center justify-center gap-3 mb-6">
          <CadinatechMark size={72} className="rounded-full shadow-lg" idPrefix="onboard" />
          <h1 className="font-serif uppercase tracking-[0.28em] text-lg text-[#C79A29] dark:text-[#E9C75C]">
            Cadinatech
          </h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Complete your registration</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Account type *</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setAccountType("station")}
                    className={`rounded-lg border p-3 text-left transition ${
                      !isVendor ? "border-primary bg-primary/5" : "hover:bg-muted/60"
                    }`}
                  >
                    <Building2 className="w-4 h-4 mb-1" />
                    <div className="font-medium text-sm">Filling Station</div>
                    <div className="text-xs text-muted-foreground">Full fuel station</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAccountType("vendor")}
                    className={`rounded-lg border p-3 text-left transition ${
                      isVendor ? "border-primary bg-primary/5" : "hover:bg-muted/60"
                    }`}
                  >
                    <Store className="w-4 h-4 mb-1" />
                    <div className="font-medium text-sm">Retail Vendor</div>
                    <div className="text-xs text-muted-foreground">Neighbourhood seller</div>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{isVendor ? "Business / vendor name *" : "Station name *"}</Label>
                <Input
                  required
                  value={isVendor ? form.business_name : form.station_name}
                  onChange={(e) =>
                    setForm((f) =>
                      isVendor
                        ? { ...f, business_name: e.target.value }
                        : { ...f, station_name: e.target.value }
                    )
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Owner's full name</Label>
                  <Input
                    value={form.owner_name}
                    onChange={(e) => setForm((f) => ({ ...f, owner_name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone number</Label>
                  <Input
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Address</Label>
                <Input
                  value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                />
              </div>

              {isVendor && (
                <>
                  <div className="space-y-2">
                    <Label>Fuel / products sold (comma separated)</Label>
                    <Input
                      placeholder="Petrol, Diesel, Cooking gas"
                      value={form.products_sold}
                      onChange={(e) => setForm((f) => ({ ...f, products_sold: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Estimated quantity available</Label>
                    <Input
                      placeholder="e.g. 200 litres"
                      value={form.estimated_quantity}
                      onChange={(e) => setForm((f) => ({ ...f, estimated_quantity: e.target.value }))}
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <div className="text-sm font-medium">Delivery available</div>
                      <div className="text-xs text-muted-foreground">Can you deliver to customers?</div>
                    </div>
                    <Switch
                      checked={form.delivery_available}
                      onCheckedChange={(v) => setForm((f) => ({ ...f, delivery_available: v }))}
                    />
                  </div>
                </>
              )}

              <Alert>
                <MapPin className="h-4 w-4" />
                <AlertDescription>
                  Please make sure you are physically at your shop/station right now — this pins your
                  exact location on the map for customers.
                </AlertDescription>
              </Alert>

              <div className="flex items-center gap-3">
                <Button type="button" variant="outline" onClick={detectLocation} disabled={locating}>
                  <MapPin className="w-4 h-4 mr-2" />
                  {locating ? "Locating…" : "Capture my location"}
                </Button>
                {form.latitude && form.longitude && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                    {form.latitude}, {form.longitude}
                  </span>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? "Saving…" : "Finish registration"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
