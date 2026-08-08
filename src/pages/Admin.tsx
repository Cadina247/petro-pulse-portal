import { useCallback, useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, ShieldCheck, ShieldX } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { signedDocUrl } from "@/lib/verification";
import { useIsAdmin } from "@/lib/admin";
import { toast } from "@/hooks/use-toast";

type Kind = "station" | "vendor";

interface Row {
  kind: Kind;
  key: string;
  name: string;
  [k: string]: any;
}

export default function Admin() {
  const isAdmin = useIsAdmin();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [reason, setReason] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: stations }, { data: vendors }] = await Promise.all([
      (supabase as any).from("stations").select("*").order("created_at", { ascending: false }),
      (supabase as any).from("vendors").select("*").order("created_at", { ascending: false }),
    ]);
    const mapped: Row[] = [
      ...((stations ?? []) as any[]).map((s) => ({
        ...s,
        kind: "station" as Kind,
        key: s.id,
        name: s.station_name,
      })),
      ...((vendors ?? []) as any[]).map((v) => ({
        ...v,
        kind: "vendor" as Kind,
        key: v.user_id,
        name: v.business_name,
      })),
    ];
    setRows(mapped);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin, load]);

  const decide = async (row: Row, approve: boolean) => {
    const table = row.kind === "vendor" ? "vendors" : "stations";
    const column = row.kind === "vendor" ? "user_id" : "id";
    const notes = reason[row.key]?.trim();
    if (!approve && !notes) {
      toast({ title: "Reason required", description: "Type a rejection reason.", variant: "destructive" });
      return;
    }
    const { error } = await (supabase as any)
      .from(table)
      .update(
        approve
          ? { verification_status: "verified", verified_at: new Date().toISOString(), verification_notes: null }
          : { verification_status: "rejected", verified_at: null, verification_notes: notes }
      )
      .eq(column, row.key);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: approve ? "Account verified" : "Account rejected" });
    await load();
  };

  const openDoc = async (path?: string | null) => {
    if (!path) return;
    const url = await signedDocUrl(path);
    if (url) window.open(url, "_blank", "noopener");
    else toast({ title: "Could not open document", variant: "destructive" });
  };

  if (!isAdmin) {
    return (
      <DashboardLayout>
        <Card>
          <CardHeader>
            <CardTitle>Admin only</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            You don't have permission to view this page.
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  const byStatus = (status: string) => rows.filter((r) => (r.verification_status ?? "pending") === status);

  const List = ({ items }: { items: Row[] }) => (
    <div className="space-y-4">
      {items.length === 0 && <p className="text-sm text-muted-foreground">Nothing here.</p>}
      {items.map((row) => (
        <Card key={`${row.kind}-${row.key}`}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              {row.name}
              <Badge variant="outline">{row.kind === "vendor" ? "Retail Vendor" : "Filling Station"}</Badge>
              <Badge
                className="ml-auto"
                variant={
                  row.verification_status === "verified"
                    ? "default"
                    : row.verification_status === "rejected"
                    ? "destructive"
                    : "secondary"
                }
              >
                {row.verification_status ?? "pending"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid gap-1 text-muted-foreground">
              <span>Owner: {row.owner_name || "—"}</span>
              <span>Phone: {row.phone || "—"}</span>
              <span>Email: {row.email || "—"}</span>
              <span>Address: {row.address || "—"}</span>
              <span className="text-foreground font-medium">NIN: {row.nin || "—"}</span>
              {row.supporting_document_note && <span>Note: {row.supporting_document_note}</span>}
              {row.verification_notes && (
                <span className="text-destructive">Rejection reason: {row.verification_notes}</span>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={!row.business_document_url}
                onClick={() => openDoc(row.business_document_url)}
              >
                <FileText className="w-4 h-4 mr-2" />
                Business document
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={!row.supporting_document_url}
                onClick={() => openDoc(row.supporting_document_url)}
              >
                <FileText className="w-4 h-4 mr-2" />
                Supporting document
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                placeholder="Rejection reason (required to reject)"
                value={reason[row.key] ?? ""}
                onChange={(e) => setReason((r) => ({ ...r, [row.key]: e.target.value }))}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={() => decide(row, true)}>
                  <ShieldCheck className="w-4 h-4 mr-2" />
                  Approve
                </Button>
                <Button size="sm" variant="destructive" onClick={() => decide(row, false)}>
                  <ShieldX className="w-4 h-4 mr-2" />
                  Reject
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Verification Review</h1>
          <p className="text-muted-foreground">Approve or reject station and vendor accounts</p>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          <Tabs defaultValue="pending">
            <TabsList>
              <TabsTrigger value="pending">Pending ({byStatus("pending").length})</TabsTrigger>
              <TabsTrigger value="verified">Verified ({byStatus("verified").length})</TabsTrigger>
              <TabsTrigger value="rejected">Rejected ({byStatus("rejected").length})</TabsTrigger>
            </TabsList>
            <TabsContent value="pending" className="pt-4">
              <List items={byStatus("pending")} />
            </TabsContent>
            <TabsContent value="verified" className="pt-4">
              <List items={byStatus("verified")} />
            </TabsContent>
            <TabsContent value="rejected" className="pt-4">
              <List items={byStatus("rejected")} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </DashboardLayout>
  );
}
