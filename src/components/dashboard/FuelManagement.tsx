import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Droplets, Fuel, Flame, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface FuelType {
  id: string;
  name: string;
  available: boolean;
  currentStock: number;
  capacity: number;
  unit: string;
  price: string;
  icon: any;
}

const initialFuelData: FuelType[] = [
  {
    id: "petrol",
    name: "Premium Petrol",
    available: true,
    currentStock: 2500,
    capacity: 3000,
    unit: "L",
    price: "₦617/L",
    icon: Fuel,
  },
  {
    id: "diesel",
    name: "Diesel",
    available: true,
    currentStock: 450,
    capacity: 2500,
    unit: "L",
    price: "₦750/L",
    icon: Droplets,
  },
  {
    id: "kerosene",
    name: "Kerosene",
    available: true,
    currentStock: 1200,
    capacity: 1500,
    unit: "L",
    price: "₦430/L",
    icon: Droplets,
  },
  {
    id: "gas",
    name: "Cooking Gas",
    available: false,
    currentStock: 85,
    capacity: 200,
    unit: "KG",
    price: "₦1,200/KG",
    icon: Flame,
  },
];

export function FuelManagement() {
  const [fuelData, setFuelData] = useState<FuelType[]>(initialFuelData);
  const { toast } = useToast();

  const handleAvailabilityChange = (id: string, available: boolean) => {
    setFuelData(prev => 
      prev.map(fuel => 
        fuel.id === id ? { ...fuel, available } : fuel
      )
    );
  };

  const handleStockChange = (id: string, newStock: number) => {
    setFuelData(prev => 
      prev.map(fuel => 
        fuel.id === id ? { ...fuel, currentStock: newStock } : fuel
      )
    );
  };

  const handleSaveChanges = () => {
    toast({
      title: "Changes Saved",
      description: "Fuel availability and stock levels have been updated successfully.",
    });
  };

  const getStockStatus = (current: number, capacity: number) => {
    const percentage = (current / capacity) * 100;
    if (percentage < 20) return { label: "Critical", variant: "destructive" as const };
    if (percentage < 50) return { label: "Low", variant: "secondary" as const };
    return { label: "Good", variant: "default" as const };
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Fuel className="w-5 h-5 text-primary" />
          Fuel Management
        </CardTitle>
        <Button onClick={handleSaveChanges} className="bg-success hover:bg-success/90">
          Save Changes
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {fuelData.map((fuel) => {
          const Icon = fuel.icon;
          const stockStatus = getStockStatus(fuel.currentStock, fuel.capacity);
          
          return (
            <div key={fuel.id} className="p-4 border border-border rounded-lg space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Icon className="w-6 h-6 text-primary" />
                  <div>
                    <h3 className="font-semibold">{fuel.name}</h3>
                    <p className="text-sm text-muted-foreground">{fuel.price}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant={stockStatus.variant}>
                    {stockStatus.label}
                  </Badge>
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`${fuel.id}-availability`} className="text-sm">
                      Available
                    </Label>
                    <Switch
                      id={`${fuel.id}-availability`}
                      checked={fuel.available}
                      onCheckedChange={(checked) => handleAvailabilityChange(fuel.id, checked)}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`${fuel.id}-stock`}>
                    Current Stock ({fuel.unit})
                  </Label>
                  <Input
                    id={`${fuel.id}-stock`}
                    type="number"
                    value={fuel.currentStock}
                    onChange={(e) => handleStockChange(fuel.id, Number(e.target.value))}
                    disabled={!fuel.available}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Capacity ({fuel.unit})</Label>
                  <Input
                    value={fuel.capacity}
                    disabled
                    className="bg-muted"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Stock Percentage</Label>
                  <div className="flex items-center gap-2 h-10">
                    <div className="flex-1 bg-muted rounded-md h-2">
                      <div 
                        className={`h-full rounded-md transition-all ${
                          stockStatus.variant === 'destructive' ? 'bg-destructive' :
                          stockStatus.variant === 'secondary' ? 'bg-warning' : 'bg-success'
                        }`}
                        style={{ width: `${Math.min((fuel.currentStock / fuel.capacity) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium min-w-[3rem]">
                      {Math.round((fuel.currentStock / fuel.capacity) * 100)}%
                    </span>
                  </div>
                </div>
              </div>

              {!fuel.available && (
                <div className="flex items-center gap-2 p-3 bg-warning/10 border border-warning/20 rounded-md">
                  <AlertTriangle className="w-4 h-4 text-warning" />
                  <span className="text-sm text-warning">
                    This fuel type is currently marked as unavailable
                  </span>
                </div>
              )}
            </div>
          );
        })}

        <div className="text-xs text-muted-foreground">
          Last updated: {new Date().toLocaleString()}
        </div>
      </CardContent>
    </Card>
  );
}