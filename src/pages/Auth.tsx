import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Gauge, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

export default function Auth() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [su, setSu] = useState({
    email: "",
    password: "",
    station_name: "",
    address: "",
    phone: "",
    owner_name: "",
    latitude: "",
    longitude: "",
  });
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
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setSu((s) => ({
          ...s,
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6),
        })),
      (err) => toast({ title: "Location error", description: err.message, variant: "destructive" })
    );
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!su.station_name || !su.email || !su.password) {
      toast({ title: "Missing fields", description: "Station name, email and password are required", variant: "destructive" });
      return;
    }
    setBusy(true);

    const { data, error } = await supabase.auth.signUp({
      email: su.email,
      password: su.password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          station_name: su.station_name,
          address: su.address,
          phone: su.phone,
          owner_name: su.owner_name,
          latitude: su.latitude,
          longitude: su.longitude,
        },
      },
    });

    if (error) {
      setBusy(false);
      toast({ title: "Signup failed", description: error.message, variant: "destructive" });
      return;
    }

    // Upload logo if provided and user is available
    const userId = data.user?.id;
    if (logoFile && userId) {
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg">
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Gauge className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-xl">FuelStation Portal</h1>
            <p className="text-xs text-muted-foreground">Station management access</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Welcome</CardTitle>
          </CardHeader>
          <CardContent>
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
                    <Input id="li-password" type="password" required value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} />
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
                    <Label>Station name *</Label>
                    <Input required value={su.station_name} onChange={(e) => setSu({ ...su, station_name: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Email *</Label>
                      <Input type="email" required value={su.email} onChange={(e) => setSu({ ...su, email: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Password *</Label>
                      <Input type="password" required minLength={6} value={su.password} onChange={(e) => setSu({ ...su, password: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Owner / manager name</Label>
                    <Input value={su.owner_name} onChange={(e) => setSu({ ...su, owner_name: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Address</Label>
                    <Input value={su.address} onChange={(e) => setSu({ ...su, address: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input value={su.phone} onChange={(e) => setSu({ ...su, phone: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>GPS location</Label>
                      <Button type="button" size="sm" variant="outline" onClick={detectLocation}>
                        <MapPin className="w-3 h-3 mr-1" /> Detect
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input placeholder="Latitude" value={su.latitude} onChange={(e) => setSu({ ...su, latitude: e.target.value })} />
                      <Input placeholder="Longitude" value={su.longitude} onChange={(e) => setSu({ ...su, longitude: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Station logo (optional)</Label>
                    <Input type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)} />
                  </div>
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
