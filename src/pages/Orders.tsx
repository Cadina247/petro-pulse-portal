import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, BellRing, History } from "lucide-react";
import { useOrders } from "@/hooks/useOrders";
import { useToast } from "@/hooks/use-toast";
import { OrderCard } from "@/components/orders/OrderCard";

const Orders = () => {
  const {
    activeOrders,
    historyOrders,
    loading,
    missingTable,
    pendingCount,
    updateStatus,
    updatePaymentStatus,
  } = useOrders();
  const { toast } = useToast();

  const onStatus = async (id: string, status: string) => {
    try {
      await updateStatus(id, status);
      toast({ title: "Order updated", description: `Status set to ${status}.` });
    } catch {
      toast({ title: "Could not update order", variant: "destructive" });
    }
  };

  const onPayment = async (id: string, payment: string) => {
    try {
      await updatePaymentStatus(id, payment);
      toast({ title: "Payment status updated", description: `Marked as ${payment}.` });
    } catch {
      toast({ title: "Could not update payment status", variant: "destructive" });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground">
            Orders placed by customers in the mobile app arrive here in real time.
          </p>
        </div>

        <Tabs defaultValue="incoming">
          <TabsList>
            <TabsTrigger value="incoming" className="gap-2">
              <BellRing className="w-4 h-4" /> Incoming
              {pendingCount > 0 && (
                <Badge className="bg-warning text-warning-foreground">{pendingCount}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="w-4 h-4" /> Order history
            </TabsTrigger>
          </TabsList>

          <TabsContent value="incoming">
            <Card>
              <CardHeader>
                <CardTitle>Incoming & active orders</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading && (
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Loading orders…
                  </p>
                )}
                {!loading && missingTable && (
                  <p className="text-sm text-muted-foreground">Orders storage isn’t available.</p>
                )}
                {!loading && !missingTable && activeOrders.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No active orders. New mobile app orders appear here instantly.
                  </p>
                )}
                {activeOrders.map((o) => (
                  <OrderCard key={o.id} order={o} onStatus={onStatus} onPayment={onPayment} />
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Completed & cancelled orders</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {historyOrders.length === 0 && (
                  <p className="text-sm text-muted-foreground">No past orders yet.</p>
                )}
                {historyOrders.map((o) => (
                  <OrderCard key={o.id} order={o} onStatus={onStatus} onPayment={onPayment} readOnly />
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Orders;
