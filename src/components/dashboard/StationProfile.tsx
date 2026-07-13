import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Building2, MapPin, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

interface StationRow {
  station_name: string;
  address: string | null;
  phone: string | null;
  owner_name: string | null;
  latitude: number | null;
  longitude: number | null;
  logo_url: string | null;
}

export function StationProfile() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<StationRow>({
    station_name: "",
    address: "",
    phone: "",
    owner_name: "",
    latitude: null,
    longitude: null,
    logo_url: null,
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data, error } = await (supabase as any)
        .from("stations")
        .select("station_name,address,phone,owner_name,latitude,longitude,logo_url")
        .eq("id", user.id)
        .maybeSingle();
      if (!error && data) setForm(data as StationRow);
      setLoading(false);
    })();
  }, [user]);

  const detect = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) =>
      setForm((f) => ({
        ...f,
        latitude: Number(pos.coords.latitude.toFixed(6)),
        longitude: Number(pos.coords.longitude.toFixed(6)),
      }))
    );
  };

  const save = async () => {
    if (!user) return;
    setSaving(true);

    let logo_url = form.logo_url;
    if (logoFile) {
      const ext = logoFile.name.split(".").pop();
      const path = `${user.id}/logo.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("station-logos")
        .upload(path, logoFile, { upsert: true });
      if (upErr) {
        toast({ title: "Logo upload failed", description: upErr.message, variant: "destructive" });
      } else {
        const { data: pub } = supabase.storage.from("station-logos").getPublicUrl(path);
        logo_url = pub.publicUrl;
      }
    }

    const { error } = await (supabase as any)
      .from("stations")
      .update({
        station_name: form.station_name,
        address: form.address,
        phone: form.phone,
        owner_name: form.owner_name,
        latitude: form.latitude,
        longitude: form.longitude,
        logo_url,
      })
      .eq("id", user.id);

    setSaving(false);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
      return;
    }
    setForm((f) => ({ ...f, logo_url }));
    setLogoFile(null);
    toast({ title: "Profile updated", description: "Changes are now visible to the mobile app." });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading station profile…
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-primary" />
          Station Profile
        </CardTitle>
        <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save Changes"}</Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {form.logo_url && (
          <div className="flex items-center gap-3">
            <img src={form.logo_url} alt="Station logo" className="w-16 h-16 rounded-lg object-cover border" />
            <span className="text-sm text-muted-foreground">Current logo</span>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Station name</Label>
            <Input value={form.station_name ?? ""} onChange={(e) => setForm({ ...form, station_name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Owner / manager</Label>
            <Input value={form.owner_name ?? ""} onChange={(e) => setForm({ ...form, owner_name: e.target.value })} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Address</Label>
            <Input value={form.address ?? ""} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input value={form.phone ?? ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Logo</Label>
            <Input type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <div className="flex items-center justify-between">
              <Label>GPS location</Label>
              <Button size="sm" variant="outline" onClick={detect}>
                <MapPin className="w-3 h-3 mr-1" /> Detect
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Latitude" value={form.latitude ?? ""} onChange={(e) => setForm({ ...form, latitude: e.target.value === "" ? null : Number(e.target.value) })} />
              <Input placeholder="Longitude" value={form.longitude ?? ""} onChange={(e) => setForm({ ...form, longitude: e.target.value === "" ? null : Number(e.target.value) })} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
