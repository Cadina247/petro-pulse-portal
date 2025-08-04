import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Zap, Clock, User, Battery } from "lucide-react";

const chargingPorts = [
  {
    id: "EV-01",
    type: "DC Fast",
    status: "charging",
    customer: "Alex Johnson",
    power: "45kW",
    timeRemaining: "25 mins",
    batteryLevel: 75,
  },
  {
    id: "EV-02",
    type: "Level 2",
    status: "available",
    customer: null,
    power: "0kW",
    timeRemaining: null,
    batteryLevel: null,
  },
  {
    id: "EV-03",
    type: "DC Fast",
    status: "charging",
    customer: "Sarah Wilson",
    power: "50kW",
    timeRemaining: "40 mins",
    batteryLevel: 60,
  },
  {
    id: "EV-04",
    type: "Level 2",
    status: "reserved",
    customer: "Mike Chen",
    power: "0kW",
    timeRemaining: "Starts in 15 mins",
    batteryLevel: null,
  },
  {
    id: "EV-05",
    type: "DC Fast",
    status: "out-of-order",
    customer: null,
    power: "0kW",
    timeRemaining: null,
    batteryLevel: null,
  },
  {
    id: "EV-06",
    type: "Level 2",
    status: "available",
    customer: null,
    power: "0kW",
    timeRemaining: null,
    batteryLevel: null,
  },
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case "charging":
      return <Badge className="bg-success text-success-foreground">Charging</Badge>;
    case "available":
      return <Badge variant="outline" className="text-success border-success">Available</Badge>;
    case "reserved":
      return <Badge className="bg-warning text-warning-foreground">Reserved</Badge>;
    case "out-of-order":
      return <Badge variant="destructive">Out of Order</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export function EVChargingStatus() {
  const activeCharging = chargingPorts.filter(port => port.status === "charging").length;
  const availablePorts = chargingPorts.filter(port => port.status === "available").length;
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          EV Charging Stations
        </CardTitle>
        <div className="text-sm text-muted-foreground">
          {activeCharging} active • {availablePorts} available
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          {chargingPorts.map((port) => (
            <div key={port.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg">
                  <Zap className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{port.id}</span>
                    <span className="text-sm text-muted-foreground">({port.type})</span>
                  </div>
                  {port.customer && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <User className="w-3 h-3" />
                      {port.customer}
                    </div>
                  )}
                  {port.timeRemaining && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {port.timeRemaining}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {port.batteryLevel && (
                  <div className="flex items-center gap-1 text-sm">
                    <Battery className="w-4 h-4 text-success" />
                    {port.batteryLevel}%
                  </div>
                )}
                <div className="text-right">
                  <div className="text-sm font-medium">{port.power}</div>
                  {getStatusBadge(port.status)}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 pt-4 border-t flex gap-2">
          <Button variant="outline" size="sm" className="flex-1">
            Manage Ports
          </Button>
          <Button variant="outline" size="sm" className="flex-1">
            View Bookings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}