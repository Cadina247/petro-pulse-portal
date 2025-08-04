import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Truck, Fuel, Zap, CreditCard, TrendingUp, TrendingDown } from "lucide-react";

const stats = [
  {
    title: "Active Deliveries",
    value: "12",
    change: "+3 from yesterday",
    changeType: "positive" as const,
    icon: Truck,
    color: "text-primary",
  },
  {
    title: "Fuel Stock Level",
    value: "8,450L",
    change: "85% capacity",
    changeType: "neutral" as const,
    icon: Fuel,
    color: "text-warning",
  },
  {
    title: "EV Charging Ports",
    value: "6/8",
    change: "2 available",
    changeType: "positive" as const,
    icon: Zap,
    color: "text-success",
  },
  {
    title: "Today's Revenue",
    value: "₦2,450,000",
    change: "+12% from yesterday",
    changeType: "positive" as const,
    icon: CreditCard,
    color: "text-primary",
  },
];

export function DashboardStats() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title} className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className={`h-5 w-5 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {stat.changeType === "positive" && (
                <TrendingUp className="h-3 w-3 text-success" />
              )}
              <span>{stat.change}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}