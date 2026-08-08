import { supabase } from "@/integrations/supabase/client";
import type { VerificationInput } from "@/components/verification/VerificationFields";

export const VERIFICATION_BUCKET = "verification-docs";

/** Uploads verification documents to the private bucket, returns stored paths. */
export async function uploadVerificationDocs(userId: string, v: VerificationInput) {
  const upload = async (file: File | null, kind: string) => {
    if (!file) return null;
    const ext = file.name.split(".").pop() ?? "bin";
    const path = `${userId}/${kind}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from(VERIFICATION_BUCKET)
      .upload(path, file, { upsert: true });
    if (error) throw error;
    return path;
  };

  return {
    business_document_url: await upload(v.businessDoc, "business"),
    supporting_document_url: await upload(v.supportingDoc, "supporting"),
  };
}

/** Creates a short-lived signed URL for a private verification document. */
export async function signedDocUrl(path: string) {
  const { data } = await supabase.storage
    .from(VERIFICATION_BUCKET)
    .createSignedUrl(path, 60 * 10);
  return data?.signedUrl ?? null;
}
