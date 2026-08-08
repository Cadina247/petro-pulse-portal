import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MapPin, Clock, Phone, BellRing, Loader2 } from "lucide-react";
import { useOrders } from "@/hooks/useOrders";
import { useToast } from "@/hooks/use-toast";

const statusColor = (status: string) => {
  switch (status) {
    case "delivered":
      return "bg-success text-success-foreground";
    case "in-transit":
      return "bg-primary text-primary-foreground";
    case "accepted":
    case "assigned":
      return "bg-warning text-warning-foreground";
    case "cancelled":
      return "bg-destructive text-destructive-foreground";
    default:
      return "bg-muted text-muted-foreground";
  }
};

const nextActions: Record<string, { label: string; status: string }[]> = {
  pending: [
    { label: "Accept", status: "accepted" },
    { label: "Decline", status: "cancelled" },
  ],
  accepted: [{ label: "Mark in transit", status: "in-transit" }],
  assigned: [{ label: "Mark in transit", status: "in-transit" }],
  "in-transit": [{ label: "Mark delivered", status: "delivered" }],
};

export function IncomingOrders() {
  const { orders, loading, missingTable, pendingCount, updateStatus } = useOrders();
  const { toast } = useToast();

  const act = async (id: string, status: string) => {
    try {
      await updateStatus(id, status);
      toast({ title: "Order updated", description: `Status set to ${status}.` });
    } catch {
      toast({ title: "Could not update order", variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <BellRing className="w-5 h-5 text-primary" />
          Incoming Orders
        </CardTitle>
        {pendingCount > 0 && <Badge className="bg-warning text-warning-foreground">{pendingCount} new</Badge>}
      </CardHeader>
      <CardContent>
        {loading && (
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading orders…
          </p>
        )}

        {!loading && missingTable && (
          <p className="text-sm text-muted-foreground">
            Orders storage isn’t set up yet. Run <code>supabase/migrations_orders.sql</code> in your database, then
            reload to start receiving live orders from the mobile app.
          </p>
        )}

        {!loading && !missingTable && orders.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No orders yet. New orders from the mobile app will appear here instantly.
          </p>
        )}

        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 border rounded-lg hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-4">
                <Avatar>
                  <AvatarFallback>
                    {order.customer_name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {order.product_name} — {order.quantity}
                      {order.unit}
                    </span>
                    <Badge className={statusColor(order.status)}>{order.status.replace("-", " ")}</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {order.customer_name} • ₦{Number(order.total_amount).toLocaleString()}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    {order.delivery_address && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {order.delivery_address}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(order.created_at).toLocaleString()}
                    </span>
                    {order.customer_phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {order.customer_phone}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {(nextActions[order.status] ?? []).map((a) => (
                  <Button
                    key={a.status}
                    size="sm"
                    variant={a.status === "cancelled" ? "outline" : "default"}
                    onClick={() => act(order.id, a.status)}
                  >
                    {a.label}
                  </Button>
                ))}
                {order.customer_phone && (
                  <Button variant="ghost" size="sm" asChild aria-label="Call customer">
                    <a href={`tel:${order.customer_phone}`}>
                      <Phone className="w-4 h-4" />
                    </a>
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
