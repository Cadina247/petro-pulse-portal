import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { CadinatechMark } from "@/components/branding/CadinatechLogo";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
        <CadinatechMark size={72} className="rounded-full animate-pulse shadow-lg" idPrefix="splash" />
        <span className="font-serif uppercase tracking-[0.28em] text-sm text-[#C79A29] dark:text-[#E9C75C]">
          Cadinatech
        </span>
        <span className="text-xs text-muted-foreground">Loading…</span>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}
