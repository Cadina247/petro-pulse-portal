import { FormEvent, useCallback, useEffect, useState } from "react";
import { Edit2, Loader2, Plus, Trash2, Truck, Users } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Personnel = Tables<"delivery_personnel">;

interface PersonnelForm {
  full_name: string;
  phone: string;
  vehicle_info: string;
  is_active: boolean;
}

const emptyForm: PersonnelForm = {
  full_name: "",
  phone: "",
  vehicle_info: "",
  is_active: true,
};

export default function DeliveryPersonnel() {
  const { user } = useAuth();
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Personnel | null>(null);
  const [removing, setRemoving] = useState<Personnel | null>(null);
  const [form, setForm] = useState<PersonnelForm>(emptyForm);

  const loadPersonnel = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("delivery_personnel")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Roster unavailable", description: error.message, variant: "destructive" });
    } else {
      setPersonnel(data ?? []);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void loadPersonnel();
  }, [loadPersonnel]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (person: Personnel) => {
    setEditing(person);
    setForm({
      full_name: person.full_name,
      phone: person.phone,
      vehicle_info: person.vehicle_info ?? "",
      is_active: person.is_active,
    });
    setDialogOpen(true);
  };

  const savePerson = async (event: FormEvent) => {
    event.preventDefault();
    if (!user || !form.full_name.trim() || !form.phone.trim()) return;
    setSaving(true);

    const values = {
      full_name: form.full_name.trim(),
      phone: form.phone.trim(),
      vehicle_info: form.vehicle_info.trim() || null,
      is_active: form.is_active,
    };

    const result = editing
      ? await supabase.from("delivery_personnel").update(values).eq("id", editing.id)
      : await supabase.from("delivery_personnel").insert({ ...values, station_id: user.id });

    setSaving(false);
    if (result.error) {
      toast({ title: "Could not save personnel", description: result.error.message, variant: "destructive" });
      return;
    }
    setDialogOpen(false);
    toast({ title: editing ? "Personnel updated" : "Personnel added" });
    await loadPersonnel();
  };

  const toggleActive = async (person: Personnel, isActive: boolean) => {
    setPersonnel((current) =>
      current.map((item) => (item.id === person.id ? { ...item, is_active: isActive } : item)),
    );
    const { error } = await supabase
      .from("delivery_personnel")
      .update({ is_active: isActive })
      .eq("id", person.id);
    if (error) {
      setPersonnel((current) =>
        current.map((item) => (item.id === person.id ? { ...item, is_active: person.is_active } : item)),
      );
      toast({ title: "Status update failed", description: error.message, variant: "destructive" });
    }
  };

  const removePerson = async () => {
    if (!removing) return;
    const { error } = await supabase.from("delivery_personnel").delete().eq("id", removing.id);
    if (error) {
      toast({ title: "Could not remove personnel", description: error.message, variant: "destructive" });
    } else {
      setPersonnel((current) => current.filter((item) => item.id !== removing.id));
      toast({ title: "Personnel removed" });
    }
    setRemoving(null);
  };

  const activeCount = personnel.filter((person) => person.is_active).length;

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Delivery Personnel</h1>
            <p className="mt-1 text-muted-foreground">Manage your station's in-house delivery roster.</p>
          </div>
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> Add personnel
          </Button>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="rounded-md bg-primary/10 p-3 text-primary"><Users className="h-5 w-5" /></div>
              <div><p className="text-sm text-muted-foreground">Total personnel</p><p className="text-2xl font-bold">{personnel.length}</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="rounded-md bg-success/10 p-3 text-success"><Truck className="h-5 w-5" /></div>
              <div><p className="text-sm text-muted-foreground">Available now</p><p className="text-2xl font-bold">{activeCount}</p></div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex min-h-64 items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" /> Loading roster…
              </div>
            ) : personnel.length === 0 ? (
              <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
                <Users className="mb-3 h-10 w-10 text-muted-foreground" />
                <h2 className="font-semibold">No delivery personnel yet</h2>
                <p className="mt-1 text-sm text-muted-foreground">Add your first rider or driver to start your roster.</p>
                <Button className="mt-4" onClick={openCreate}><Plus className="mr-2 h-4 w-4" /> Add personnel</Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Personnel</TableHead><TableHead>Phone</TableHead><TableHead>Vehicle</TableHead>
                    <TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {personnel.map((person) => (
                    <TableRow key={person.id}>
                      <TableCell className="font-medium">{person.full_name}</TableCell>
                      <TableCell><a className="hover:text-primary" href={`tel:${person.phone}`}>{person.phone}</a></TableCell>
                      <TableCell className="text-muted-foreground">{person.vehicle_info || "—"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Switch aria-label={`Set ${person.full_name} availability`} checked={person.is_active} onCheckedChange={(value) => void toggleActive(person, value)} />
                          <Badge variant={person.is_active ? "default" : "secondary"}>{person.is_active ? "Active" : "Inactive"}</Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button aria-label={`Edit ${person.full_name}`} variant="ghost" size="icon" onClick={() => openEdit(person)}><Edit2 className="h-4 w-4" /></Button>
                          <Button aria-label={`Remove ${person.full_name}`} variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setRemoving(person)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <form onSubmit={savePerson} className="space-y-5">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit personnel" : "Add delivery personnel"}</DialogTitle>
              <DialogDescription>Keep contact details and current availability up to date.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label htmlFor="full-name">Full name</Label><Input id="full-name" required autoFocus value={form.full_name} onChange={(event) => setForm({ ...form, full_name: event.target.value })} /></div>
              <div className="space-y-2"><Label htmlFor="personnel-phone">Phone number</Label><Input id="personnel-phone" type="tel" required value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></div>
              <div className="space-y-2"><Label htmlFor="vehicle-info">Vehicle type / plate <span className="text-muted-foreground">(optional)</span></Label><Input id="vehicle-info" placeholder="Motorbike · ABC 123 XY" value={form.vehicle_info} onChange={(event) => setForm({ ...form, vehicle_info: event.target.value })} /></div>
              <div className="flex items-center justify-between rounded-md border p-3"><div><Label htmlFor="personnel-active">Available for delivery</Label><p className="text-sm text-muted-foreground">Show this person as active on your roster.</p></div><Switch id="personnel-active" checked={form.is_active} onCheckedChange={(value) => setForm({ ...form, is_active: value })} /></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button type="submit" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{editing ? "Save changes" : "Add personnel"}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(removing)} onOpenChange={(open) => !open && setRemoving(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Remove personnel?</AlertDialogTitle><AlertDialogDescription>{removing?.full_name} will be permanently removed from your station roster.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => void removePerson()}>Remove</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}