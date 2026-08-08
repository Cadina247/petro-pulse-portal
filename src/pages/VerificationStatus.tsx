import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Clock, ShieldCheck, ShieldX } from "lucide-react";
import { CadinatechMark } from "@/components/branding/CadinatechLogo";
import {
  VerificationFields,
  emptyVerification,
  type VerificationInput,
} from "@/components/verification/VerificationFields";
import { uploadVerificationDocs } from "@/lib/verification";
import { useAccount } from "@/hooks/useAccount";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export default function VerificationStatus() {
  const { user, signOut } = useAuth();
  const { type, record, reload } = useAccount();
  const [v, setV] = useState<VerificationInput>(emptyVerification);
  const [busy, setBusy] = useState(false);

  const status: string = record?.verification_status ?? "pending";
  const rejected = status === "rejected";

  const resubmit = async () => {
    if (!user || !type) return;
    if (!v.nin || !v.businessDoc) {
      toast({
        title: "Missing details",
        description: "NIN and a business document are required.",
        variant: "destructive",
      });
      return;
    }
    setBusy(true);
    try {
      const docs = await uploadVerificationDocs(user.id, v);
      const table = type === "vendor" ? "vendors" : "stations";
      const column = type === "vendor" ? "user_id" : "id";
      const { error } = await (supabase as any)
        .from(table)
        .update({
          nin: v.nin,
          business_document_url: docs.business_document_url,
          supporting_document_url: docs.supporting_document_url,
          supporting_document_note: v.supportingNote || null,
          verification_status: "pending",
          verification_notes: null,
        })
        .eq(column, user.id);
      if (error) throw error;
      await reload();
      setV(emptyVerification);
      toast({ title: "Documents submitted", description: "Your account is pending review." });
    } catch (e: any) {
      toast({ title: "Submission failed", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg space-y-6">
        <div className="flex flex-col items-center gap-3">
          <CadinatechMark size={72} className="rounded-full shadow-lg" idPrefix="verify" />
          <h1 className="font-serif uppercase tracking-[0.28em] text-lg text-[#C79A29] dark:text-[#E9C75C]">
            Cadinatech
          </h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {rejected ? (
                <ShieldX className="w-5 h-5 text-destructive" />
              ) : (
                <Clock className="w-5 h-5 text-amber-500" />
              )}
              {rejected ? "Verification rejected" : "Your account is pending verification"}
              <Badge variant={rejected ? "destructive" : "secondary"} className="ml-auto">
                {status}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {rejected ? (
              <Alert variant="destructive">
                <ShieldX className="h-4 w-4" />
                <AlertDescription>
                  {record?.verification_notes ||
                    "Your documents could not be verified. Please upload valid documents below."}
                </AlertDescription>
              </Alert>
            ) : (
              <Alert>
                <ShieldCheck className="h-4 w-4" />
                <AlertDescription>
                  An admin is reviewing your NIN and documents. You'll get full dashboard access and
                  appear to customers in the mobile app once approved.
                </AlertDescription>
              </Alert>
            )}

            <div className="text-sm text-muted-foreground space-y-1">
              <p>Account type: {type === "vendor" ? "Retail Vendor" : "Filling Station"}</p>
              <p>NIN on file: {record?.nin || "—"}</p>
              <p>Business document: {record?.business_document_url ? "Uploaded" : "Missing"}</p>
            </div>

            <VerificationFields value={v} onChange={setV} />

            <Button className="w-full" onClick={resubmit} disabled={busy}>
              {busy ? "Submitting…" : rejected ? "Resubmit documents" : "Update documents"}
            </Button>

            <div className="flex justify-between text-sm">
              <Link to="/settings" className="text-primary hover:underline">
                Edit my details
              </Link>
              <button className="text-muted-foreground hover:underline" onClick={signOut}>
                Sign out
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
