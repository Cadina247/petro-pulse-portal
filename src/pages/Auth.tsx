import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MapPin, CheckCircle2, Building2, Store } from "lucide-react";
import { CadinatechMark } from "@/components/branding/CadinatechLogo";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

type AccountType = "station" | "vendor";

export default function Auth() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [accountType, setAccountType] = useState<AccountType>("station");

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [su, setSu] = useState({
    email: "",
    password: "",
    station_name: "",
    business_name: "",
    address: "",
    phone: "",
    owner_name: "",
    products_sold: "",
    estimated_quantity: "",
    delivery_available: false,
    latitude: "",
    longitude: "",
  });
  const [locating, setLocating] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  useEffect(() => {
    if (user) navigate("/", { replace: true });
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });
    setBusy(false);
    if (error) {
      toast({ title: "Sign in failed", description: error.message, variant: "destructive" });
      return;
    }
    navigate("/", { replace: true });
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      toast({ title: "Geolocation not supported", variant: "destructive" });
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setSu((s) => ({
          ...s,
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

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const primaryName = accountType === "vendor" ? su.business_name : su.station_name;
    if (!primaryName || !su.email || !su.password) {
      toast({
        title: "Missing fields",
        description: `${accountType === "vendor" ? "Business" : "Station"} name, email and password are required`,
        variant: "destructive",
      });
      return;
    }
    if (!su.latitude || !su.longitude) {
      toast({
        title: "Location required",
        description: "Tap “Capture my location” while standing at your shop/station.",
        variant: "destructive",
      });
      return;
    }
    setBusy(true);

    const products = su.products_sold
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const metadata: Record<string, any> = {
      account_type: accountType,
      owner_name: su.owner_name,
      address: su.address,
      phone: su.phone,
      latitude: su.latitude,
      longitude: su.longitude,
    };
    if (accountType === "vendor") {
      metadata.business_name = su.business_name;
      metadata.products_sold = products;
      metadata.estimated_quantity = su.estimated_quantity;
      metadata.delivery_available = su.delivery_available;
    } else {
      metadata.station_name = su.station_name;
    }

    const { data, error } = await supabase.auth.signUp({
      email: su.email,
      password: su.password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: metadata,
      },
    });

    if (error) {
      setBusy(false);
      toast({ title: "Signup failed", description: error.message, variant: "destructive" });
      return;
    }

    const userId = data.user?.id;
    if (accountType === "station" && logoFile && userId) {
      const ext = logoFile.name.split(".").pop();
      const path = `${userId}/logo.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("station-logos")
        .upload(path, logoFile, { upsert: true });
      if (!upErr) {
        const { data: pub } = supabase.storage.from("station-logos").getPublicUrl(path);
        await (supabase as any).from("stations").update({ logo_url: pub.publicUrl }).eq("id", userId);
      }
    }

    setBusy(false);
    toast({
      title: "Account created",
      description: "Check your email to confirm, then sign in.",
    });
  };

  const isVendor = accountType === "vendor";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg">
        <div className="flex flex-col items-center justify-center gap-3 mb-6">
          <CadinatechMark size={84} className="rounded-full shadow-lg" idPrefix="auth" />
          <div className="text-center">
            <h1 className="font-serif uppercase tracking-[0.28em] text-lg text-[#C79A29] dark:text-[#E9C75C]">
              Cadinatech
            </h1>
            <p className="text-xs text-muted-foreground mt-1">Station &amp; vendor access</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Welcome</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 mb-4">
              <GoogleAuthButton />
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">or use email</span>
                </div>
              </div>
            </div>
            <Tabs defaultValue="signin">
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="signin">Sign in</TabsTrigger>
                <TabsTrigger value="signup">Create account</TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="pt-4">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="li-email">Email</Label>
                    <Input id="li-email" type="email" required value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="li-password">Password</Label>
                    <PasswordInput id="li-password" required value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} />
                  </div>
                  <Button type="submit" disabled={busy} className="w-full">
                    {busy ? "Signing in…" : "Sign in"}
                  </Button>
                  <div className="text-center text-sm">
                    <Link to="/forgot-password" className="text-primary hover:underline">
                      Forgot your password?
                    </Link>
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="pt-4">
                <form onSubmit={handleSignUp} className="space-y-4">
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
                      value={isVendor ? su.business_name : su.station_name}
                      onChange={(e) =>
                        setSu({ ...su, [isVendor ? "business_name" : "station_name"]: e.target.value })
                      }
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Email *</Label>
                      <Input type="email" required value={su.email} onChange={(e) => setSu({ ...su, email: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Password *</Label>
                      <PasswordInput required minLength={6} value={su.password} onChange={(e) => setSu({ ...su, password: e.target.value })} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>{isVendor ? "Owner's full name" : "Owner / manager name"}</Label>
                    <Input value={su.owner_name} onChange={(e) => setSu({ ...su, owner_name: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone number</Label>
                    <Input value={su.phone} onChange={(e) => setSu({ ...su, phone: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Address</Label>
                    <Input value={su.address} onChange={(e) => setSu({ ...su, address: e.target.value })} />
                  </div>

                  {isVendor && (
                    <>
                      <div className="space-y-2">
                        <Label>Fuel / products sold (comma separated)</Label>
                        <Input
                          placeholder="Petrol, Diesel, Cooking gas"
                          value={su.products_sold}
                          onChange={(e) => setSu({ ...su, products_sold: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Estimated quantity available</Label>
                        <Input
                          placeholder="e.g. 200 litres / 5 cylinders"
                          value={su.estimated_quantity}
                          onChange={(e) => setSu({ ...su, estimated_quantity: e.target.value })}
                        />
                      </div>
                      <div className="flex items-center justify-between rounded-md border p-3">
                        <div>
                          <Label>Delivery available</Label>
                          <p className="text-xs text-muted-foreground">Can you deliver to nearby customers?</p>
                        </div>
                        <Switch
                          checked={su.delivery_available}
                          onCheckedChange={(v) => setSu({ ...su, delivery_available: v })}
                        />
                      </div>
                    </>
                  )}

                  <div className="space-y-3 rounded-md border p-3">
                    <Label>Location *</Label>
                    <Alert>
                      <MapPin className="h-4 w-4" />
                      <AlertDescription>
                        Please make sure you are physically at your shop/station right now — this pins your
                        exact location on the map for customers.
                      </AlertDescription>
                    </Alert>
                    <Button
                      type="button"
                      variant={su.latitude ? "outline" : "default"}
                      className="w-full"
                      onClick={detectLocation}
                      disabled={locating}
                    >
                      {su.latitude ? (
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                      ) : (
                        <MapPin className="w-4 h-4 mr-2" />
                      )}
                      {locating
                        ? "Capturing…"
                        : su.latitude
                        ? "Location captured — tap to re-capture"
                        : "Capture my location"}
                    </Button>
                    {su.latitude && (
                      <p className="text-xs text-muted-foreground text-center">
                        {su.latitude}, {su.longitude}
                      </p>
                    )}
                  </div>

                  {!isVendor && (
                    <div className="space-y-2">
                      <Label>Station logo (optional)</Label>
                      <Input type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)} />
                    </div>
                  )}

                  <Button type="submit" disabled={busy} className="w-full">
                    {busy ? "Creating…" : "Create account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
