import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MapPin, Clock, Phone } from "lucide-react";

const orders = [
  {
    id: "#1234",
    customer: "John Okafor",
    product: "Premium Petrol",
    quantity: "50L",
    address: "Victoria Island, Lagos",
    status: "in-transit",
    time: "2 hours ago",
    driver: "Mike Johnson",
  },
  {
    id: "#1235",
    customer: "Sarah Ahmed",
    product: "Diesel",
    quantity: "100L",
    address: "Ikeja, Lagos",
    status: "pending",
    time: "1 hour ago",
    driver: null,
  },
  {
    id: "#1236",
    customer: "David Okoro",
    product: "Cooking Gas",
    quantity: "12.5KG",
    address: "Lekki Phase 1",
    status: "delivered",
    time: "30 mins ago",
    driver: "Ahmed Bello",
  },
  {
    id: "#1237",
    customer: "Grace Okon",
    product: "Kerosene",
    quantity: "25L",
    address: "Surulere, Lagos",
    status: "assigned",
    time: "45 mins ago",
    driver: "Samuel Okafor",
  },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "delivered":
      return "bg-success text-success-foreground";
    case "in-transit":
      return "bg-primary text-primary-foreground";
    case "assigned":
      return "bg-warning text-warning-foreground";
    case "pending":
      return "bg-muted text-muted-foreground";
    default:
      return "bg-muted text-muted-foreground";
  }
};

export function RecentOrders() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Orders</CardTitle>
        <Button variant="outline" size="sm">
          View All
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-4">
                <Avatar>
                  <AvatarFallback>
                    {order.customer.split(" ").map(n => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{order.id}</span>
                    <Badge className={getStatusColor(order.status)}>
                      {order.status.replace("-", " ")}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {order.customer} • {order.product} ({order.quantity})
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {order.address}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {order.time}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {order.driver && (
                  <div className="text-right text-sm">
                    <div className="font-medium">{order.driver}</div>
                    <div className="text-xs text-muted-foreground">Driver</div>
                  </div>
                )}
                <Button variant="ghost" size="sm">
                  <Phone className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}