import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { RecentOrders } from "@/components/dashboard/RecentOrders";
import { FuelStockWidget } from "@/components/dashboard/FuelStockWidget";
import { EVChargingStatus } from "@/components/dashboard/EVChargingStatus";

const Index = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to your fuel station management portal
          </p>
        </div>
        
        <DashboardStats />
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <RecentOrders />
          </div>
          <div className="space-y-6">
            <FuelStockWidget />
            <EVChargingStatus />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Index;
