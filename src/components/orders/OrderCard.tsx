import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Clock, MapPin, Phone, Package, Truck, Store } from "lucide-react";
import type { Order } from "@/hooks/useOrders";

export const statusColor = (status: string) => {
  switch (status) {
    case "delivered":
    case "completed":
      return "bg-success text-success-foreground";
    case "in-transit":
    case "processing":
      return "bg-primary text-primary-foreground";
    case "accepted":
    case "assigned":
      return "bg-warning text-warning-foreground";
    case "cancelled":
    case "rejected":
      return "bg-destructive text-destructive-foreground";
    default:
      return "bg-muted text-muted-foreground";
  }
};

const nextActions: Record<string, { label: string; status: string; variant?: "default" | "outline" | "destructive" }[]> = {
  pending: [
    { label: "Accept", status: "accepted" },
    { label: "Reject", status: "rejected", variant: "destructive" },
  ],
  accepted: [
    { label: "Start processing", status: "processing" },
    { label: "Cancel", status: "cancelled", variant: "outline" },
  ],
  assigned: [{ label: "Mark in transit", status: "in-transit" }],
  processing: [
    { label: "Mark in transit", status: "in-transit" },
    { label: "Mark completed", status: "completed", variant: "outline" },
  ],
  "in-transit": [{ label: "Mark delivered", status: "delivered" }],
};

interface Props {
  order: Order;
  onStatus: (id: string, status: string) => void;
  onPayment: (id: string, payment: string) => void;
  readOnly?: boolean;
}

export function OrderCard({ order, onStatus, onPayment, readOnly }: Props) {
  const actions = nextActions[order.status] ?? [];

  return (
    <div className="p-4 border rounded-lg space-y-3 hover:bg-muted/30 transition-colors">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold">#{order.order_number ?? order.id.slice(0, 6)}</span>
          <Badge className={statusColor(order.status)}>{order.status.replace("-", " ")}</Badge>
          <Badge variant={order.payment_status === "paid" ? "default" : "outline"}>
            {order.payment_status}
          </Badge>
        </div>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          {new Date(order.created_at).toLocaleString()}
        </span>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 text-sm">
        <div>
          <p className="font-medium">{order.customer_name}</p>
          {order.customer_phone && (
            <a
              href={`tel:${order.customer_phone}`}
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
            >
              <Phone className="w-3 h-3" />
              {order.customer_phone}
            </a>
          )}
        </div>
        <div className="sm:text-right">
          <p className="flex items-center gap-1 sm:justify-end">
            <Package className="w-3 h-3" />
            {order.product_name} — {order.quantity}
            {order.unit}
          </p>
          <p className="text-muted-foreground">
            ₦{Number(order.unit_price).toLocaleString()}/{order.unit} · Total ₦
            {Number(order.total_amount).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          {order.fulfillment_type === "delivery" ? (
            <Truck className="w-3 h-3" />
          ) : (
            <Store className="w-3 h-3" />
          )}
          {order.fulfillment_type === "delivery" ? "Delivery" : "Pickup"}
        </span>
        {order.delivery_address && (
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {order.delivery_address}
          </span>
        )}
      </div>

      {order.notes && <p className="text-xs text-muted-foreground italic">“{order.notes}”</p>}

      {!readOnly && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {actions.map((a) => (
            <Button
              key={a.status}
              size="sm"
              variant={a.variant ?? "default"}
              onClick={() => onStatus(order.id, a.status)}
            >
              {a.label}
            </Button>
          ))}
          <Select value={order.payment_status} onValueChange={(v) => onPayment(order.id, v)}>
            <SelectTrigger className="h-9 w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unpaid">Unpaid</SelectItem>
              <SelectItem value="pending">Payment pending</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
