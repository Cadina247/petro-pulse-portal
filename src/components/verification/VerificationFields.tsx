import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ShieldCheck } from "lucide-react";

export interface VerificationInput {
  nin: string;
  businessDoc: File | null;
  supportingDoc: File | null;
  supportingNote: string;
}

export const emptyVerification: VerificationInput = {
  nin: "",
  businessDoc: null,
  supportingDoc: null,
  supportingNote: "",
};

export function VerificationFields({
  value,
  onChange,
}: {
  value: VerificationInput;
  onChange: (v: VerificationInput) => void;
}) {
  const set = (patch: Partial<VerificationInput>) => onChange({ ...value, ...patch });

  return (
    <div className="space-y-3 rounded-md border p-3">
      <Label>Verification *</Label>
      <Alert>
        <ShieldCheck className="h-4 w-4" />
        <AlertDescription>
          We verify every station and vendor before they appear to customers. Provide your NIN and a
          business document — your account stays pending until an admin approves it.
        </AlertDescription>
      </Alert>

      <div className="space-y-2">
        <Label>National Identity Number (NIN) *</Label>
        <Input
          inputMode="numeric"
          maxLength={20}
          placeholder="11-digit NIN"
          value={value.nin}
          onChange={(e) => set({ nin: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label>Business document * (license, tax receipt or utility bill)</Label>
        <Input
          type="file"
          accept="image/*,application/pdf"
          onChange={(e) => set({ businessDoc: e.target.files?.[0] ?? null })}
        />
      </div>

      <div className="space-y-2">
        <Label>Supporting document (optional)</Label>
        <p className="text-xs text-muted-foreground">
          Affidavit or court document — upload this if the name on your utility bill differs from
          your business name.
        </p>
        <Input
          type="file"
          accept="image/*,application/pdf"
          onChange={(e) => set({ supportingDoc: e.target.files?.[0] ?? null })}
        />
        <Input
          placeholder="Why is a supporting document needed?"
          value={value.supportingNote}
          onChange={(e) => set({ supportingNote: e.target.value })}
        />
      </div>
    </div>
  );
}
