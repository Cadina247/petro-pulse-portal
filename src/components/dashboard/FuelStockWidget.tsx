import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Droplets } from "lucide-react";

const fuelTypes = [
  {
    name: "Premium Petrol",
    current: 2500,
    capacity: 3000,
    unit: "L",
    status: "good",
    price: "₦617/L",
  },
  {
    name: "Diesel",
    current: 450,
    capacity: 2500,
    unit: "L",
    status: "low",
    price: "₦750/L",
  },
  {
    name: "Kerosene",
    current: 1200,
    capacity: 1500,
    unit: "L",
    status: "good",
    price: "₦430/L",
  },
  {
    name: "Cooking Gas",
    current: 85,
    capacity: 200,
    unit: "KG",
    status: "critical",
    price: "₦1,200/KG",
  },
];

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

const getProgressColor = (status: string) => {
  switch (status) {
    case "good":
      return "bg-success";
    case "low":
      return "bg-warning";
    case "critical":
      return "bg-destructive";
    default:
      return "bg-primary";
  }
};

export function FuelStockWidget() {
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
        {fuelTypes.map((fuel) => {
          const percentage = (fuel.current / fuel.capacity) * 100;
          
          return (
            <div key={fuel.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{fuel.name}</span>
                  {fuel.status === "critical" && (
                    <AlertTriangle className="w-4 h-4 text-destructive" />
                  )}
                </div>
                <span className="text-sm text-muted-foreground">{fuel.price}</span>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className={getStatusColor(fuel.status)}>
                    {fuel.current} {fuel.unit}
                  </span>
                  <span className="text-muted-foreground">
                    {fuel.capacity} {fuel.unit}
                  </span>
                </div>
                <Progress 
                  value={percentage} 
                  className="h-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{percentage.toFixed(1)}% capacity</span>
                  <span className={`font-medium ${getStatusColor(fuel.status)}`}>
                    {fuel.status.toUpperCase()}
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