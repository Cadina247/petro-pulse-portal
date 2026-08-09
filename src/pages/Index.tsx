import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { IncomingOrders } from "@/components/dashboard/IncomingOrders";
import { RecentOrders } from "@/components/dashboard/RecentOrders";
import { FuelStockWidget } from "@/components/dashboard/FuelStockWidget";
import { EVChargingStatus } from "@/components/dashboard/EVChargingStatus";
import { FuelManagement } from "@/components/dashboard/FuelManagement";
import { OtherActivitiesManagement } from "@/components/dashboard/OtherActivitiesManagement";
import { RedeemToken } from "@/components/dashboard/RedeemToken";
import { StationProfile } from "@/components/dashboard/StationProfile";
import { AvailabilityToggle } from "@/components/dashboard/AvailabilityToggle";
import { WalletCredit } from "@/components/dashboard/WalletCredit";

import { useAccount } from "@/hooks/useAccount";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Index = () => {
  const { type, record } = useAccount();
  const isVendor = type === "vendor";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            {isVendor
              ? "Manage your retail vendor shop and availability"
              : "Welcome to your fuel station management portal"}
          </p>
        </div>

        <AvailabilityToggle />

        <WalletCredit />

        {isVendor ? (
          <>
            <div className="rounded-lg border p-6 space-y-3">
              <h2 className="text-xl font-semibold">{record?.business_name ?? "Your shop"}</h2>
              <p className="text-sm text-muted-foreground">{record?.address}</p>
              <p className="text-sm">
                Products: {(record?.products_sold ?? []).join(", ") || "—"}
              </p>
              <p className="text-sm">Estimated quantity: {record?.estimated_quantity || "—"}</p>
              <p className="text-sm">
                Delivery: {record?.delivery_available ? "Available" : "Not available"}
              </p>
              <Button asChild variant="outline">
                <Link to="/settings">Edit my details</Link>
              </Button>
            </div>

            <OtherActivitiesManagement accountType="vendor" />
          </>
        ) : (
          <>
            <DashboardStats />

            <IncomingOrders />

            <StationProfile />

            <FuelManagement />

            <OtherActivitiesManagement accountType="station" />



            <RedeemToken />

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <RecentOrders />
              </div>
              <div className="space-y-6">
                <FuelStockWidget />
                <EVChargingStatus />
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Index;
