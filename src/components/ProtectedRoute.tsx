import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAccount } from "@/hooks/useAccount";
import { CadinatechMark } from "@/components/branding/CadinatechLogo";

function Splash({ label }: { label: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
      <CadinatechMark size={72} className="rounded-full animate-pulse shadow-lg" idPrefix="splash" />
      <span className="font-serif uppercase tracking-[0.28em] text-sm text-[#C79A29] dark:text-[#E9C75C]">
        Cadinatech
      </span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

/** Redirects signed-in users without a station/vendor row to onboarding. */
function OnboardingGate({ children }: { children: React.ReactNode }) {
  const { record, loading } = useAccount();
  if (loading) return <Splash label="Loading…" />;
  if (!record) return <Navigate to="/complete-registration" replace />;
  return <>{children}</>;
}

export function ProtectedRoute({
  children,
  requireOnboarding = true,
}: {
  children: React.ReactNode;
  requireOnboarding?: boolean;
}) {
  const { user, loading } = useAuth();

  if (loading) return <Splash label="Loading…" />;
  if (!user) return <Navigate to="/auth" replace />;
  if (!requireOnboarding) return <>{children}</>;
  return <OnboardingGate>{children}</OnboardingGate>;
}
