import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Droplets } from "lucide-react";
import { useFuelProducts } from "@/hooks/useFuelProducts";

const statusOf = (current: number, capacity: number) => {
  const pct = capacity > 0 ? (current / capacity) * 100 : 0;
  if (pct < 20) return "critical";
  if (pct < 50) return "low";
  return "good";
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "good":
      return "text-success";
    case "low":
      return "text-warning";
    case "critical":
      return "text-destructive";
    default:
      return "text-muted-foreground";
  }
};

export function FuelStockWidget() {
  const { products, loading } = useFuelProducts();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Droplets className="w-5 h-5 text-primary" />
          Fuel Stock Levels
        </CardTitle>
        <Badge variant="outline">Live</Badge>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {products.map((fuel) => {
          const percentage =
            fuel.capacity > 0 ? (fuel.quantity_available / fuel.capacity) * 100 : 0;
          const status = statusOf(fuel.quantity_available, fuel.capacity);

          return (
            <div key={fuel.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{fuel.product_name}</span>
                  {status === "critical" && (
                    <AlertTriangle className="w-4 h-4 text-destructive" />
                  )}
                </div>
                <span className="text-sm text-muted-foreground">
                  ₦{Number(fuel.price).toLocaleString()}/{fuel.unit}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className={getStatusColor(status)}>
                    {fuel.quantity_available} {fuel.unit}
                  </span>
                  <span className="text-muted-foreground">
                    {fuel.capacity} {fuel.unit}
                  </span>
                </div>
                <Progress value={percentage} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{percentage.toFixed(1)}% capacity</span>
                  <span className={`font-medium ${getStatusColor(status)}`}>
                    {fuel.is_available ? status.toUpperCase() : "UNAVAILABLE"}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
