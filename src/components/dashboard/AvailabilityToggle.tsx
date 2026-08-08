import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAccount } from "@/hooks/useAccount";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export function AvailabilityToggle() {
  const { type, record, loading, setAvailability } = useAccount();

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4 flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading availability…
        </CardContent>
      </Card>
    );
  }

  if (!record) return null;

  const available = !!record.is_available;

  const onChange = async (value: boolean) => {
    const { error } = await setAvailability(value);
    if (error) {
      toast({ title: "Could not update", description: error.message, variant: "destructive" });
      return;
    }
    toast({
      title: value ? "You are now Available" : "You are now Unavailable",
      description: value
        ? "Customers can find you in the mobile app's nearby list."
        : "You are hidden from the mobile app's nearby list.",
    });
  };

  return (
    <Card className={available ? "border-green-500/60" : "border-destructive/60"}>
      <CardContent className="p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span
            className={`h-3 w-3 rounded-full ${available ? "bg-green-500" : "bg-destructive"}`}
            aria-hidden
          />
          <div>
            <Label htmlFor="availability" className="text-base">
              {available ? "Available" : "Not available"}
            </Label>
            <p className="text-sm text-muted-foreground">
              {available
                ? `Your ${type === "vendor" ? "shop" : "station"} is visible to nearby customers.`
                : `Your ${type === "vendor" ? "shop" : "station"} is hidden from nearby customers.`}
            </p>
          </div>
        </div>
        <Switch id="availability" checked={available} onCheckedChange={onChange} />
      </CardContent>
    </Card>
  );
}
