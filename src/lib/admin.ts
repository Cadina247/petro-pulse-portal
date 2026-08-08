import { useAuth } from "@/hooks/useAuth";

/** Simple admin allowlist (mirrored by public.is_admin() in the database). */
export const ADMIN_EMAILS = ["obehi247m@gmail.com"];

export function isAdminEmail(email?: string | null) {
  return !!email && ADMIN_EMAILS.includes(email.toLowerCase());
}

export function useIsAdmin() {
  const { user } = useAuth();
  return isAdminEmail(user?.email);
}
